import boto3
import json
import os

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def lambda_handler(event, context):
    try:
        items = []
        response = table.scan()

        items.extend(response.get('Items', []))

        # continue to scan while there are more pages
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            items.extend(response.get('Items', []))

        if 'queryStringParameters' in event and event['queryStringParameters'] and 'objectType' in event['queryStringParameters']:
            objectType = event['queryStringParameters']['objectType']
            items = [item for item in items if item['objectType'] == objectType]

        return {
            'statusCode': 200,
            'body': json.dumps(items)
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
