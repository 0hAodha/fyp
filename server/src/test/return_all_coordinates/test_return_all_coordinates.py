import unittest
from unittest.mock import patch, MagicMock
import json
import os
from functions.return_all_coordinates.lambda_function import lambda_handler


class TestReturnAllCoordinates(unittest.TestCase):

    # Mock environment variable before each test
    def setUp(self):
        patch.dict(os.environ, {'TABLE_NAME': 'test-table'}).start()

    # Clean up patches after each test
    def tearDown(self):
        patch.stopall()

    @patch('functions.return_all_coordinates.lambda_function.dynamodb.Table')
    def test_lambda_handler_with_coordinates(self, mock_table):
        """Test function when the database contains valid latitude and longitude values."""
        # Mock scan response with items containing latitude & longitude
        mock_table.return_value.scan.return_value = {
            'Items': [
                {'latitude': 53.3498, 'longitude': -6.2603},
                {'latitude': 51.8985, 'longitude': -8.4756}
            ]
        }

        event = {}  # No query parameters needed
        result = lambda_handler(event, {})
        self.assertEqual(result['statusCode'], 200)

        # Parse result body
        body = json.loads(result['body'])
        self.assertIn('coordinates', body)
        self.assertEqual(len(body['coordinates']), 2)
        self.assertEqual(body['coordinates'][0], [53.3498, -6.2603])
        self.assertEqual(body['coordinates'][1], [51.8985, -8.4756])

    @patch('functions.return_all_coordinates.lambda_function.dynamodb.Table')
    def test_lambda_handler_with_pagination(self, mock_table):
        """Test function correctly handles paginated responses from DynamoDB."""
        # Mock paginated scan responses
        mock_table.return_value.scan.side_effect = [
            {'Items': [{'latitude': 53.3498, 'longitude': -6.2603}], 'LastEvaluatedKey': 'key1'},
            {'Items': [{'latitude': 51.8985, 'longitude': -8.4756}], 'LastEvaluatedKey': 'key2'},
            {'Items': [{'latitude': 54.5973, 'longitude': -5.9301}]}
        ]

        event = {}
        result = lambda_handler(event, {})
        self.assertEqual(result['statusCode'], 200)

        body = json.loads(result['body'])
        self.assertEqual(len(body['coordinates']), 3)
        self.assertEqual(body['coordinates'][0], [53.3498, -6.2603])
        self.assertEqual(body['coordinates'][1], [51.8985, -8.4756])
        self.assertEqual(body['coordinates'][2], [54.5973, -5.9301])

    @patch('functions.return_all_coordinates.lambda_function.dynamodb.Table')
    def test_lambda_handler_with_no_coordinates(self, mock_table):
        """Test function when no items contain latitude or longitude."""
        mock_table.return_value.scan.return_value = {
            'Items': [
                {'objectID': '1', 'objectType': 'Bus'},  # Missing lat/lon
                {'name': 'Train Station'}  # Missing lat/lon
            ]
        }

        event = {}
        result = lambda_handler(event, {})
        self.assertEqual(result['statusCode'], 200)

        body = json.loads(result['body'])
        self.assertIn('coordinates', body)
        self.assertEqual(len(body['coordinates']), 0)

    @patch('functions.return_all_coordinates.lambda_function.dynamodb.Table')
    def test_lambda_handler_with_partial_data(self, mock_table):
        """Test function when some items have lat/lon while others do not."""
        mock_table.return_value.scan.return_value = {
            'Items': [
                {'latitude': 53.3498, 'longitude': -6.2603},
                {'objectID': '1', 'objectType': 'Train'},  # No lat/lon
                {'latitude': 54.5973}  # Missing longitude
            ]
        }

        event = {}
        result = lambda_handler(event, {})
        self.assertEqual(result['statusCode'], 200)

        body = json.loads(result['body'])
        self.assertEqual(len(body['coordinates']), 1)
        self.assertEqual(body['coordinates'][0], [53.3498, -6.2603])

    @patch('functions.return_all_coordinates.lambda_function.dynamodb.Table')
    def test_lambda_handler_error(self, mock_table):
        """Test function when DynamoDB scan raises an exception."""
        mock_table.return_value.scan.side_effect = Exception('DynamoDB error')

        event = {}
        result = lambda_handler(event, {})
        self.assertEqual(result['statusCode'], 500)

        body = json.loads(result['body'])
        self.assertIn('error', body)
        self.assertEqual(body['error'], 'DynamoDB error')


if __name__ == "__main__":
    unittest.main()
