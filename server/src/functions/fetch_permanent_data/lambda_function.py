import json
import csv
import xmltodict
import requests
import zipfile
import io
import os
import boto3
from concurrent.futures import ThreadPoolExecutor

# Create a reusable session for requests
session = requests.Session()

# Setup DynamoDB client for Lambda
os.environ.setdefault('AWS_DEFAULT_REGION', 'us-east-1')
dynamodb = boto3.resource("dynamodb")
table_name = os.environ.get("DYNAMODB_TABLE", "permanent_data")
table = dynamodb.Table(table_name)

irishrail_url = "http://api.irishrail.ie/realtime/realtime.asmx/"

def fetch_train_stations_with_type():
    """
    Fetch train stations from the Irish Rail API with specific station types.

    Returns:
        list: A list of dictionaries containing train station data with types.
    """
    station_types = ["M", "S", "D"]
    stations = []
    for station_type in station_types:
        response = session.get(irishrail_url + f"getAllStationsXML_WithStationType?StationType={station_type}")
        stations_xml = response.text
        stations_json = xmltodict.parse(stations_xml)

        for station in stations_json["ArrayOfObjStation"]["objStation"]:
            stations.append({
                "objectID": "IrishRailStation-" + station["StationCode"],
                "objectType": "IrishRailStation",
                "latitude": station["StationLatitude"],
                "longitude": station["StationLongitude"],
                "trainStationID": station["StationId"],
                "trainStationCode": station["StationCode"],
                "trainStationAlias": station.get("StationAlias", ""),
                "trainStationDesc": station["StationDesc"],
                "trainStationType": station_type
            })
    return stations

def fetch_train_stations():
    """
    Fetch all train stations from the Irish Rail API.

    Returns:
        list: A list of dictionaries containing train station data.
    """
    response = session.get(irishrail_url + "getAllStationsXML")
    stations_xml = response.text
    stations_json = xmltodict.parse(stations_xml)
    stations = [{
        "objectID": "IrishRailStation-" + station["StationCode"],
        "objectType": "IrishRailStation",
        "latitude": station["StationLatitude"],
        "longitude": station["StationLongitude"],
        "trainStationID": station["StationId"],
        "trainStationCode": station["StationCode"],
        "trainStationAlias": station.get("StationAlias", ""),
        "trainStationDesc": station["StationDesc"]
    } for station in stations_json["ArrayOfObjStation"]["objStation"]]
    return stations

def fetch_luas():
    """
    Fetch Luas stops from the TII dataset.

    Returns:
        list: A list of dictionaries containing Luas stop data.
    """
    response = session.get("https://data.tii.ie/Datasets/Luas/StopLocations/luas-stops.txt")
    stops_tsv = response.content.decode('utf-8-sig')
    tsv_reader = csv.DictReader(stops_tsv.splitlines(), delimiter="\t")
    stops = [{
        "objectID": "LuasStop-" + stop["Abbreviation"],
        "objectType": "LuasStop",
        "latitude": stop["Latitude"],
        "longitude": stop["Longitude"],
        "luasStopName": stop["Name"],
        "luasStopIrishName": stop["IrishName"],
        "luasStopID": stop["StopID"],
        "luasStopCode": stop["Abbreviation"],
        "luasStopLineID": stop["LineID"],
        "luasStopSortOrder": stop["SortOrder"],
        "luasStopIsEnabled": stop["IsEnabled"],
        "luasStopIsParkAndRide": stop["IsParkAndRide"],
        "luasStopIsCycleAndRide": stop["IsCycleAndRide"],
        "luasStopZoneCountA": stop["ZoneCountA"],
        "luasStopZoneCountB": stop["ZoneCountB"]
    } for stop in tsv_reader]

    stops += [
        {
            "objectID": "LuasStop-DAW",
            "objectType": "LuasStop",
            "latitude": "53.34235198108542",
            "longitude": "-6.257874705533702",
            "luasStopName": "Dawson",
            "luasStopIrishName": "Dásain",
            "luasStopCode": "DAW",
            "luasStopLineID": "2"
        },
        {
            "objectID": "LuasStop-WES",
            "objectType": "LuasStop",
            "latitude": "53.34657666552001",
            "longitude": "-6.258954552531184",
            "luasStopName": "Westmoreland",
            "luasStopIrishName": "Sráid Westmoreland",
            "luasStopCode": "WES",
            "luasStopLineID": "2"
        },
        {
            "objectID": "LuasStop-OGP",
            "objectType": "LuasStop",
            "latitude": "53.34895364842052",
            "longitude": "-6.259870172748866",
            "luasStopName": "O'Connell - GPO",
            "luasStopIrishName": " Ó Conaill - AOP",
            "luasStopCode": "OGP",
            "luasStopLineID": "2"
        },
        {
            "objectID": "LuasStop-OUP",
            "objectType": "LuasStop",
            "latitude": "53.34897926629319",
            "longitude": "-6.259956003433765",
            "luasStopName": "O'Connell - Upper",
            "luasStopIrishName": "Ó Conaill Uachtarach",
            "luasStopCode": "OUP",
            "luasStopLineID": "2"
        },
        {
            "objectID": "LuasStop-BRO",
            "objectType": "LuasStop",
            "latitude": "53.37238519438793",
            "longitude": "-6.29767637274806",
            "luasStopName": "Broombridge",
            "luasStopIrishName": "Droichead Broom",
            "luasStopCode": "BRO",
            "luasStopLineID": "2"
        },
        {
            "objectID": "LuasStop-CAB",
            "objectType": "LuasStop",
            "latitude": "53.3647720048475",
            "longitude": "-6.2818402941276315",
            "luasStopName": "Cabra",
            "luasStopIrishName": "Cabrach",
            "luasStopCode": "CAB",
            "luasStopLineID": "2"
        },
        {
            "objectID": "LuasStop-PHI",
            "objectType": "LuasStop",
            "latitude": "53.360531943612585",
            "longitude": "-6.278946230419645",
            "luasStopName": "Phibsborough",
            "luasStopIrishName": "Baile Phib",
            "luasStopCode": "PHI",
            "luasStopLineID": "2"
        },
        {
            "objectID": "LuasStop-GRA",
            "objectType": "LuasStop",
            "latitude": "53.35733203671144",
            "longitude": "-6.277386018855522",
            "luasStopName": "Grangegorman",
            "luasStopIrishName": "Gráinseach Ghormáin",
            "luasStopCode": "GRA",
            "luasStopLineID": "2"
        },
        {
            "objectID": "LuasStop-BRD",
            "objectType": "LuasStop",
            "latitude": "53.354153216627836",
            "longitude": "-6.27358994584398",
            "luasStopName": "Broadstone - University",
            "luasStopIrishName": "An Clocháin Leathan",
            "luasStopCode": "BRD",
            "luasStopLineID": "2"
        },
        {
            "objectID": "LuasStop-DOM",
            "objectType": "LuasStop",
            "latitude": "53.351380458718346",
            "longitude": "-6.265691018855716",
            "luasStopName": "Dominick",
            "luasStopIrishName": "Doiminic",
            "luasStopCode": "DOM",
            "luasStopLineID": "2"
        },
        {
            "objectID": "LuasStop-PAR",
            "objectType": "LuasStop",
            "latitude": "53.35309164558487",
            "longitude": "-6.260360288173493",
            "luasStopName": "Parnell",
            "luasStopIrishName": "Sráid Pharnell",
            "luasStopCode": "PAR",
            "luasStopLineID": "2"
        },
        {
            "objectID": "LuasStop-MAR",
            "objectType": "LuasStop",
            "latitude": "53.34937746503714",
            "longitude": "-6.257806103514667",
            "luasStopName": "Marlborough",
            "luasStopIrishName": "Maoilbhríde",
            "luasStopCode": "MAR",
            "luasStopLineID": "2"
        }
    ]

    return stops

def fetch_gtfs():
    """
    Fetch GTFS data from the Transport for Ireland dataset.

    Returns:
        list: A list of dictionaries containing GTFS data.
    """
    url = "https://www.transportforireland.ie/transitData/Data/GTFS_All.zip"
    zip_file = session.get(url).content
    data = []

    with zipfile.ZipFile(io.BytesIO(zip_file)) as zip:
        if "agency.txt" in zip.namelist():
            with zip.open("agency.txt") as file:
                agencies_csv = file.read().decode('utf-8')
                agencies = [{
                    "objectID": "BusAgency" + agency["agency_id"],
                    "objectType": "BusAgency",
                    "busAgencyID": agency["agency_id"],
                    "busAgencyName": agency["agency_name"],
                    "busAgencyURL": agency["agency_url"]
                } for agency in csv.DictReader(agencies_csv.splitlines())]
                data.extend(agencies)

        if "routes.txt" in zip.namelist():
            with zip.open("routes.txt") as file:
                routes_csv = file.read().decode('utf-8')
                data.extend([{
                    "objectID": "BusRoute-" + route["route_id"],
                    "objectType": "BusRoute",
                    "busRouteID": route["route_id"],
                    "busRouteAgencyID": route["agency_id"],
                    "busRouteShortName": route["route_short_name"],
                    "busRouteLongName": route["route_long_name"],
                    "busRouteAgencyName": next((agency['busAgencyName'] for agency in data if agency['busAgencyID'] == route["agency_id"]), None)
                } for route in csv.DictReader(routes_csv.splitlines())])

        if "stops.txt" in zip.namelist():
            with zip.open("stops.txt") as file:
                stops_csv = file.read().decode('utf-8')
                data.extend([{
                    "objectID": "BusStop-" + stop["stop_id"],
                    "objectType": "BusStop",
                    "latitude": stop["stop_lat"],
                    "longitude": stop["stop_lon"],
                    "busStopID": stop["stop_id"],
                    "busStopCode": stop.get("stop_code", ""),
                    "busStopName": stop["stop_name"]
                } for stop in csv.DictReader(stops_csv.splitlines())])
    return data

def batch_upload_to_dynamodb(data):
    """
    Batch upload data to DynamoDB.

    Args:
        data (list): A list of dictionaries containing data to be uploaded.
    """
    with table.batch_writer() as batch:
        for item in data:
            batch.put_item(Item=item)

def lambda_handler(event, context):
    """
    AWS Lambda handler to fetch data and upload it to DynamoDB.

    Args:
        event (dict): Event data passed to the Lambda function.
        context (object): Runtime information of the Lambda function.

    Returns:
        dict: A dictionary containing the status code and message.
    """
    print("Lambda Handler invoked! Retrieving data...")

    with ThreadPoolExecutor() as executor:
        futures = [
            executor.submit(fetch_train_stations),
            executor.submit(fetch_luas),
            executor.submit(fetch_gtfs)
        ]
        data = []
        for future in futures:
            data.extend(future.result())

    print(f"Retrieved {len(data)} records.")
    print("Uploading to DynamoDB...")
    # chunk_size = 25
    # for i in range(0, len(data), chunk_size):
    #     batch_upload_to_dynamodb(data[i:i + chunk_size])

    batch_upload_to_dynamodb(data)

    print("Upload completed.")

    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Data uploaded successfully!'})
    }

if __name__ == "__main__":
    """
    Main function to fetch data and print it locally.
    """
    with ThreadPoolExecutor() as executor:
        futures = [
            executor.submit(fetch_train_stations),
            executor.submit(fetch_luas),
            executor.submit(fetch_gtfs)
        ]
        data = []
        for future in futures:
            data.extend(future.result())

    print(json.dumps(data))
