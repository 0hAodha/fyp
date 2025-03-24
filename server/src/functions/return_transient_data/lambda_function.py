import boto3
import json
import os
from boto3.dynamodb.conditions import Key, Attr

os.environ.setdefault('AWS_DEFAULT_REGION', 'us-east-1')
dynamodb = boto3.resource('dynamodb')
gsi_name = "objectType-index"

def lambda_handler(event, context):
    table = dynamodb.Table(os.environ['TABLE_NAME'])

    try:
        query_params = event.get('queryStringParameters', {}) or {}
        object_type_param = query_params.get('objectType')

        # Handle multiple object types if provided
        if object_type_param:
            object_types = [obj.strip() for obj in object_type_param.split(',')]
        else:
            object_types = []

        # Step 1: Retrieve the latest timestamp
        items = []

        if object_types:
            # Scan with a filter for multiple object types to get timestamps
            response = table.scan(
                FilterExpression=Attr('objectType').is_in(object_types),
                ProjectionExpression="#ts",
                ExpressionAttributeNames={"#ts": "timestamp"}
            )
            items.extend(response.get('Items', []))

            # Handle pagination if necessary
            while 'LastEvaluatedKey' in response:
                response = table.scan(
                    FilterExpression=Attr('objectType').is_in(object_types),
                    ProjectionExpression="#ts",
                    ExpressionAttributeNames={"#ts": "timestamp"},
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                items.extend(response.get('Items', []))
        else:
            # Scan the entire table if no object types are specified
            response = table.scan(
                ProjectionExpression="#ts",
                ExpressionAttributeNames={"#ts": "timestamp"}
            )
            items.extend(response.get('Items', []))

            # Handle pagination if necessary
            while 'LastEvaluatedKey' in response:
                response = table.scan(
                    ProjectionExpression="#ts",
                    ExpressionAttributeNames={"#ts": "timestamp"},
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                items.extend(response.get('Items', []))

        if not items:
            return {'statusCode': 200, 'body': json.dumps([])}

        # Extract the newest timestamp
        newest_timestamp = max(int(item['timestamp']) for item in items)

        # Step 2: Fetch items with the newest timestamp for the specified object types
        items_with_latest_timestamp = []

        if object_types:
            response = table.scan(
                FilterExpression=Attr('objectType').is_in(object_types) & Attr('timestamp').eq(str(newest_timestamp))
            )
            items_with_latest_timestamp.extend(response.get('Items', []))

            # Handle pagination if necessary
            while 'LastEvaluatedKey' in response:
                response = table.scan(
                    FilterExpression=Attr('objectType').is_in(object_types) & Attr('timestamp').eq(str(newest_timestamp)),
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                items_with_latest_timestamp.extend(response.get('Items', []))
        else:
            # Scan the entire table for the latest timestamp if no object types are specified
            response = table.scan(
                FilterExpression=Attr('timestamp').eq(str(newest_timestamp))
            )
            items_with_latest_timestamp.extend(response.get('Items', []))

            # Handle pagination if necessary
            while 'LastEvaluatedKey' in response:
                response = table.scan(
                    FilterExpression=Attr('timestamp').eq(str(newest_timestamp)),
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                items_with_latest_timestamp.extend(response.get('Items', []))

        return {
            'statusCode': 200,
            'body': json.dumps(items_with_latest_timestamp, default=str)
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
