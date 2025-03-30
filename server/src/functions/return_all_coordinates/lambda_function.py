import json
import os
import boto3
from boto3.dynamodb.conditions import Attr

os.environ.setdefault('AWS_DEFAULT_REGION', 'us-east-1')
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    table = dynamodb.Table(os.environ['TABLE_NAME'])

    try:
        # Step 1: Retrieve the latest timestamp
        items = []
        response = table.scan(
            ProjectionExpression="#ts",
            ExpressionAttributeNames={"#ts": "timestamp"}
        )
        items.extend(response.get('Items', []))

        while 'LastEvaluatedKey' in response:
            response = table.scan(
                ProjectionExpression="#ts",
                ExpressionAttributeNames={"#ts": "timestamp"},
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            items.extend(response.get('Items', []))

        if not items:
            return {'statusCode': 200, 'body': json.dumps({'coordinates': []})}

        newest_timestamp = max(int(item['timestamp']) for item in items)

        # Step 2: Get only items with that latest timestamp
        coordinates = []
        response = table.scan(
            FilterExpression=Attr('timestamp').eq(newest_timestamp)
        )

        for item in response.get('Items', []):
            if 'latitude' in item and 'longitude' in item:
                coordinates.append([item['latitude'], item['longitude']])

        while 'LastEvaluatedKey' in response:
            response = table.scan(
                FilterExpression=Attr('timestamp').eq(newest_timestamp),
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            for item in response.get('Items', []):
                if 'latitude' in item and 'longitude' in item:
                    coordinates.append([item['latitude'], item['longitude']])

        return {
            'statusCode': 200,
            'body': json.dumps({'coordinates': coordinates})
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
