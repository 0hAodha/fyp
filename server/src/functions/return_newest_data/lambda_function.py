import boto3
import json
from boto3.dynamodb.conditions import Attr
import os

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def lambda_handler(event, context):
    try:
        # Scan the table to get all items
        response = table.scan(
            FilterExpression=Attr('timestamp').exists()
        )
        items = response['Items']

        newest_timestamp = max([int(item['timestamp'] for item in items)])
        newest_items = [item for item in items if int(item['timestamp']) == newest_timestamp]

        return {
            'statusCode': 200,
            'body': json.dumps(newest_items)
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
