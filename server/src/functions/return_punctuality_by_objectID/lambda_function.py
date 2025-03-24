import json
import boto3

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("punctuality_by_objectID")

def lambda_handler(event, context):
    try:
        response = table.scan()
        data = response.get("Items", [])

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps(data, default=str)  # Convert to JSON-safe format
        }
    except Exception as e:
        print(f"Error fetching data: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Failed to fetch punctuality data"})
        }
