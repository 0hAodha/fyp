import json
import boto3
import requests
import os
from decimal import Decimal

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("punctuality_by_objectID")
API_URL = "https://your-api-endpoint.com"  # Replace with your actual API URL


def fetch_train_data():
    response = requests.get(API_URL)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to fetch data: {response.status_code}")
        return []


def update_punctuality(objectID, new_punctuality):
    new_punctuality = Decimal(str(new_punctuality))  # Ensure Decimal type for DynamoDB
    response = table.get_item(Key={"objectID": objectID})
    if "Item" in response:
        item = response["Item"]
        old_avg = Decimal(str(item["average_punctuality"]))
        count = int(item["count"])

        # Calculate new average
        new_avg = ((old_avg * count) + new_punctuality) / (count + 1)
        count += 1

        # Update the DynamoDB table
        table.update_item(
            Key={"objectID": objectID},
            UpdateExpression="SET average_punctuality = :avg, count = :cnt",
            ExpressionAttributeValues={":avg": new_avg, ":cnt": count}
        )
    else:
        # Insert new train punctuality record
        table.put_item(
            Item={"objectID": objectID, "average_punctuality": new_punctuality, "count": 1}
        )


def lambda_handler(event, context):
    train_data = fetch_train_data()
    for train in train_data:
        objectID = train.get("objectID")
        punctuality = int(train.get("trainPunctuality", 0))

        if objectID:
            update_punctuality(objectID, punctuality)

    return {
        "statusCode": 200,
        "body": json.dumps("Punctuality data updated successfully")
    }
