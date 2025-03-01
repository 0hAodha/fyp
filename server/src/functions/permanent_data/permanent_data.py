import json
import csv
import xmltodict
import requests
import zipfile
import io
import os
import boto3

dynamodb = boto3.resource("dynamodb")

# API URLs
irishrail_url = "http://api.irishrail.ie/realtime/realtime.asmx/"

# function to fetch Irish Rail station data with types
# this function seems to be missing stations -- the API must have some uncategorised stations that it won't return
# unfortunately, this is the only way to categorise stations as the API won't return the station's category
def fetch_train_stations_with_type():
    api_function = "getAllStationsXML_WithStationType?StationType="
    station_types = ["M", "S", "D"]
    stations = []

    for station_type in station_types:
        stations_xml  = requests.get(irishrail_url + api_function + station_type).text
        stations_json = json.loads(json.dumps(xmltodict.parse(stations_xml)))

        for station in stations_json["ArrayOfObjStation"]["objStation"]:
            stations.append({
                "objectID": "IrishRailStation-" + station["StationCode"],
                "objectType": "IrishRailStation",
                "latitude": station["StationLatitude"],
                "longitude": station["StationLongitude"],

                "trainStationID": station["StationId"],
                "trainStationCode": station["StationCode"],
                "trainStationAlias": station["StationAlias"],
                "trainStationDesc": station["StationDesc"],
                "trainStationType": station_type
            })

    return stations

# function to fetch Irish Rail station data without types
def fetch_train_stations():
    api_function = "getAllStationsXML"
    stations = []

    stations_xml  = requests.get(irishrail_url + api_function).text
    stations_json = json.loads(json.dumps(xmltodict.parse(stations_xml)))

    for station in stations_json["ArrayOfObjStation"]["objStation"]:
        stations.append({
            "objectID": "IrishRailStation-" + station["StationCode"],
            "objectType": "IrishRailStation",
            "latitude": station["StationLatitude"],
            "longitude": station["StationLongitude"],

            "trainStationID": station["StationId"],
            "trainStationCode": station["StationCode"],
            "trainStationAlias": station["StationAlias"],
            "trainStationDesc": station["StationDesc"],
        })

    return stations



# function to fetch Luas stops data
def fetch_luas():
    stops = []

    stops_tsv = requests.get("https://data.tii.ie/Datasets/Luas/StopLocations/luas-stops.txt").content.decode('utf-8-sig')
    tsv_reader = csv.DictReader(stops_tsv.splitlines(), delimiter="\t")
    stops_json = [row for row in tsv_reader]

    for stop in stops_json:
        stops.append({
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
            "luasStopZoneCountB": stop["ZoneCountB"],
        })

    return stops


def fetch_gtfs():
    data = []
    url = "https://www.transportforireland.ie/transitData/Data/GTFS_All.zip"
    zip_file = requests.get(url).content

    with zipfile.ZipFile(io.BytesIO(zip_file)) as zip:
        # will need to access the list of agencies for later objects, so keeping separate
        agencies = []

        # extract agencies data
        if "agencies.txt" in zip.namelist():
            with zip.open("agencies.txt") as file:
                agencies_csv = file.read().decode('utf-8')
                csv_reader = csv.DictReader(agencies_csv.splitlines(), delimiter=",")
                agencies_json = [row for row in csv_reader]

                for agency in agencies_json:
                    agencies.append({
                        "objectID": "BusAgency" + agency["agency_id"],
                        "objectType": "BusAgency",
                        # no latitude or longitude

                        "busAgencyID": agency["agency_id"],
                        "busAgencyName": agency["agency_name"],
                        "busAgencyURL": agency["agency_url"]
                    })

        data += agencies

        # extract routes data
        if "routes.txt" in zip.namelist():
            with zip.open("routes.txt") as file:
                routes_csv = file.read().decode('utf-8')
                csv_reader = csv.DictReader(routes_csv.splitlines(), delimiter=",")
                routes_json = [row for row in csv_reader]

                for route in routes_json:
                    data.append({
                        "objectID": "BusRoute-" + route["route_id"],
                        "objectType": "BusRoute",
                        # no latitude or longitude

                        "busRouteID": route["route_id"],
                        "busRouteAgencyID": route["agency_id"],
                        "busRouteAgencyName": next((agency['busAgencyName'] for agency in agencies if agency['busAgencyID'] == route["agency_id"]), None),
                        "busRouteShortName": route["route_short_name"],
                        "busRouteLongName": route["route_long_name"]
                    })

        # extract stops data
        if "stops.txt" in zip.namelist():
            with zip.open("stops.txt") as file:
                stops_csv = file.read().decode('utf-8')
                csv_reader = csv.DictReader(stops_csv.splitlines(), delimiter=",")
                stops_json = [row for row in csv_reader]

                for stop in stops_json:
                    data.append({
                        "objectID": "BusStop-" + stop["stop_id"],
                        "objectType": "BusStop",
                        "latitude": stop["stop_lat"],
                        "longitude": stop["stop_lon"],

                        "busStopID": stop["stop_id"],
                        "busStopCode": stop["stop_code"],
                        "busStopName": stop["stop_name"]
                    })

    return data


def lambda_handler(event, context):
    print("Lambda Handler invoked! Retrieving data...")
    data = fetch_train_stations() + fetch_luas() + fetch_gtfs()
    print("Data retrieved successfully")

    table_name = os.environ.get("DYNAMODB_TABLE", "permanent_data")
    table = dynamodb.Table(table_name)

    print("Attempting to batch upload retrieved data")

    try:
        with table.batch_writer() as batch:
            for record in data:
                batch.put_item(Item=record)

        print("done uploading")

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Data inserted successfully!'})
        }

    except Exception as e:
        return {"statusCode": 500, "error": str(e)}


if "__main__" == __name__:
    data = fetch_train_stations() + fetch_luas() + fetch_gtfs()
    print(json.dumps(data))
