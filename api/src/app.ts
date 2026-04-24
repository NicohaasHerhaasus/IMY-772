import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './presentation/http/routes/auth.routes';
import genotypicAnalysisRoutes from './presentation/http/routes/genotypic-analysis.routes';
import uploadRoutes from './presentation/http/routes/upload.routes';
import isolatesRoutes from './presentation/http/routes/isolates.routes';
import sampleUploadRoutes from './presentation/http/routes/sample-upload.routes';
import mapAttachmentRoutes from './presentation/http/routes/map-attachment.routes';
import datafilesRoutes from './presentation/http/routes/datafiles.routes';
import datasetsRoutes from './presentation/http/routes/datasets.routes';
import chatbotRoutes from './presentation/http/routes/chatbot.routes';
import { errorMiddleware } from './presentation/http/middleware/error.middleware';
import queryBuilderRouter from './presentation/http/routes/query-builder.routes';


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
app.use('/api/map-attachments', mapAttachmentRoutes);
app.use('/api/datafiles', datafilesRoutes);
app.use('/api/datasets', datasetsRoutes);
app.use('/api/admin/chatbot', chatbotRoutes);
app.use('/api/query-builder', queryBuilderRouter);

app.use(errorMiddleware);

export default app;
