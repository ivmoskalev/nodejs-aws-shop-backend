import {
  Aws,
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps,
  Tags
} from 'aws-cdk-lib';

import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambda_nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { config } from '../config';

export class ProductServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const productsTableName = config.dynamodb.tables.products;
    const stocksTableName = config.dynamodb.tables.stocks;
    const region = config.dynamodb.region;

    const productsTable = dynamodb.Table.fromTableName(this, 'ImportedProductsTable', productsTableName);
    const stocksTable = dynamodb.Table.fromTableName(this, 'ImportedStocksTable', stocksTableName);

    new CfnOutput(this, 'ProductsTable', {
      description: 'Products table name',
      value: productsTable.tableName,
    });

    new CfnOutput(this, 'StocksTable', {
      description: 'Stocks table name',
      value: stocksTable.tableName,
    });

    const nodejsFunctionProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 128,
      timeout: Duration.seconds(100),
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
        REGION: region,
      },
    };

    const getProductsListFunction = new lambda_nodejs.NodejsFunction(this, 'GetProductsListHandler', {
      entry: './lambda_functions/getProductsList.ts',
      handler: 'handler',
      ...nodejsFunctionProps,
    });

    productsTable.grantReadData(getProductsListFunction);
    stocksTable.grantReadData(getProductsListFunction);

    new CfnOutput(this, 'getProductsListFunction', {
      description: 'Lambda function used to show list of products',
      value: getProductsListFunction.functionName,
    });

    const getProductsByIdFunction = new lambda_nodejs.NodejsFunction(this, 'GetProductsByIdHandler', {
      entry: './lambda_functions/getProductsById.ts',
      handler: 'handler',
      ...nodejsFunctionProps,
    });

    productsTable.grantReadData(getProductsByIdFunction);
    stocksTable.grantReadData(getProductsByIdFunction);

    new CfnOutput(this, 'getProductsByIdFunction', {
      description: 'Lambda function used to receive products by id',
      value: getProductsByIdFunction.functionName,
    });

    const api = new apigateway.RestApi(this, 'products-api', {
      deployOptions: {
        stageName: config.api.stageName,
        tracingEnabled: true,
      }
    });

    Tags.of(api).add('Name', `${Aws.STACK_NAME}-api`);
    Tags.of(api).add('Stack', `${Aws.STACK_NAME}`);

    new CfnOutput(this, 'ProductsApi', {
      description: 'API Gateway endpoint URL',
      value: api.url,
    });

    const products = api.root.addResource('products');
    products.addMethod('GET', new apigateway.LambdaIntegration(getProductsListFunction));

    const product = products.addResource('{id}');
    product.addMethod('GET', new apigateway.LambdaIntegration(getProductsByIdFunction));
  }
}
