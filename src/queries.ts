import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  user: process.env.DBUSER,
  host: process.env.DBHOST,
  database: process.env.DBNAME,
  password: process.env.DBPASSWORD,
  port: Number(process.env.DBPORT),
});

export default pool;
