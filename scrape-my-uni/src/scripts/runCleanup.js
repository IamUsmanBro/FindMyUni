import { databaseCleanup } from '../utils/databaseCleanup';

async function runCleanup() {
  try {
    console.log('Starting database cleanup...');
    await databaseCleanup.cleanupCollections();
    console.log('Database cleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Run the cleanup
runCleanup(); 