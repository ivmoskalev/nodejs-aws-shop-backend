import { expect, jest, test, describe, beforeEach } from '@jest/globals';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { handler } from '../lambda_functions/getProductsById';

describe('getProductsById Lambda function', () => {
    let mockEvent: APIGatewayProxyEvent;
    let mockContext: Context;

    beforeEach(() => {
        mockEvent = {
            httpMethod: 'GET',
            path: '/products/1',
            pathParameters: { id: '1' },
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
            functionName: 'getProductsById',
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

    test('should return a product when valid ID is provided', async () => {
        const result = await handler(mockEvent, mockContext, () => { }) as APIGatewayProxyResult;

        expect(result.statusCode).toBe(200);
        expect(result.headers).toHaveProperty('Content-Type', 'application/json');
        expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');

        const product = JSON.parse(result.body);
        expect(product).toHaveProperty('id', '1');
        expect(product).toHaveProperty('title');
        expect(product).toHaveProperty('description');
        expect(product).toHaveProperty('price');
    });

    test('should return 404 when product is not found', async () => {
        mockEvent.pathParameters = { id: '999' };

        const result = await handler(mockEvent, mockContext, () => { }) as APIGatewayProxyResult;

        expect(result.statusCode).toBe(404);
        const body = JSON.parse(result.body);
        expect(body).toHaveProperty('message', 'Product with ID 999 not found');
    });

    test('should return 400 when ID is missing', async () => {
        mockEvent.pathParameters = null;

        const result = await handler(mockEvent, mockContext, () => { }) as APIGatewayProxyResult;

        expect(result.statusCode).toBe(400);
        const body = JSON.parse(result.body);
        expect(body).toHaveProperty('message', 'Product ID is required');
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
