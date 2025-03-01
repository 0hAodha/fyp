import boto3
import json
import os

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])
gsi_name = "objectType-index"

def lambda_handler(event, context):
    try:
        query_params = event.get('queryStringParameters', {}) or {}
        object_type = query_params.get('objectType')

        # Step 1: Retrieve the latest timestamp
        if object_type:
            response = table.query(
                IndexName=gsi_name,
                KeyConditionExpression="objectType = :obj",
                ProjectionExpression="#ts",
                ExpressionAttributeNames={"#ts": "timestamp"},
                ExpressionAttributeValues={":obj": object_type},
                Limit=1,
                ScanIndexForward=False  # Get the latest timestamp
            )
        else:
            response = table.scan(
                ProjectionExpression="#ts",
                ExpressionAttributeNames={"#ts": "timestamp"}
            )

        if not response.get('Items'):
            return {'statusCode': 200, 'body': json.dumps([])}

        # Extract the newest timestamp
        newest_timestamp = max(int(item['timestamp']) for item in response['Items'])

        # Convert newest_timestamp to the correct type for DynamoDB comparison
        if object_type:
            response = table.query(
                IndexName=gsi_name,
                KeyConditionExpression="objectType = :obj AND #ts = :ts",
                ExpressionAttributeNames={"#ts": "timestamp"},
                ExpressionAttributeValues={
                    ":obj": object_type,
                    ":ts": str(newest_timestamp)  # Ensure correct type
                }
            )
        else:
            response = table.scan(
                FilterExpression="#ts = :ts",
                ExpressionAttributeNames={"#ts": "timestamp"},
                ExpressionAttributeValues={":ts": str(newest_timestamp)}  # Ensure correct type
            )

        return {
            'statusCode': 200,
            'body': json.dumps(response['Items'])
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
