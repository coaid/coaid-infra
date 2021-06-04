import { BlockPublicAccess, Bucket, BucketEncryption } from '@aws-cdk/aws-s3'
import * as lambda from '@aws-cdk/aws-lambda-nodejs'
import { Runtime } from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb'

import * as cdk from '@aws-cdk/core'

import * as path from 'path'

export class CoaidInfraStack extends cdk.Stack {

  /**
   * CoaidInfraStack Resource Properties
   * --------------------------------------------
   */
  bucket: Bucket 
  insertDonationLambda: lambda.NodejsFunction
  getAllDonationsLambda: lambda.NodejsFunction
  donationsTable: dynamodb.Table

  /**
   * CoaidInfraStack Properties
   * @param scope 
   * @param id 
   * @param props 
   */
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

    // Create new private s3 bucket...
    this.bucket = new Bucket(this, 'CoaidDonationHistoryBucket', {
      encryption: BucketEncryption.S3_MANAGED,
      bucketName: 'coaid.donation.history-bucket',
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL
    })
  
    new cdk.CfnOutput(this, 'BucketNameExport', {
      value: this.bucket.bucketName,
      exportName: 'CoaidDonationHistoryBucketName'
    })
  }

  createLambdaFunctions(): void {

    this.insertDonationLambda = new lambda.NodejsFunction(this, 'insertDonationLambda',{
        runtime: Runtime.NODEJS_14_X,
        entry: path.join(__dirname, '..','coaid-lambda','controllers','handlers.ts'),
        handler: 'insertDonationData',
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
