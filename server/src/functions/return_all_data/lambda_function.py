import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def lambda_handler(event, context):
    try:
        # Check if objectType is present in query string parameters
        if 'queryStringParameters' in event and event['queryStringParameters'] and 'objectType' in event['queryStringParameters']:
            objectType = event['queryStringParameters']['objectType']

            # Query using objectType as the key (assumes GSI is created on objectType)
            response = table.query(
                IndexName='objectTypeIndex',  # Name of GSI
                KeyConditionExpression=boto3.dynamodb.conditions.Key('objectType').eq(objectType)
            )
            items = response.get('Items', [])
        else:
            # Fallback to scanning the table (not recommended for large tables)
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
