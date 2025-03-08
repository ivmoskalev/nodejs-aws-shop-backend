import {
    Context,
    APIGatewayProxyHandler,
    APIGatewayProxyResult,
    APIGatewayEvent
  } from 'aws-lambda';
  import { DynamoDB } from 'aws-sdk';
  import { randomUUID as uuidv4 } from 'crypto';
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
      const requestBody = event.body ? JSON.parse(event.body) : null;

      // Validate input
      if (!requestBody) {
        return {
          statusCode: 400,
          headers: defaultHeaders,
          body: JSON.stringify({ message: 'Request body is required' }),
        };
      }

      const { title, description, price, count } = requestBody;

      // Validate required fields
      if (!title || price === undefined || price === null) {
        return {
          statusCode: 400,
          headers: defaultHeaders,
          body: JSON.stringify({
            message: 'Missing required fields',
            requiredFields: ['title', 'price']
          }),
        };
      }

      // Validate data types
      if (typeof title !== 'string' || typeof price !== 'number' || price < 0) {
        return {
          statusCode: 400,
          headers: defaultHeaders,
          body: JSON.stringify({
            message: 'Invalid data types',
            requirements: 'title must be a string, price must be a non-negative number'
          }),
        };
      }

      const productId = uuidv4();

      // Define stock count (default to 0 if not provided)
      const stockCount = count !== undefined && count !== null ? count : 0;

      // Using DynamoDB transaction to ensure atomicity
      const transactionParams = {
        TransactItems: [
          {
            Put: {
              TableName: PRODUCTS_TABLE,
              Item: {
                id: productId,
                title,
                description: description || '',
                price
              }
            }
          },
          {
            Put: {
              TableName: STOCKS_TABLE,
              Item: {
                product_id: productId,
                count: stockCount
              }
            }
          }
        ]
      };

      await dynamoDb.transactWrite(transactionParams).promise();

      const newProduct = {
        id: productId,
        title,
        description: description || '',
        price,
        count: stockCount
      };

      return {
        statusCode: 201,
        headers: defaultHeaders,
        body: JSON.stringify(newProduct),
      };
    } catch (error) {
      console.error('Error creating product in DynamoDB:', error);
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
