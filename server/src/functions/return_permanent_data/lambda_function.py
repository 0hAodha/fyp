import json
import os
import boto3
from boto3.dynamodb.conditions import Key, Attr

os.environ.setdefault('AWS_DEFAULT_REGION', 'us-east-1')
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    table = dynamodb.Table(os.environ['TABLE_NAME'])

    try:
        if 'queryStringParameters' in event and event['queryStringParameters'] and 'objectType' in event[
            'queryStringParameters']:

            objectType = event['queryStringParameters']['objectType']
            object_types = objectType.split(',')

            items = []
            response = table.scan(
                FilterExpression=Attr('objectType').is_in(object_types)
            )
            items.extend(response.get('Items', []))

            # Handle pagination
            while 'LastEvaluatedKey' in response:
                response = table.scan(
                    FilterExpression=Attr('objectType').is_in(object_types),
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                items.extend(response.get('Items', []))
        else:
            # Fallback to scanning the entire table
            items = []
            response = table.scan()
            items.extend(response.get('Items', []))

            while 'LastEvaluatedKey' in response:
                response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                items.extend(response.get('Items', []))

        return {
            'statusCode': 200,
            'body': json.dumps(items, default=str)
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
