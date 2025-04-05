import unittest
from unittest.mock import patch, MagicMock
import json
import os
from functions.fetch_permanent_data.lambda_function import (
    fetch_train_stations_with_type,
    fetch_train_stations,
    fetch_luas,
    fetch_gtfs,
    batch_upload_to_dynamodb,
    lambda_handler,
    table_name,
    table
)

class TestPermanentData(unittest.TestCase):

    @patch('functions.fetch_permanent_data.lambda_function.session.get')
    @patch('functions.fetch_permanent_data.lambda_function.xmltodict.parse')
    def test_fetch_train_stations_with_type(self, mock_parse, mock_get):
        mock_get.return_value.text = '<xml></xml>'
        mock_parse.return_value = {
            "ArrayOfObjStation": {
                "objStation": [
                    {
                        "StationCode": "DUB",
                        "StationLatitude": "53.0",
                        "StationLongitude": "-6.0",
                        "StationId": "1",
                        "StationDesc": "Dublin",
                        "StationAlias": "DUB"
                    }
                ]
            }
        }

        result = fetch_train_stations_with_type()
        self.assertEqual(len(result), 3)  # Three types: M, S, D
        self.assertEqual(result[0]['trainStationCode'], 'DUB')

    @patch('functions.fetch_permanent_data.lambda_function.session.get')
    @patch('functions.fetch_permanent_data.lambda_function.xmltodict.parse')
    def test_fetch_train_stations(self, mock_parse, mock_get):
        mock_get.return_value.text = '<xml></xml>'
        mock_parse.return_value = {
            "ArrayOfObjStation": {
                "objStation": [
                    {
                        "StationCode": "DUB",
                        "StationLatitude": "53.0",
                        "StationLongitude": "-6.0",
                        "StationId": "1",
                        "StationDesc": "Dublin",
                        "StationAlias": "DUB"
                    }
                ]
            }
        }

        result = fetch_train_stations()
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['trainStationCode'], 'DUB')

    @patch('functions.fetch_permanent_data.lambda_function.session.get')
    def test_fetch_luas(self, mock_get):
        mock_get.return_value.content = 'Abbreviation\tName\tIrishName\tLatitude\tLongitude\tStopID\tLineID\tSortOrder\tIsEnabled\tIsParkAndRide\tIsCycleAndRide\tZoneCountA\tZoneCountB\nABB\tAbbey Street\tSráid na Mainistreach\t53.0\t-6.0\t1\t1\t1\ttrue\tfalse\tfalse\t1\t2'.encode('utf-8-sig')

        result = fetch_luas()
        self.assertEqual(len(result), 1 + 13)
        self.assertEqual(result[0]['luasStopName'], 'Abbey Street')

        @patch('functions.fetch_permanent_data.lambda_function.session.get')
        @patch('functions.fetch_permanent_data.lambda_function.zipfile.ZipFile')
        def test_fetch_gtfs(self, mock_zip, mock_get):
            mock_get.return_value.content = b'zipfilecontent'

            mock_zip_file = MagicMock()
            mock_zip.return_value.__enter__.return_value = mock_zip_file

            mock_zip_file.namelist.return_value = ['agency.txt', 'routes.txt', 'stops.txt']

            agency_file = MagicMock()
            route_file = MagicMock()
            stop_file = MagicMock()

            agency_file.read.return_value = b'agency_id,agency_name,agency_url\n1,Dublin Bus,http://dublinbus.ie'
            route_file.read.return_value = b'route_id,agency_id,route_short_name,route_long_name\n1,1,46A,Ballinteer to Phoenix Park'
            stop_file.read.return_value = b'stop_id,stop_code,stop_name,stop_lat,stop_lon\n1,123,Stop 1,53.0,-6.0'

            def mock_open(name, *args, **kwargs):
                if name == 'agency.txt':
                    return agency_file
                elif name == 'routes.txt':
                    return route_file
                elif name == 'stops.txt':
                    return stop_file
                else:
                    raise FileNotFoundError

            mock_zip_file.open.side_effect = mock_open

            result = fetch_gtfs()

            self.assertEqual(len(result), 3)
            self.assertEqual(result[0]['busAgencyName'], 'Dublin Bus')
            self.assertEqual(result[1]['busRouteLongName'], 'Ballinteer to Phoenix Park')
            self.assertEqual(result[2]['busStopName'], 'Stop 1')

    @patch('functions.fetch_permanent_data.lambda_function.table')
    def test_batch_upload_to_dynamodb(self, mock_table):
        mock_batch_writer = MagicMock()
        mock_table.batch_writer.return_value.__enter__.return_value = mock_batch_writer

        data = [{"objectID": "1", "objectType": "TestType"}]
        batch_upload_to_dynamodb(data)

        mock_batch_writer.put_item.assert_called_once_with(Item=data[0])

    @patch('functions.fetch_permanent_data.lambda_function.fetch_train_stations')
    @patch('functions.fetch_permanent_data.lambda_function.fetch_luas')
    @patch('functions.fetch_permanent_data.lambda_function.fetch_gtfs')
    @patch('functions.fetch_permanent_data.lambda_function.batch_upload_to_dynamodb')
    def test_lambda_handler(self, mock_upload, mock_gtfs, mock_luas, mock_stations):
        mock_stations.return_value = [{"objectID": "station1", "objectType": "IrishRailStation"}]
        mock_luas.return_value = [{"objectID": "luas1", "objectType": "LuasStop"}]
        mock_gtfs.return_value = [{"objectID": "bus1", "objectType": "BusStop"}]

        result = lambda_handler({}, {})

        self.assertEqual(result['statusCode'], 200)
        self.assertIn('Data uploaded successfully', result['body'])
        self.assertEqual(mock_upload.call_count, 1)

if __name__ == "__main__":
    unittest.main()
