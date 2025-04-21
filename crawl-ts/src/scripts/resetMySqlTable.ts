import { Sequelize } from 'sequelize';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Create a readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptConfirmation(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(`${message} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function resetTableData() {
  // Get command line arguments for table name

  const dryRun = process.argv.includes('--dry-run');


  const tableName = process.env.MYSQL_RECRUIT_TABLE;

  // MySQL connection settings
  const dbConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    username: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'crawl_db'
  };

  console.log('=== MySQL Table Data Reset Tool ===');
  console.log(`Target Table: ${tableName}`);

  if (dryRun) {
    console.log('Running in DRY RUN mode - no changes will be made to the database');
  }

  // Initialize Sequelize connection
  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: 'mysql',
      logging: false
    }
  );

  try {
    // Test connection
    console.log('Connecting to MySQL...');
    await sequelize.authenticate();
    console.log('Connected to MySQL successfully');

    // Check if table exists
    const [tables] = await sequelize.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = :database AND TABLE_NAME = :tableName`,
      {
        replacements: {
          database: dbConfig.database,
          tableName: tableName
        }
      }
    );

    if (Array.isArray(tables) && tables.length === 0) {
      console.error(`Error: Table '${tableName}' does not exist in database '${dbConfig.database}'`);
      return;
    }

    // Get record count before deletion
    const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    const recordCount = Array.isArray(countResult) && countResult.length > 0
      ? (countResult[0] as any).count
      : 0;

    console.log(`Table '${tableName}' contains ${recordCount} records`);

    if (recordCount === 0) {
      console.log('Table is already empty. Nothing to reset.');
      return;
    }

    // Get table information for informational purposes
    const [columns] = await sequelize.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = :database AND TABLE_NAME = :tableName`,
      {
        replacements: {
          database: dbConfig.database,
          tableName: tableName
        }
      }
    );

    console.log('\nTable structure:');
    console.table(columns);

    // Confirm before proceeding
    if (!dryRun) {
      const confirmed = await promptConfirmation(
        `\nWARNING: This will permanently delete ALL ${recordCount} records from '${tableName}'. Continue?`
      );

      if (!confirmed) {
        console.log('Operation cancelled by user.');
        return;
      }

      // Double-confirm for tables with many records
      if (recordCount > 1000) {
        const doubleConfirmed = await promptConfirmation(
          `\nSERIOUS WARNING: You are about to delete ${recordCount} records. This cannot be undone. Really continue?`
        );

        if (!doubleConfirmed) {
          console.log('Operation cancelled by user.');
          return;
        }
      }
    }

    // Perform the deletion
    console.log(`\nResetting table '${tableName}'...`);

    if (!dryRun) {
      // Temporarily disable foreign key checks to avoid constraint issues
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

      // Use TRUNCATE for faster deletion when possible
      try {
        await sequelize.query(`TRUNCATE TABLE ${tableName}`);
        console.log(`Table '${tableName}' has been truncated successfully.`);
      } catch (truncateError) {
        console.warn(`Truncate failed, falling back to DELETE: ${(truncateError as Error).message}`);

        // If TRUNCATE fails (e.g., due to triggers or other restrictions), use DELETE
        const [deleteResult] = await sequelize.query(`DELETE FROM ${tableName}`);
        console.log(`Deleted all records from '${tableName}' using DELETE statement.`);

        // Reset auto-increment if it exists
        try {
          await sequelize.query(`ALTER TABLE ${tableName} AUTO_INCREMENT = 1`);
          console.log(`Reset AUTO_INCREMENT counter for '${tableName}'`);
        } catch (alterError) {
          // This might fail if the table doesn't have an auto-increment column
          console.log('Note: Could not reset AUTO_INCREMENT (table may not have an auto-increment column)');
        }
      }

      // Re-enable foreign key checks
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    } else {
      console.log(`DRY RUN: Would have deleted all ${recordCount} records from '${tableName}'`);
    }

    // Verify the deletion
    if (!dryRun) {
      const [verifyResult] = await sequelize.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const newCount = Array.isArray(verifyResult) && verifyResult.length > 0
        ? (verifyResult[0] as any).count
        : 0;

      console.log(`\nVerification: Table '${tableName}' now contains ${newCount} records`);

      if (newCount === 0) {
        console.log('✅ Reset completed successfully!');
      } else {
        console.warn('⚠️ Some records remain in the table. The reset may not have been complete.');
      }
    }

  } catch (error) {
    console.error('Error resetting table data:', error);
  } finally {
    await sequelize.close();
    rl.close();
    console.log('MySQL connection closed');
  }
}

// Run the table reset
resetTableData().catch(console.error);