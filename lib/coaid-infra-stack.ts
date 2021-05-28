import { Bucket, BucketEncryption } from '@aws-cdk/aws-s3';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';

import * as cdk from '@aws-cdk/core';

export class CoaidInfraStack extends cdk.Stack {

  // Stack Resources
  bucket: Bucket 
  insertDonationLambda: lambda.Function
  getAllDonationsLambda: lambda.Function
  donationsTable: dynamodb.Table

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // Create s3 buckets
    this.createS3Buckets()

    // Create DynamoDB Tables
    this.createDynamoDBTables()
    
    // Create Lambda Functions
    this.createLambdaFunctions()

  }

  createS3Buckets(): void {

    this.bucket = new Bucket(this, 'CoaidDonationHistoryBucket', {
      encryption: BucketEncryption.S3_MANAGED,
      bucketName: 'coaid.donation.history-bucket'
    })
  
    new cdk.CfnOutput(this, 'BucketNameExport', {
      value: this.bucket.bucketName,
      exportName: 'CoaidDonationHistoryBucketName'
    })
  }

  createLambdaFunctions(): void {

    // Create a Lambda Function for inserting donations into DynamoDB Table
    this.insertDonationLambda = new lambda.Function(this, 'insertDonationLambda',{
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('./coaid_lambda/controllers'),
      handler: 'handlers.insertDonationData',
      // Pass the dynamoDB Table name to the environment variable
      environment: {
        DONATION_TABLE_NAME: this.donationsTable.tableName
      }
    })

    // Give Lambda FullAccess Role
    this.donationsTable.grantFullAccess(this.insertDonationLambda);

  }

  createDynamoDBTables(): void {
    this.donationsTable = new dynamodb.Table(this, 'DonationsTable', {
      tableName: 'donations',

      // Partition Key
      partitionKey: {
        name: 'donation_id',
        type: dynamodb.AttributeType.STRING
      }
    })
  }

  createAPIGateway(): void {

  }
}
