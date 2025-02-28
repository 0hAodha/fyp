import boto3
import json
from boto3.dynamodb.conditions import Attr
import os

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def lambda_handler(event, context):
    try:
        response = table.scan(
            FilterExpression=Attr('timestamp').exists()
        )
        items = response['Items']

        newest_timestamp = max([int(item['timestamp']) for item in items])
        newest_items = [item for item in items if int(item['timestamp']) == newest_timestamp]

        # assuming that filtering by timestamp first makes sense, as we expect to have a lot of historical data and not many object types
        if 'queryStringParameters' in event and event['queryStringParameters'] and 'objectType' in event['queryStringParameters']:
            newest_items = [item for item in items if item['objectType'] == event['queryStringParameters']['objectType']]

        return {
            'statusCode': 200,
            'body': json.dumps(newest_items)
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
