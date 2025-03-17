import json
import os
import boto3

os.environ.setdefault('AWS_DEFAULT_REGION', 'us-east-1')
dynamodb = boto3.resource('dynamodb')


def lambda_handler(event, context):
    table = dynamodb.Table(os.environ['TABLE_NAME'])

    try:
        # Scan entire table and only extract latitude and longitude
        coordinates = []
        response = table.scan()

        for item in response.get('Items', []):
            if 'latitude' in item and 'longitude' in item:
                coordinates.append([item['latitude'], item['longitude']])

        # Handle pagination
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
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
