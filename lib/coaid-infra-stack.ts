import { BlockPublicAccess, Bucket, BucketEncryption } from '@aws-cdk/aws-s3'
import * as lambda from '@aws-cdk/aws-lambda-nodejs'
import { Runtime } from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb'

import * as cdk from '@aws-cdk/core'
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment'

import * as path from 'path'
import { PolicyStatement } from '@aws-cdk/aws-iam';
import { CorsHttpMethod, HttpApi, HttpMethod } from '@aws-cdk/aws-apigatewayv2';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import { CfnOutput } from '@aws-cdk/core';

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

    // Create API Gateway
    this.createAPIGateway()

  }

  /**
   * Create s3 buckets
   */
  createS3Buckets(): void {

    // Create new private s3 bucket...
    this.bucket = new Bucket(this, 'CoaidDonationHistoryBucket', {
      encryption: BucketEncryption.S3_MANAGED,
      bucketName: 'coaid.donation.history-bucket',
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL
    })
  
    // new BucketDeployment(this, 'HistoryBucketDisployment',{
    //   sources: [
    //     Source.asset(path.join(__dirname,'..','assets'))
    //   ],
    //   destinationBucket: this.bucket
    // })

    new cdk.CfnOutput(this, 'BucketNameExport', {
      value: this.bucket.bucketName,
      exportName: 'CoaidDonationHistoryBucketName'
    })
  }

  /**
   * Create Lambda Functions
   */
  createLambdaFunctions(): void {

    this.insertDonationLambda = new lambda.NodejsFunction(this, 'insertDonationLambda',{
        runtime: Runtime.NODEJS_14_X,
        entry: path.join(__dirname, '..','coaid_lambda','controllers','handlers.ts'),
        handler: 'insertDonationData',
        // Pass the dynamoDB Table name to the environment variable
        environment: {
          DONATION_TABLE_NAME: this.donationsTable.tableName,
          DONATION_HISTORY_BUCKET_NAME: this.bucket.bucketName
        }
      })

    // Attach Permissions to Lambdas
    this.attachPermissionsToLambda()

  }

  /**
   * Method to Attach permissions to Lambdas
   */
  attachPermissionsToLambda(): void {
    // Create Policy Statement and Add s3 Bucket for accessing
    const bucketPermission = new PolicyStatement()
                                
    bucketPermission.addResources(this.bucket.bucketArn)
    bucketPermission.addActions('s3:*')

    // Assume Role for Lambda and Attack Bucket Access Policy
    this.insertDonationLambda.addToRolePolicy(bucketPermission)

    // Give Lambda FullAccess Role
    this.donationsTable.grantFullAccess(this.insertDonationLambda);
  }

  /**
   * Method to create DynamoDB Tables
   */
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

  /**
   * Method to create API Gateway
   */
  createAPIGateway(): void {
    const httpApi = new HttpApi(this, 'CoaidApiGateway',{
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [ CorsHttpMethod.ANY ]
      },
      apiName: 'coaid-api',
      createDefaultStage: true
    })

    // Create API Integration with Lambda
    const lambdaIntegration = new LambdaProxyIntegration({
      handler: this.insertDonationLambda
    })

    // Add Routes
    httpApi.addRoutes({
      path: '/insert-donation',
      methods: [
        HttpMethod.GET,
        HttpMethod.POST
      ],
      integration: lambdaIntegration
    })

    // Output API URL
    new CfnOutput(this, 'InsertDonationAPI',{
      value: httpApi.url!,
      exportName: 'InsertDonationAPIName'
    })
  }
}
