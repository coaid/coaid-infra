import { 
    APIGatewayProxyEventV2,
    APIGatewayProxyStructuredResultV2,
    Context
} from "aws-lambda";

import {S3, DynamoDB} from "aws-sdk"

// S3 and DynamoDB client Objects
const s3: S3 = new S3(),
      dynamoDB: DynamoDB = new DynamoDB()

// Get Environment Variable Names
const donationHistoryBucketName = process.env.DONATION_HISTORY_BUCKET_NAME,
      donationTableName = process.env.DONATION_TABLE_NAME

/***
 * Export All Lambda Functions
 */
exports.insertDonationData = async (
    event: APIGatewayProxyEventV2, context: Context
): Promise<APIGatewayProxyStructuredResultV2> => {
    
    return {
        statusCode: 200,
        body: JSON.stringify({
            "message": "Hello From Lambda"
        })
    }
}