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

export class ProductServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const nodejsFunctionProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 128,
      timeout: Duration.seconds(100),
      tracing: lambda.Tracing.ACTIVE,
    };

    const getProductsListFunction = new lambda_nodejs.NodejsFunction(this, 'GetProductsListHandler', {
      entry: './lambda_functions/getProductsList.ts',
      handler: 'handler',
      ...nodejsFunctionProps,
    });

    new CfnOutput(this, 'getProductsListFunction', {
      description: 'Lambda function used to show list of products',
      value: getProductsListFunction.functionName,
    });

    const getProductsByIdFunction = new lambda_nodejs.NodejsFunction(this, 'GetProductsByIdHandler', {
      entry: './lambda_functions/getProductsById.ts',
      handler: 'handler',
      ...nodejsFunctionProps,
    });

    new CfnOutput(this, 'getProductsByIdFunction', {
      description: 'Lambda function used to receive products by id',
      value: getProductsByIdFunction.functionName,
    });

    const api = new apigateway.RestApi(this, 'products-api', {
      deployOptions: {
        stageName: 'dev',
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
