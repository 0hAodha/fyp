import json
import boto3
import requests
import os
from decimal import Decimal

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("punctuality_by_objectID")
API_URL = "https://281bc6mcm5.execute-api.us-east-1.amazonaws.com/transient_data?objectType=IrishRailTrain"


def fetch_train_data():
    try:
        response = requests.get(API_URL)
        response.raise_for_status()  # Raise an error for bad status codes
        if response.text.strip():  # Ensure response is not empty
            return response.json()
        else:
            print("Error: Empty response from API")
            return []
    except requests.exceptions.RequestException as e:
        print(f"API request failed: {e}")
        return []
    except json.JSONDecodeError as e:
        print(f"JSON decoding failed: {e}")
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

        # Update the DynamoDB table, renaming 'count' to avoid using a reserved keyword
        table.update_item(
            Key={"objectID": objectID},
            UpdateExpression="SET average_punctuality = :avg, #cnt = :cnt",
            ExpressionAttributeValues={":avg": new_avg, ":cnt": count},
            ExpressionAttributeNames={"#cnt": "count"}  # Alias 'count' to avoid reserved keyword issue
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

