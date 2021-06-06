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
    
    // TODO: Clean code and move to service layer and model layer
    // Log the event
    console.log(event)

    // Parse the body
    const body = JSON.parse(event.body!)

    // Insert into DynamoDB Table
    try {
        const insertToDDB = await dynamoDB.putItem({
            TableName: donationTableName!,
            Item: {
                donation_id: {
                    S: body.donation_id
                },
                name: {
                    S: body.name
                },
                amount: {
                    S: body.amount
                }
            }
        }).promise()

        return {
            statusCode: 200,
            body: JSON.stringify({
                "message": insertToDDB
            })
        }

        
    } catch(e) {

        console.log(e.message);
        return {
            statusCode: 500,
            body: e.message
        }
    }
}