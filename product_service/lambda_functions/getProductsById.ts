import {
  Context,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  APIGatewayEvent
} from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { IProduct, IStock } from './product.interface';


const defaultHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const STOCKS_TABLE = process.env.STOCKS_TABLE;
const REGION = process.env.REGION;

const dynamoDb = new DynamoDB.DocumentClient({
  region: REGION,
});

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log(`Event: ${JSON.stringify(event)}`);
  console.log(`Using tables - Products: ${PRODUCTS_TABLE}, Stocks: ${STOCKS_TABLE}, Region: ${REGION}`);

  try {
    const productId = event.pathParameters?.id;

    if (!productId) {
      return {
        statusCode: 400,
        headers: defaultHeaders,
        body: JSON.stringify({ message: 'Product ID is required' }),
      };
    }

    const productResult = await dynamoDb.get({
      TableName: PRODUCTS_TABLE,
      Key: { id: productId }
    }).promise();

    const product = productResult.Item as IProduct;

    if (!product) {
      return {
        statusCode: 404,
        headers: defaultHeaders,
        body: JSON.stringify({ message: `Product with ID ${productId} not found` }),
      };
    }

    const stockResult = await dynamoDb.get({
      TableName: STOCKS_TABLE,
      Key: { product_id: productId }
    }).promise();

    const stock = stockResult.Item as IStock;

    const productWithStock = {
      ...product,
      count: stock ? stock.count : 0
    };

    return {
      statusCode: 200,
      headers: defaultHeaders,
      body: JSON.stringify(productWithStock),
    };
  } catch (error) {
    console.error('Error fetching product from DynamoDB:', error);
    return {
      statusCode: 500,
      headers: defaultHeaders,
      body: JSON.stringify({
        message: 'Internal server error',
        error: error.message
      }),
    };
  }
};