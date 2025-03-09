import unittest
from unittest.mock import patch, MagicMock
from src.functions.transient_data.transient_data import fetch_trains, fetch_luas, fetch_buses, batch_upload_to_dynamodb, lambda_handler

class TestTransientData(unittest.TestCase):

    @patch('src.functions.transient_data.transient_data.session.get')
    def test_fetch_trains_returns_data(self, mock_get):
        mock_response = MagicMock()
        mock_response.text = '<ArrayOfObjTrainPositions><objTrainPositions><TrainCode>123</TrainCode><TrainLatitude>53.349805</TrainLatitude><TrainLongitude>-6.26031</TrainLongitude><TrainStatus>Running</TrainStatus><TrainDate>2023-10-10</TrainDate><PublicMessage>On time</PublicMessage><Direction>North</Direction></objTrainPositions></ArrayOfObjTrainPositions>'
        mock_get.return_value = mock_response

        with patch('src.functions.transient_data.transient_data.xmltodict.parse', return_value={
            "ArrayOfObjTrainPositions": {
                "objTrainPositions": [{
                    "TrainCode": "123",
                    "TrainLatitude": "53.349805",
                    "TrainLongitude": "-6.26031",
                    "TrainStatus": "Running",
                    "TrainDate": "2023-10-10",
                    "PublicMessage": "On time",
                    "Direction": "North"
                }]
            }
        }):
            result = fetch_trains()
            self.assertEqual(len(result), 3)  # Expecting 3 items for 3 train types
            self.assertEqual(result[0]['trainCode'], '123')

    @patch('src.functions.transient_data.transient_data.session.get')
    def test_fetch_luas_returns_data(self, mock_get):
        # Mock the response for the Luas stops data
        mock_stops_response = MagicMock()
        mock_stops_response.content.decode.return_value = 'Abbreviation\tLatitude\tLongitude\tName\tIrishName\tStopID\tLineID\tSortOrder\tIsEnabled\tIsParkAndRide\tIsCycleAndRide\tZoneCountA\tZoneCountB\nSTP1\t53.349805\t-6.26031\tStop1\tStop1Irish\t1\t1\t1\t1\t0\t0\t1\t1'
        mock_forecast_response = MagicMock()
        mock_forecast_response.text = '<stopInfo><message>On time</message><direction>North</direction></stopInfo>'
        mock_get.side_effect = [mock_stops_response, mock_forecast_response]

        result = fetch_luas()
        self.assertGreater(len(result), 0)
        self.assertIn('luasStopName', result[0])

    @patch('src.functions.transient_data.transient_data.session.get')
    @patch.dict('os.environ', {'PERMANENT_DATA_API': 'http://mocked_api'})
    def test_fetch_buses_returns_data(self, mock_get):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "entity": [
                {
                    "id": "1",
                    "vehicle": {
                        "position": {"latitude": 53.349805, "longitude": -6.26031},
                        "trip": {"route_id": "123", "trip_id": "456", "start_time": "10:00",
                                 "start_date": "2023-10-10", "schedule_relationship": "Scheduled",
                                 "direction_id": 0}
                    }
                }
            ]
        }
        mock_get.return_value = mock_response

        result = fetch_buses()
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['busID'], '1')

    @patch('src.functions.transient_data.transient_data.table.batch_writer')
    def test_batch_upload_to_dynamodb_uploads_data(self, mock_batch_writer):
        mock_batch = MagicMock()
        mock_batch_writer.return_value.__enter__.return_value = mock_batch

        data = [{'objectID': '1', 'objectType': 'Test'}]
        batch_upload_to_dynamodb(data)
        mock_batch.put_item.assert_called_once_with(Item=data[0])

    @patch('src.functions.transient_data.transient_data.fetch_trains')
    @patch('src.functions.transient_data.transient_data.fetch_luas')
    @patch('src.functions.transient_data.transient_data.fetch_buses')
    @patch('src.functions.transient_data.transient_data.batch_upload_to_dynamodb')
    def test_lambda_handler_executes_successfully(self, mock_batch_upload, mock_fetch_buses, mock_fetch_luas, mock_fetch_trains):
        mock_fetch_trains.return_value = [{'objectID': '1', 'objectType': 'Train'}]
        mock_fetch_luas.return_value = [{'objectID': '2', 'objectType': 'Luas'}]
        mock_fetch_buses.return_value = [{'objectID': '3', 'objectType': 'Bus'}]

        event = {}
        context = {}
        result = lambda_handler(event, context)
        self.assertEqual(result['statusCode'], 200)
        self.assertIn('Data uploaded successfully', result['body'])
