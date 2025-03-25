import json
import boto3
import requests
import os
from decimal import Decimal

# Initialize DynamoDB resource
dynamodb = boto3.resource("dynamodb")
table_train = dynamodb.Table("punctuality_by_objectID")
table_timestamp = dynamodb.Table("punctuality_by_timestamp")

API_URL = "https://281bc6mcm5.execute-api.us-east-1.amazonaws.com/transient_data?objectType=IrishRailTrain"


def fetch_train_data():
    """Fetch train data from API."""
    try:
        response = requests.get(API_URL)
        response.raise_for_status()
        if response.text.strip():
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
    """Update punctuality data for a specific train."""
    new_punctuality = Decimal(str(new_punctuality))  # Ensure Decimal type for DynamoDB
    response = table_train.get_item(Key={"objectID": objectID})
    if "Item" in response:
        item = response["Item"]
        old_avg = Decimal(str(item["average_punctuality"]))
        count = int(item["count"])

        # Calculate new average
        new_avg = ((old_avg * count) + new_punctuality) / (count + 1)
        count += 1

        # Update the DynamoDB table, renaming 'count' to avoid reserved keyword issues
        table_train.update_item(
            Key={"objectID": objectID},
            UpdateExpression="SET average_punctuality = :avg, #cnt = :cnt",
            ExpressionAttributeValues={":avg": new_avg, ":cnt": count},
            ExpressionAttributeNames={"#cnt": "count"}  # Alias 'count' to avoid reserved keyword issue
        )
    else:
        # Insert new train punctuality record
        table_train.put_item(
            Item={"objectID": objectID, "average_punctuality": new_punctuality, "count": 1}
        )


def update_punctuality_by_timestamp(timestamp, punctualities):
    """Update the average punctuality for a given timestamp."""
    if not punctualities:
        return

    avg_punctuality = sum(punctualities) / len(punctualities)

    # Insert or update record in DynamoDB
    table_timestamp.put_item(
        Item={
            "timestamp": timestamp,
            "average_punctuality": avg_punctuality
        }
    )


def lambda_handler(event, context):
    """AWS Lambda handler."""
    train_data = fetch_train_data()

    if not train_data:
        return {"statusCode": 500, "body": json.dumps("No train data available")}

    # Extract timestamp (assuming all records share the same timestamp)
    timestamp = train_data[0].get("timestamp") if train_data else None
    if not timestamp:
        return {"statusCode": 500, "body": json.dumps("Missing timestamp in train data")}

    punctualities = []
    for train in train_data:
        objectID = train.get("objectID")
        punctuality = int(train.get("trainPunctuality", 0))

        if objectID:
            update_punctuality(objectID, punctuality)
            punctualities.append(punctuality)

    # Update average punctuality for the timestamp
    update_punctuality_by_timestamp(timestamp, punctualities)

    return {
        "statusCode": 200,
        "body": json.dumps("Punctuality data updated successfully")
    }
