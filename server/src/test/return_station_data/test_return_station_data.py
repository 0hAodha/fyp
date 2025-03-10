import unittest
from unittest.mock import patch, MagicMock
from functions.return_station_data.lambda_function import lambda_handler

class TestLambdaFunction(unittest.TestCase):

    @patch('src.functions.return_station_data.lambda_function.requests.get')
    @patch('src.functions.return_station_data.lambda_function.xmltodict.parse')
    def lambda_handler_returns_station_data_for_valid_stationCode(self, mock_parse, mock_get):
        mock_response = MagicMock()
        mock_response.text = '<xml>test</xml>'
        mock_get.return_value = mock_response
        mock_parse.return_value = {'station': 'data'}

        event = {
            'queryStringParameters': {'stationCode': 'test_station'}
        }
        context = {}

        response = lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(json.loads(response['body']), {'station': 'data'})

    @patch('src.functions.return_station_data.lambda_function.requests.get')
    def lambda_handler_returns_error_on_exception(self, mock_get):
        mock_get.side_effect = Exception('Test exception')

        event = {
            'queryStringParameters': {'stationCode': 'test_station'}
        }
        context = {}

        response = lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 500)
        self.assertIn('error', json.loads(response['body']))

    @patch('src.functions.return_station_data.lambda_function.requests.get')
    def lambda_handler_returns_error_for_missing_stationCode(self, mock_get):
        event = {
            'queryStringParameters': {}
        }
        context = {}

        response = lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 500)
        self.assertIn('error', json.loads(response['body']))

    @patch('src.functions.return_station_data.lambda_function.requests.get')
    @patch('src.functions.return_station_data.lambda_function.xmltodict.parse')
    def handles_non_xml_response(self, mock_parse, mock_get):
        mock_response = MagicMock()
        mock_response.text = 'Not XML'
        mock_get.return_value = mock_response
        mock_parse.side_effect = Exception('Failed to parse XML')

        event = {'queryStringParameters': {'stationCode': 'DART'}}
        context = {}

        result = lambda_handler(event, context)

        self.assertEqual(result['statusCode'], 500)
        self.assertIn('error', json.loads(result['body']))

    @patch('src.functions.return_station_data.lambda_function.requests.get')
    def handles_empty_response(self, mock_get):
        mock_response = MagicMock()
        mock_response.text = ''
        mock_get.return_value = mock_response

        event = {'queryStringParameters': {'stationCode': 'DART'}}
        context = {}

        result = lambda_handler(event, context)

        self.assertEqual(result['statusCode'], 500)
        self.assertIn('error', json.loads(result['body']))

    @patch('src.functions.return_station_data.lambda_function.requests.get')
    @patch('src.functions.return_station_data.lambda_function.xmltodict.parse')
    def handles_invalid_station_code(self, mock_parse, mock_get):
        mock_response = MagicMock()
        mock_response.text = '<root></root>'
        mock_get.return_value = mock_response
        mock_parse.return_value = {}

        event = {'queryStringParameters': {'stationCode': 'INVALID'}}
        context = {}

        result = lambda_handler(event, context)

        self.assertEqual(result['statusCode'], 200)
        self.assertEqual(json.loads(result['body']), {})

    @patch('src.functions.return_station_data.lambda_function.requests.get')
    def lambda_handler_handles_timeout(self, mock_get):
        mock_get.side_effect = TimeoutError('Request timed out')

        event = {
            'queryStringParameters': {'stationCode': 'test_station'}
        }
        context = {}

        response = lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 504)
        self.assertIn('error', json.loads(response['body']))

    @patch('src.functions.return_station_data.lambda_function.requests.get')
    def lambda_handler_handles_http_error(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_response.raise_for_status.side_effect = Exception('HTTP error')
        mock_get.return_value = mock_response

        event = {
            'queryStringParameters': {'stationCode': 'test_station'}
        }
        context = {}

        response = lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 404)
        self.assertIn('error', json.loads(response['body']))