import { DynamoDB } from 'aws-sdk';
import { randomUUID as uuidv4 } from 'crypto';
import { IProduct } from '../lambda_functions/product.interface';

const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const sampleProducts: Omit<IProduct, 'id'>[] = [
  { title: 'Laptop', description: 'High-performance laptop with SSD', price: 999 },
  { title: 'Smartphone', description: 'Latest model with advanced camera', price: 699 },
  { title: 'Headphones', description: 'Noise-cancelling wireless headphones', price: 249 },
  { title: 'Smartwatch', description: 'Fitness tracking and notifications', price: 199 },
  { title: 'Tablet', description: '10-inch display with long battery life', price: 349 },
  { title: 'Camera', description: 'Digital SLR with multiple lenses', price: 899 },
  { title: 'Gaming Console', description: 'Next-gen gaming experience', price: 499 },
  { title: 'Bluetooth Speaker', description: 'Portable with waterproof design', price: 89 },
  { title: 'External Hard Drive', description: '2TB storage capacity', price: 129 },
  { title: 'Wireless Mouse', description: 'Ergonomic design with precision tracking', price: 39 }
];

async function createProduct(product: Omit<IProduct, 'id'>): Promise<string> {
  const productId = uuidv4();

  await dynamoDB.put({
    TableName: 'products',
    Item: {
      id: productId,
      title: product.title,
      description: product.description,
      price: product.price
    }
  }).promise();

  console.log(`Created product: ${product.title} with ID: ${productId}`);
  return productId;
}

async function createStock(productId: string, count: number): Promise<void> {
  await dynamoDB.put({
    TableName: 'stocks',
    Item: {
      product_id: productId,
      count: count
    }
  }).promise();

  console.log(`Created stock entry for product ID: ${productId} with count: ${count}`);
}

async function populateTables(): Promise<void> {
  try {
    console.log('Starting database population...');

    for (const product of sampleProducts) {
      // Create product and get its ID
      const productId = await createProduct(product);

      // Create a stock entry with a random count between 1 and 100
      const stockCount = Math.floor(Math.random() * 100) + 1;
      await createStock(productId, stockCount);
    }

    console.log('Database population completed successfully!');
  } catch (error) {
    console.error('Error populating database:', error);
    throw error;
  }
}

if (require.main === module) {
  populateTables()
    .then(() => console.log('Finished populating tables'))
    .catch(err => {
      console.error('Failed to populate tables:', err);
      process.exit(1);
    });
}

// Export the function to be used in other scripts if needed
export { populateTables };