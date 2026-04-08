import app from './app';
import { getPool } from './infrastructure/database/pool';
import { runMigration as runUsersMigration } from './infrastructure/database/migrations/001_create_users';
import { runMigration as runGenotypicAnalysisMigration } from './infrastructure/database/migrations/002_create_genotypic_analysis';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    const pool = getPool();

    await pool.query('SELECT 1');
    console.log('Database connection established.');

    await runUsersMigration(pool);
    await runGenotypicAnalysisMigration(pool);

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();
