import {
  Context,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  APIGatewayEvent
} from 'aws-lambda';
import { IProduct } from './product.interface';

// Mock data
const MOCK_PRODUCTS: IProduct[] = [
  {
    id: "1",
    title: "Product 1",
    description: "Product 1 description",
    price: 89.99
  },
  {
    id: "2",
    title: "Product 2",
    description: "Product 2 description",
    price: 110.50
  },
  {
    id: "3",
    title: "Product 3",
    description: "Product 3 description",
    price: 249.99
  }
];

const defaultHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    if (MOCK_PRODUCTS.length === 0) {
      return {
        statusCode: 404,
        headers: defaultHeaders,
        body: JSON.stringify({ message: 'No products found' }),
      };
    }

    return {
      statusCode: 200,
      headers: defaultHeaders,
      body: JSON.stringify(MOCK_PRODUCTS),
    };
  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      headers: defaultHeaders,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};