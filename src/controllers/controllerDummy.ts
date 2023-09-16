import { Request, Response } from 'express';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  user: process.env.DBUSER,
  host: process.env.DBHOST,
  database: process.env.DBNAME,
  password: process.env.DBPASSWORD,
  port: Number(process.env.DBPORT),
});

export const shutdownDummy = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  console.log(id);

  const response = await pool.query('SELECT * FROM devices WHERE id = $1', [id]);
  const { username, ip } = response.rows[0];

  let shutdown = '';

  setTimeout(() => {
    console.log(username, ip);
    shutdown = 'connection closed by remote host';
  }, 5000);

  res.status(200).json({ status: shutdown });
};

export const wolDummy = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  const response = await pool.query('SELECT * FROM devices WHERE id = $1', [id]);
  const mac = response.rows[0].mac;

  let wake = '';

  setTimeout(() => {
    console.log(mac);
    wake = 'Magic packet sent';
  }, 500);

  res.status(200).json({ status: wake });
};
