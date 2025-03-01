import json
import csv
import xmltodict
import requests
import os
import boto3
import time

dynamodb = boto3.resource("dynamodb")
timestamp = str(int(time.time()))

# API URLs
irishrail_url = "http://api.irishrail.ie/realtime/realtime.asmx/"


# function to fetch Irish Rail train data
def fetch_trains():
    print("Fetching Irish Rail data.")
    api_function = "getCurrentTrainsXML_WithTrainType?TrainType="
    train_types = ["M", "S", "D"]
    trains = []

    for train_type in train_types:
        response = requests.get(irishrail_url + api_function + train_type)
        response.raise_for_status()

        trains_xml = response.text
        trains_json = json.loads(json.dumps(xmltodict.parse(trains_xml)))

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

# function to fetch Luas stops data and the forecasted trams associated with each stop
def fetch_luas():
    print("Fetching Luas data.")
    stops = []

    stops_tsv = requests.get("https://data.tii.ie/Datasets/Luas/StopLocations/luas-stops.txt").content.decode('utf-8-sig')
    tsv_reader = csv.DictReader(stops_tsv.splitlines(), delimiter="\t")
    stops_json = [row for row in tsv_reader]

    for stop in stops_json:
        response = requests.get("https://luasforecasts.rpa.ie/xml/get.ashx?action=forecast&stop=" + stop["Abbreviation"] + "&encrypt=false")
        response.raise_for_status()

        trams_xml = response.text
        trams_json = json.loads(json.dumps(xmltodict.parse(trams_xml)))

        stops.append({
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
        })

    return stops


# function to fetch bus data
def fetch_buses():
    print("Fetching bus data.")
    buses = []
    api_url = "https://api.nationaltransport.ie/gtfsr/v2/Vehicles?format=json"
    headers = {
        "Cache-Control": "no-cache",
        "x-api-key": os.getenv("GTFS_KEY")
    }

    response = requests.get(api_url, headers=headers)
    response.raise_for_status()
    buses_json = response.json()

    bus_routes_list = fetch_bus_routes()
    bus_routes_hashmap = {route["busRouteID"]: route for route in bus_routes_list if "busRouteID" in route}

    for bus in buses_json["entity"]:
        busRouteID = str(bus["vehicle"]["trip"]["route_id"])

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
            "busRouteAgencyName": str(bus_routes_hashmap[busRouteID]["busRouteAgencyName"]),
            "busRouteLongName": str(bus_routes_hashmap[busRouteID]["busRouteLongName"]),
            "busRouteShortName": str(bus_routes_hashmap[busRouteID]["busRouteShortName"]),
            "busDirection": str(bus["vehicle"]["trip"]["direction_id"]),
        })

    return buses

# function to fetch bus route data
def fetch_bus_routes():
    permanent_data_api = os.environ["PERMANENT_DATA_API"]
    routes = requests.get(permanent_data_api + "?objectType=BusRoute").json()

    return routes


def lambda_handler(event, context):
    print("Lambda handler triggered; fetching data.")
    data = fetch_trains() + fetch_buses()
    print("Data retrieved successfully.")

    table_name = os.environ.get("DYNAMODB_TABLE", "transient_data")
    table = dynamodb.Table(table_name)

    print("Attempting to batch upload retrieved data to DynamoDB.")

    try:
        with table.batch_writer() as batch:
            for record in data:
                batch.put_item(Item=record)

        print("Completed data upload.")

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Data inserted successfully!'})
        }
    except Exception as e:
        return {"statusCode": 500, "error": str(e)}

lambda_handler("event", "context")
