import json
import os
import boto3

os.environ.setdefault('AWS_DEFAULT_REGION', 'us-east-1')
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    table = dynamodb.Table("punctuality_by_timestamp")

    try:
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
