import json
import csv
import xmltodict
import requests
import os
import boto3
import time
from concurrent.futures import ThreadPoolExecutor

# Create a reusable session for requests
session = requests.Session()

# Setup DynamoDB client
dynamodb = boto3.resource("dynamodb")
table_name = os.environ.get("DYNAMODB_TABLE", "transient_data")
table = dynamodb.Table(table_name)

timestamp = str(int(time.time()))

# API URLs
irishrail_url = "http://api.irishrail.ie/realtime/realtime.asmx/"

def fetch_trains():
    """
    Fetches train data from the Irish Rail API.

    Returns:
        list: A list of dictionaries containing train data.
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
            trains.append({
                "objectID": "IrishRailTrain-" + train["TrainCode"],
                "objectType": "IrishRailTrain",
                "timestamp": timestamp,
                "latitude": str(train["TrainLatitude"]),
                "longitude": str(train["TrainLongitude"]),
                "trainCode": str(train["TrainCode"]),
                "trainType": train_type,
                "trainStatus": train["TrainStatus"],
                "trainDate": str(train["TrainDate"]),
                "trainPublicMessage": train["PublicMessage"],
                "trainDirection": train["Direction"]
            })

    return trains

def fetch_luas():
    """
    Fetches Luas stop and forecast data.

    Returns:
        list: A list of dictionaries containing Luas stop and forecast data.
    """
    print("Fetching Luas data.")
    stops = []

    stops_tsv = session.get("https://data.tii.ie/Datasets/Luas/StopLocations/luas-stops.txt").content.decode('utf-8-sig')
    tsv_reader = csv.DictReader(stops_tsv.splitlines(), delimiter="\t")

    def fetch_forecast(stop):
        """
        Fetches forecast data for a given Luas stop.

        Args:
            stop (dict): A dictionary containing Luas stop information.

        Returns:
            dict: A dictionary containing Luas stop and forecast data.
        """
        response = session.get(f"https://luasforecasts.rpa.ie/xml/get.ashx?action=forecast&stop={stop['Abbreviation']}&encrypt=false")
        response.raise_for_status()
        trams_xml = response.text
        trams_json = xmltodict.parse(trams_xml)
        return {
            "objectID": "LuasStop-" + stop["Abbreviation"],
            "objectType": "LuasStop",
            "timestamp": timestamp,
            "latitude": str(stop["Latitude"]),
            "longitude": str(stop["Longitude"]),
            "luasStopName": stop["Name"],
            "luasStopIrishName": stop["IrishName"],
            "luasStopID": str(stop["StopID"]),
            "luasStopCode": stop["Abbreviation"],
            "luasStopLineID": str(stop["LineID"]),
            "luasStopSortOrder": str(stop["SortOrder"]),
            "luasStopIsEnabled": str(stop["IsEnabled"]),
            "luasStopIsParkAndRide": str(stop["IsParkAndRide"]),
            "luasStopIsCycleAndRide": str(stop["IsCycleAndRide"]),
            "luasStopZoneCountA": str(stop["ZoneCountA"]),
            "luasStopZoneCountB": str(stop["ZoneCountB"]),
            "luasStopMessage": str(trams_json["stopInfo"]["message"]),
            "luasStopTrams": str(trams_json["stopInfo"]["direction"])
        }

    with ThreadPoolExecutor() as executor:
        stops = list(executor.map(fetch_forecast, tsv_reader))

    return stops

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
            executor.submit(fetch_luas),
            executor.submit(fetch_buses)
        ]
        data = []
        for future in futures:
            data.extend(future.result())

    print(f"Retrieved {len(data)} records.")
    print("Uploading to DynamoDB...")
    chunk_size = 25
    for i in range(0, len(data), chunk_size):
        batch_upload_to_dynamodb(data[i:i + chunk_size])
    print("Upload completed.")

    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Data uploaded successfully!'})
    }

if __name__ == "__main__":
    """
    Main function to fetch and print data locally.
    """
    with ThreadPoolExecutor() as executor:
        futures = [
            executor.submit(fetch_trains),
            executor.submit(fetch_buses)
        ]
        data = []
        for future in futures:
            data.extend(future.result())

    print(json.dumps(data))