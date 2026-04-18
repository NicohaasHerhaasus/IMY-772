import { Client } from 'pg';
import app from './app';
import { databaseConfig } from './config/database.config';
import { getPool } from './infrastructure/database/pool';
import { runMigration as runUsersMigration } from './infrastructure/database/migrations/001_create_users';
import { runMigration as runGenotypicAnalysisMigration } from './infrastructure/database/migrations/002_create_genotypic_analysis';
import { runMigration as runIsolatesMigration } from './infrastructure/database/migrations/003_create_isolates';
import { runMigration as runSamplesMigration } from './infrastructure/database/migrations/004_create_samples';
import { runMigration as runSamplesUniqueConstraintMigration } from './infrastructure/database/migrations/005_samples_unique_constraint';
import { runMigration as runExampleAmrFinderPlusMigration } from './infrastructure/database/migrations/006_create_example_amrfinder_plus';

const PORT = process.env.PORT || 3000;

/**
 * Connect to the maintenance "postgres" database and create the target
 * database + role if they don't already exist.
 */
async function ensureDatabaseExists(): Promise<void> {
  const targetDb = databaseConfig.database as string;
  const targetUser = databaseConfig.user as string;
  const targetPassword = databaseConfig.password as string;

  // Connect to the always-available "postgres" system database.
  const admin = new Client({
    host: databaseConfig.host,
    port: databaseConfig.port as number,
    user: databaseConfig.user,
    password: databaseConfig.password,
    // Try connecting as the configured user first; if that user IS postgres
    // this just works. If the role doesn't exist yet we fall back below.
    database: 'postgres',
  });

  try {
    await admin.connect();
  } catch {
    // If even the "postgres" db login fails, try with the postgres superuser
    // name in case the env user doesn't exist yet.
    const superAdmin = new Client({
      host: databaseConfig.host,
      port: databaseConfig.port as number,
      user: 'postgres',
      password: databaseConfig.password,
      database: 'postgres',
    });
    await superAdmin.connect();

    // Create the configured role if it doesn't exist.
    await superAdmin.query(
      `DO $$ BEGIN
         IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = $1) THEN
           EXECUTE format('CREATE USER %I WITH PASSWORD %L', $1, $2);
         END IF;
       END $$`,
      [targetUser, targetPassword],
    );
    console.log(`Role "${targetUser}" ensured.`);
    await superAdmin.end();

    // Now reconnect as the newly created (or existing) user.
    await admin.connect();
  }

  try {
    // Check whether the target database exists.
    const { rowCount } = await admin.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDb],
    );

    if (!rowCount || rowCount === 0) {
      // CREATE DATABASE cannot run inside a transaction; this is a plain statement.
      await admin.query(`CREATE DATABASE "${targetDb}" OWNER "${targetUser}"`);
      console.log(`Database "${targetDb}" created.`);
    } else {
      console.log(`Database "${targetDb}" already exists.`);
    }
  } finally {
    await admin.end();
  }
}

const startServer = async () => {
  try {
    await ensureDatabaseExists();

    const pool = getPool();
    await pool.query('SELECT 1');
    console.log('Database connection established.');

    await runUsersMigration(pool);
    await runGenotypicAnalysisMigration(pool);
    await runIsolatesMigration(pool);
    await runSamplesMigration(pool);
    await runSamplesUniqueConstraintMigration(pool);
    await runExampleAmrFinderPlusMigration(pool);

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
