import xmltodict
import json
import requests

def lambda_handler(event, context):
    try:
        station_code = event['queryStringParameters']['stationCode']
        response = requests.get(f"http://api.irishrail.ie/realtime/realtime.asmx/getStationDataByCodeXML?StationCode={station_code}")
        xml_dict = xmltodict.parse(response.text)

        return {
            'statusCode': 200,
            'body': json.dumps(xml_dict)
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
