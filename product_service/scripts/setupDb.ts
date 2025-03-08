import { populateTables } from '../scripts/populateDb';

async function setup() {
  console.log('Starting database setup...');

  try {
    await populateTables();
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error during database setup:', error);
    process.exit(1);
  }
}

setup();