import { Pool } from 'pg';
import 'dotenv/config';
import { Request, Response } from 'express';
import { sign } from 'jsonwebtoken';
import ping from 'ping';
import { wake } from 'wol';
import { exec } from 'child_process';
import bcrypt from 'bcrypt';

const pool = new Pool({
  user: process.env.DBUSER,
  host: process.env.DBHOST,
  database: process.env.DBNAME,
  password: process.env.DBPASSWORD,
  port: Number(process.env.DBPORT),
});

async function generateJwt(username: string, expSeconds: number) {
  const tokenSecret = process.env.TOKEN_SECRET;

  if (tokenSecret) {
    return sign({ username: username }, tokenSecret, { expiresIn: `${expSeconds}s` });
  } else {
    throw new Error('No TOKEN_SECRET variable set');
  }
}

export const getDevices = async (req: Request, res: Response) => {
  const response = await pool.query('SELECT * FROM devices');
  res.status(200).json(response.rows);
};

export const getDeviceById = async (req: Request, res: Response) => {
  const id = req.params.id;
  const response = await pool.query('SELECT * FROM devices WHERE id = $1', [id]);
  res.json(response.rows);
};

export const createDevice = async (req: Request, res: Response) => {
  // const id = parseInt(req.params.id);
  const { devicename, username, ip, mac, devicetype } = req.body;

  const response = await pool.query(
    'INSERT INTO devices (devicename, username, ip, mac, devicetype) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [devicename, username, ip, mac, devicetype],
  );

  res.status(201).json(response.rows[0]);
};

export const updateDevice = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { devicename, username, ip, mac, devicetype } = req.body;

  console.log(devicename, username, ip, mac, id);

  const response = await pool.query(
    'UPDATE devices SET devicename = $1, username = $2, ip = $3, mac = $4, devicetype = $6 WHERE id = $5 RETURNING devicename, username, ip, mac, id',
    [devicename, username, ip, mac, id, devicetype],
  );

  res.status(200).json(response.rows[0]);
};

export const removeDevice = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const response = await pool.query('DELETE FROM devices WHERE id = $1', [id]);
  console.log(response);

  res.status(200).json({ id: id });
};

export const registerUser = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const passwordHash = await bcrypt.hash(password, 10);

  const response = await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, passwordHash]);

  res.status(200).json({ status: response });
};

export const loginUser = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const response = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

  if (response.rows[0]) {
    const match = await bcrypt.compare(password, response.rows[0].password);

    if (match) {
      const jwtExpSeconds = 86400;
      const jwtToken = await generateJwt(username, jwtExpSeconds);
      res.status(200).json({ success: true, token: jwtToken, exp: jwtExpSeconds });
    } else {
      res.status(401).json({ success: false });
    }
  } else {
    res.status(401).json({ success: false });
  }
};

export const pingDevice = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const response = await pool.query('SELECT * FROM devices WHERE id = $1', [id]);
  const ip = response.rows[0].ip;

  const pingResponse = await ping.promise.probe(ip, { timeout: 1, extra: ['-c', '1'] });
  const alive = pingResponse.alive;

  res.status(200).json({ status: alive });
};

export const wolDevice = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const response = await pool.query('SELECT * FROM devices WHERE id = $1', [id]);
  const mac = response.rows[0].mac;

  wake(mac, (error, results) => {
    console.log(error);
    console.log(results);
    if (error) {
      res.status(400).json({ status: error });
    } else {
      res.status(200).json({ status: results });
    }
  });
};

export const shutdownDevice = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const response = await pool.query('SELECT * FROM devices WHERE id = $1', [id]);
  const { username, ip } = response.rows[0];

  exec(`ssh ${username}@${ip} sudo shutdown -h now`, (error, results) => {
    console.log(error);
    console.log(results);
    if (error) {
      if (error.code == 255) {
        res.status(200).json({ status: error }); // This error is expected behavior when executing a shutdown from SSH
      } else {
        res.status(400).json({ status: error });
      }
    } else {
      res.status(200).json({ status: results });
    }
  });
};

export default pool;
