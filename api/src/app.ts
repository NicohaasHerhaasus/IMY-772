import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import itemRoutes from './presentation/http/routes/item.routes';

// Load environment variables
dotenv.config();

const app: Application = express();

// Global Middleware
app.use(express.json());
app.use(cors());

// A simple health check route to verify it works
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Server is running perfectly.' });
});

// API — clean architecture: routes → controller → service → repository (mock)
app.use('/api/items', itemRoutes);

export default app;  
