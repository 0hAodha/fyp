import json
import unittest
from unittest.mock import patch, MagicMock
from src.functions.return_luas_data.lambda_function import lambda_handler

class TestLambdaFunction(unittest.TestCase):

    @patch('src.functions.return_luas_data.lambda_function.requests.get')
    @patch('src.functions.return_luas_data.lambda_function.xmltodict.parse')
    def test_lambda_handler_returns_forecast_for_valid_luasStopCode(self, mock_parse, mock_get):
        mock_response = MagicMock()
        mock_response.text = '<xml>test</xml>'
        mock_get.return_value = mock_response
        mock_parse.return_value = {'forecast': 'data'}

        event = {
            'queryStringParameters': {'luasStopCode': 'test_stop'}
        }
        context = {}

        response = lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(json.loads(response['body']), {'forecast': 'data'})

    @patch('src.functions.return_luas_data.lambda_function.requests.get')
    def test_lambda_handler_returns_error_on_exception(self, mock_get):
        mock_get.side_effect = Exception('Test exception')

        event = {
            'queryStringParameters': {'luasStopCode': 'test_stop'}
        }
        context = {}

        response = lambda_handler(event, context)

        self.assertEqual(response['statusCode'], 500)
        self.assertIn('error', json.loads(response['body']))