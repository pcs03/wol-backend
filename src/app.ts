import express, { Application, Request, Response } from 'express';
import bodyParser from 'body-parser';
import 'dotenv/config';
import pool from './queries';
import { sign } from 'jsonwebtoken';
import exp from 'constants';
import cors from 'cors';
import { exec } from 'child_process';
import ping from 'ping';
import { wake } from 'wol';

const app: Application = express();

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);
app.use(cors());

function generateJwt(username: string, expSeconds: number) {
  const tokenSecret = process.env.TOKEN_SECRET;

  if (tokenSecret) {
    return sign({ username: username }, tokenSecret, { expiresIn: `${expSeconds}s` });
  } else {
    throw new Error('No TOKEN_SECRET variable set');
  }
}

async function pingDevice(ip: string) {
  const config = {
    timeout: 1,
    extra: ['-c', '1'],
  };
  const response = await ping.promise.probe(ip, config);
  return response.alive;
}

app
  .route('/devices')
  .get((req, res) => {
    pool.query('SELECT * FROM devices', (error, results) => {
      if (error) {
        throw error;
      }
      res.json(results.rows);
    });
  })
  .post((req, res) => {
    const { devicename, username, ip, mac } = req.body;
    pool.query(
      'INSERT INTO devices (devicename, username, ip, mac) VALUES ($1, $2, $3, $4) RETURNING *',
      [devicename, username, ip, mac],
      (error, results) => {
        if (error) {
          throw error;
        }

        pool.query('SELECT * FROM devices', (error, results) => {
          if (error) {
            throw error;
          }
          res.status(200).json(results.rows);
        });
      },
    );
  });

app
  .route('/devices/:id')
  .get((req, res) => {
    const id = parseInt(req.params.id);

    pool.query('SELECT * FROM devices WHERE id = $1', [id], (error, results) => {
      if (error) {
        throw error;
      }
      res.status(200).json(results.rows);
    });
  })
  .put((req, res) => {
    const id = parseInt(req.params.id);
    const { devicename, username, ip, mac } = req.body;

    pool.query(
      'UPDATE devices SET devicename = $1, username = $2, ip = $3, mac = $4 WHERE id = $5',
      [devicename, username, ip, mac, id],
      (error, results) => {
        if (error) {
          throw error;
        }
        res.status(200).send(`Device modified with ID: ${id}`);
      },
    );
  })
  .delete((req, res) => {
    const id = parseInt(req.params.id);

    pool.query('DELETE FROM devices WHERE id = $1', [id], (error, results) => {
      if (error) {
        throw error;
      }

      pool.query('SELECT * FROM devices', (error, results) => {
        if (error) {
          throw error;
        }
        res.status(200).json(results.rows);
      });
    });
  });

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  pool.query('SELECT FROM users WHERE username = $1 AND password = $2', [username, password], (error, results) => {
    if (error) {
      throw error;
    }

    const jwtExpSeconds = 3600;

    if (results.rows.length > 0) {
      res.status(200).json({ success: true, token: generateJwt(username, jwtExpSeconds), exp: jwtExpSeconds });
    } else {
      res.status(200).json({ success: false });
    }
  });
});

app.get('/wol/:device', (req, res) => {
  const id = parseInt(req.params.device);

  pool.query('SELECT * FROM devices WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error;
    }

    if (results.rows.length > 0) {
      wake(results.rows[0].mac, (error, results) => {
        console.log(results);
        res.status(200).json({ status: results });
      });
    }
  });
});

app.post('/shutdown/:device', (req, res) => {
  const id = parseInt(req.params.device);

  pool.query('SELECT * FROM devices WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error;
    }

    const rows = results.rows;

    if (rows.length > 0) {
      const username = rows[0].username;
      const ip = rows[0].ip;

      const shutdown = exec(`ssh ${username}@${ip} sudo shutdown -h now`);
      console.log(shutdown);
      // res.status(200).send(`mac: ${results.rows[0].mac}`);
    }
  });
});

app.get('/ping/:device', (req, res) => {
  const id = parseInt(req.params.device);

  pool.query('SELECT * FROM devices WHERE id = $1', [id], async (error, results) => {
    if (error) {
      throw error;
    }

    if (results.rows.length > 0) {
      const ping = await pingDevice(results.rows[0].ip);

      res.status(200).json({ status: ping });
    } else {
      throw new Error('Undefined ip address');
    }
  });
});

app.listen(process.env.PORT, (): void => {
  console.log('Running on port', process.env.PORT);
});
