import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './presentation/http/routes/auth.routes';
import genotypicAnalysisRoutes from './presentation/http/routes/genotypic-analysis.routes';
import uploadRoutes from './presentation/http/routes/upload.routes';
import isolatesRoutes from './presentation/http/routes/isolates.routes';
import sampleUploadRoutes from './presentation/http/routes/sample-upload.routes';
import { errorMiddleware } from './presentation/http/middleware/error.middleware';

dotenv.config();

const app: Application = express();

app.use(express.json());
app.use(cors());

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Server is running perfectly.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/genotypic-analysis', genotypicAnalysisRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/isolates', isolatesRoutes);
app.use('/api/samples', sampleUploadRoutes);

app.use(errorMiddleware);

export default app;
