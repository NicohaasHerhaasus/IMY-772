import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './presentation/http/routes/auth.routes';
import { errorMiddleware } from './presentation/http/middleware/error.middleware';

dotenv.config();

const app: Application = express();

app.use(express.json());
app.use(cors());

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Server is running perfectly.' });
});

app.use('/api/auth', authRoutes);

app.use(errorMiddleware);

export default app;
