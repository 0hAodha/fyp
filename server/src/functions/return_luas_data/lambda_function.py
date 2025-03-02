import xmltodict
import json
import os
import requests

def lambda_handler(event, context):
    try:
        luas_stop_code = event['queryStringParameters']['luasStopCode']
        response = requests.get(f"http://luasforecasts.rpa.ie/xml/get.ashx?action=forecast&stop={luas_stop_code}&encrypt=false")
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
