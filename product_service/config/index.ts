export const config = {
    dynamodb: {
      tables: {
        products: 'products',
        stocks: 'stocks'
      },
      region: process.env.AWS_REGION || 'us-east-1'
    },
    api: {
      stageName: 'dev'
    }
  };
