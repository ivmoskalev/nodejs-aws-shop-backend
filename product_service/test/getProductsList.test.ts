import { expect, jest, test, describe, beforeEach } from '@jest/globals';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { handler } from '../lambda_functions/getProductsList';

describe('getProductsList Lambda function', () => {
  let mockEvent: APIGatewayProxyEvent;
  let mockContext: Context;

  beforeEach(() => {
    mockEvent = {
      httpMethod: 'GET',
      path: '/products',
      pathParameters: null,
      queryStringParameters: null,
      body: null,
      headers: {},
      multiValueHeaders: {},
      isBase64Encoded: false,
      requestContext: {} as any,
      resource: '',
      multiValueQueryStringParameters: null,
      stageVariables: null,
    };

    mockContext = {
      callbackWaitsForEmptyEventLoop: true,
      functionName: 'getProductsList',
      functionVersion: '1',
      invokedFunctionArn: '',
      memoryLimitInMB: '128',
      awsRequestId: '123',
      logGroupName: '',
      logStreamName: '',
      getRemainingTimeInMillis: () => 1000,
      done: () => { },
      fail: () => { },
      succeed: () => { },
    };
  });

  test('should return a list of products', async () => {
    const result = await handler(mockEvent, mockContext, () => { }) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(200);
    expect(result.headers).toHaveProperty('Content-Type', 'application/json');
    expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');

    const body = JSON.parse(result.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    const product = body[0];
    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('title');
    expect(product).toHaveProperty('description');
    expect(product).toHaveProperty('price');
  });

  test('should handle server errors', async () => {
    // Mock implementation to simulate an error
    jest.spyOn(JSON, 'stringify').mockImplementationOnce(() => {
      throw new Error('Test error');
    });

    const result = await handler(mockEvent, mockContext, () => { }) as APIGatewayProxyResult;
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('message', 'Internal server error');
  });
});
