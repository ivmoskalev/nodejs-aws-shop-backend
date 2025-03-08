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
    const productsResult = await dynamoDb.scan({
      TableName: PRODUCTS_TABLE
    }).promise();

    const products = productsResult.Items as IProduct[];

    if (!products || products.length === 0) {
      return {
        statusCode: 404,
        headers: defaultHeaders,
        body: JSON.stringify({ message: 'No products found' }),
      };
    }

    const stocksResult = await dynamoDb.scan({
      TableName: STOCKS_TABLE
    }).promise();

    const stocks = stocksResult.Items as IStock[];

    const productsWithStock = products.map(product => {
      const stockItem = stocks.find(stock => stock.product_id === product.id);
      return {
        ...product,
        count: stockItem ? stockItem.count : 0
      };
    });

    return {
      statusCode: 200,
      headers: defaultHeaders,
      body: JSON.stringify(productsWithStock),
    };
  } catch (error) {
    console.error('Error fetching products from DynamoDB:', error);
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