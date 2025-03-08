import json
import os
import boto3
from boto3.dynamodb.conditions import Key, Attr

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])


def lambda_handler(event, context):
    try:
        # Check if objectType is present in query string parameters
        if 'queryStringParameters' in event and event['queryStringParameters'] and 'objectType' in event[
            'queryStringParameters']:
            # Get objectType values and split by comma if multiple values are present
            objectType = event['queryStringParameters']['objectType']
            object_types = objectType.split(',')

            # Fetch items matching any of the object types using a scan with FilterExpression
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
            'body': json.dumps(items)
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
