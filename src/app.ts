import express, { Application, Request, Response } from 'express';
import bodyParser from 'body-parser';
import 'dotenv/config';
import cors from 'cors';
import router from './routes/routes';

const app: Application = express();

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);
app.use(cors());

app.use(router);

app.listen(process.env.PORT, (): void => {
  console.log('Running on port', process.env.PORT);
});
