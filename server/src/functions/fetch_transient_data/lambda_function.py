import json
import csv
import xmltodict
import requests
import os
import boto3
import time
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
import re
# Create a reusable session for requests
session = requests.Session()

# Setup DynamoDB client
os.environ.setdefault('AWS_DEFAULT_REGION', 'us-east-1')
dynamodb = boto3.resource("dynamodb")
table_name = os.environ.get("DYNAMODB_TABLE", "transient_data2")
table = dynamodb.Table(table_name)

timestamp = str(int(time.time()))

# API URLs
irishrail_url = "http://api.irishrail.ie/realtime/realtime.asmx/"

def fetch_trains():
    """
    Fetches train data from the Irish Rail API and parses additional attributes.

    Returns:
        list: A list of dictionaries containing processed train data.
    """
    print("Fetching Irish Rail data.")
    api_function = "getCurrentTrainsXML_WithTrainType?TrainType="
    train_types = ["M", "S", "D"]
    trains = []

    for train_type in train_types:
        response = session.get(irishrail_url + api_function + train_type)
        response.raise_for_status()

        trains_xml = response.text
        trains_json = xmltodict.parse(trains_xml)

        for train in trains_json["ArrayOfObjTrainPositions"]["objTrainPositions"]:
            train_code = str(train["TrainCode"])
            train_status = train["TrainStatus"]
            public_message = train["PublicMessage"]

            split_message = public_message.split("\\n")
            trainDetails = split_message[1].split("(")[0]
            trainUpdate = split_message[2]

            # Regex to extract punctuality: Matches positive/negative number followed by "mins late"
            match = re.search(r"(-?\d+)\s+mins\s+late", public_message)
            punctuality = int(match.group(1)) if match else 0  # Default to 0 if no match

            if punctuality < 0:
                punctuality_status = "early"
                lateness_message = f"{-punctuality} minute{'s' if punctuality != -1 else ''} early"
            elif punctuality == 0:
                punctuality_status = "on-time"
                lateness_message = "On time"
            else:
                punctuality_status = "late"
                lateness_message = f"{punctuality} minute{'s' if punctuality != 1 else ''} late"

            train_type_full = {
                "M": "Mainline",
                "S": "Suburban",
                "D": "DART"
            }.get(train_type, "Unknown")

            train_status_full = {
                "R": "Running",
                "T": "Terminated",
                "N": "Not yet running"
            }.get(train_status, "Unknown")

            trains.append({
                "objectID": "IrishRailTrain-" + train_code,
                "objectType": "IrishRailTrain",
                "timestamp": timestamp,
                "latitude": str(train["TrainLatitude"]),
                "longitude": str(train["TrainLongitude"]),
                "trainCode": train_code,
                "trainType": train_type,
                "trainTypeFull": train_type_full,
                "trainStatus": train_status,
                "trainStatusFull": train_status_full,
                "trainDate": str(train["TrainDate"]),
                "trainPublicMessage": public_message,
                "trainDirection": train["Direction"],
                "trainPunctuality": punctuality,
                "trainPunctualityStatus": punctuality_status,
                "latenessMessage": lateness_message,
                "trainDetails":  trainDetails,
                "trainUpdate": trainUpdate
            })

    return trains


def fetch_bus_routes():
    """
    Fetches bus route data from the permanent data API.

    Returns:
        list: A list of dictionaries containing bus route data.
    """
    permanent_data_api = os.environ["PERMANENT_DATA_API"]
    response = session.get(permanent_data_api + "?objectType=BusRoute")
    response.raise_for_status()
    return response.json()

def fetch_buses():
    """
    Fetches bus data from the National Transport API.

    Returns:
        list: A list of dictionaries containing bus data.
    """
    print("Fetching bus data.")
    buses = []
    api_url = "https://api.nationaltransport.ie/gtfsr/v2/Vehicles?format=json"
    headers = {
        "Cache-Control": "no-cache",
        "x-api-key": os.getenv("GTFS_KEY")
    }

    response = session.get(api_url, headers=headers)
    response.raise_for_status()
    buses_json = response.json()

    bus_routes_list = fetch_bus_routes()
    bus_routes_hashmap = {route["busRouteID"]: route for route in bus_routes_list if "busRouteID" in route}

    for bus in buses_json["entity"]:
        busRouteID = str(bus["vehicle"]["trip"]["route_id"])
        route_info = bus_routes_hashmap.get(busRouteID, {})
        buses.append({
            "objectID": "Bus-" + bus["id"],
            "objectType": "Bus",
            "timestamp": timestamp,
            "latitude": str(bus["vehicle"]["position"]["latitude"]),
            "longitude": str(bus["vehicle"]["position"]["longitude"]),
            "busID": str(bus["id"]),
            "busTripID": str(bus["vehicle"]["trip"]["trip_id"]),
            "busStartTime": str(bus["vehicle"]["trip"]["start_time"]),
            "busStartDate": str(bus["vehicle"]["trip"]["start_date"]),
            "busScheduleRelationship": str(bus["vehicle"]["trip"]["schedule_relationship"]),
            "busRoute": busRouteID,
            "busRouteAgencyName": route_info.get("busRouteAgencyName", ""),
            "busRouteLongName": route_info.get("busRouteLongName", ""),
            "busRouteShortName": route_info.get("busRouteShortName", ""),
            "busDirection": str(bus["vehicle"]["trip"]["direction_id"]),
        })

    return buses

def batch_upload_to_dynamodb(data):
    """
    Uploads data to DynamoDB in batches.

    Args:
        data (list): A list of dictionaries containing data to be uploaded.
    """
    with table.batch_writer() as batch:
        for item in data:
            batch.put_item(Item=item)

def lambda_handler(event, context):
    """
    AWS Lambda handler function to fetch and upload data.

    Args:
        event (dict): Event data passed to the Lambda function.
        context (object): Runtime information of the Lambda function.

    Returns:
        dict: A dictionary containing the status code and message.
    """
    print("Lambda handler triggered; fetching data.")
    with ThreadPoolExecutor() as executor:
        futures = [
            executor.submit(fetch_trains),
            executor.submit(fetch_buses)
        ]
        data = []
        for future in futures:
            data.extend(future.result())

    print(f"Retrieved {len(data)} records.")
    print("Uploading to DynamoDB...")
    batch_upload_to_dynamodb(data)

    print("Upload completed.")

    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Data uploaded successfully!'})
    }

if __name__ == "__main__":
    """
    Main function to fetch and print data locally.
    """
    load_dotenv()

    with ThreadPoolExecutor() as executor:
        futures = [
            executor.submit(fetch_trains),
            executor.submit(fetch_buses)
        ]
        data = []
        for future in futures:
            data.extend(future.result())

    print(json.dumps(data))
