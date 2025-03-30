import unittest
from unittest.mock import patch, MagicMock
import json
import os
from functions.return_all_coordinates.lambda_function import lambda_handler


class TestReturnLatestCoordinates(unittest.TestCase):

    def setUp(self):
        patch.dict(os.environ, {'TABLE_NAME': 'test-table'}).start()

    def tearDown(self):
        patch.stopall()

    @patch('functions.return_all_coordinates.lambda_function.dynamodb.Table')
    def test_lambda_handler_with_coordinates(self, mock_table):
        """Test function when the database contains valid latitude and longitude values."""
        # First scan returns timestamps
        # Second scan returns matching items
        mock_table.return_value.scan.side_effect = [
            {'Items': [{'timestamp': '1001'}, {'timestamp': '1002'}]},  # First scan: get timestamps
            {'Items': [  # Second scan: get items with latest timestamp
                {'timestamp': '1002', 'latitude': 53.3498, 'longitude': -6.2603},
                {'timestamp': '1002', 'latitude': 51.8985, 'longitude': -8.4756}
            ]}
        ]

        event = {}
        result = lambda_handler(event, {})
        self.assertEqual(result['statusCode'], 200)

        body = json.loads(result['body'])
        self.assertEqual(len(body['coordinates']), 2)
        self.assertEqual(body['coordinates'][0], [53.3498, -6.2603])
        self.assertEqual(body['coordinates'][1], [51.8985, -8.4756])

    @patch('functions.return_all_coordinates.lambda_function.dynamodb.Table')
    def test_lambda_handler_with_pagination(self, mock_table):
        """Test function correctly handles paginated responses from DynamoDB."""
        # First scan returns paginated timestamps
        # Then paginated scan with latest timestamp
        mock_table.return_value.scan.side_effect = [
            {'Items': [{'timestamp': '1001'}], 'LastEvaluatedKey': 'key1'},
            {'Items': [{'timestamp': '1002'}]},  # Final timestamp batch

            {'Items': [{'timestamp': '1002', 'latitude': 53.3498, 'longitude': -6.2603}], 'LastEvaluatedKey': 'key2'},
            {'Items': [{'timestamp': '1002', 'latitude': 51.8985, 'longitude': -8.4756}], 'LastEvaluatedKey': 'key3'},
            {'Items': [{'timestamp': '1002', 'latitude': 54.5973, 'longitude': -5.9301}]}
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
        mock_table.return_value.scan.side_effect = [
            {'Items': [{'timestamp': '1001'}, {'timestamp': '1002'}]},
            {'Items': [
                {'timestamp': '1002', 'objectType': 'Bus'},
                {'timestamp': '1002', 'name': 'Train Station'}
            ]}
        ]

        event = {}
        result = lambda_handler(event, {})
        self.assertEqual(result['statusCode'], 200)

        body = json.loads(result['body'])
        self.assertIn('coordinates', body)
        self.assertEqual(len(body['coordinates']), 0)

    @patch('functions.return_all_coordinates.lambda_function.dynamodb.Table')
    def test_lambda_handler_with_partial_data(self, mock_table):
        """Test function when some items have lat/lon while others do not."""
        mock_table.return_value.scan.side_effect = [
            {'Items': [{'timestamp': '1002'}]},
            {'Items': [
                {'timestamp': '1002', 'latitude': 53.3498, 'longitude': -6.2603},
                {'timestamp': '1002', 'objectType': 'Train'},
                {'timestamp': '1002', 'latitude': 54.5973}
            ]}
        ]

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
