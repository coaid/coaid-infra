import { 
    APIGatewayProxyEventV2,
    APIGatewayProxyStructuredResultV2,
    Context
} from "aws-lambda";

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