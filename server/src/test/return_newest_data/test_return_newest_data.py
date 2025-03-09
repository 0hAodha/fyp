import unittest
from unittest.mock import patch, MagicMock
import json
import os
from functions.return_newest_data.lambda_function import lambda_handler


class TestLambdaFunction(unittest.TestCase):

    # Mock environment variable before each test
    def setUp(self):
        patch.dict(os.environ, {'TABLE_NAME': 'test-table'}).start()

    # Clean up patches after each test
    def tearDown(self):
        patch.stopall()

    @patch('functions.return_newest_data.lambda_function.dynamodb.Table')
    def test_lambda_handler_with_object_type(self, mock_table):
        # Mock scan responses for timestamps
        mock_table.return_value.scan.side_effect = [
            {'Items': [{'timestamp': '1234567890'}, {'timestamp': '1234567891'}]},  # First scan for timestamps
            {'Items': [{'objectID': '1', 'objectType': 'Bus', 'timestamp': '1234567891'}]}  # Fetch latest items
        ]

        # Mock event with objectType query parameter
        event = {
            'queryStringParameters': {
                'objectType': 'Bus'
            }
        }

        result = lambda_handler(event, {})
        self.assertEqual(result['statusCode'], 200)

        # Parse result body
        body = json.loads(result['body'])
        self.assertEqual(len(body), 1)
        self.assertEqual(body[0]['objectType'], 'Bus')

    @patch('functions.return_newest_data.lambda_function.dynamodb.Table')
    def test_lambda_handler_without_object_type(self, mock_table):
        # Mock scan responses for timestamps and data
        mock_table.return_value.scan.side_effect = [
            {'Items': [{'timestamp': '1234567890'}, {'timestamp': '1234567891'}]},  # First scan for timestamps
            {'Items': [{'objectID': '1', 'objectType': 'Bus', 'timestamp': '1234567891'}]}  # Fetch latest items
        ]

        # Mock event without objectType query parameter
        event = {
            'queryStringParameters': None
        }

        result = lambda_handler(event, {})
        self.assertEqual(result['statusCode'], 200)

        # Parse result body
        body = json.loads(result['body'])
        self.assertEqual(len(body), 1)
        self.assertEqual(body[0]['objectType'], 'Bus')

    @patch('functions.return_newest_data.lambda_function.dynamodb.Table')
    def test_lambda_handler_with_pagination(self, mock_table):
        # Mock paginated scan responses for timestamps and data
        mock_table.return_value.scan.side_effect = [
            {'Items': [{'timestamp': '1234567890'}], 'LastEvaluatedKey': 'key1'},
            {'Items': [{'timestamp': '1234567891'}]},  # Last page for timestamps
            {'Items': [{'objectID': '1', 'objectType': 'Bus', 'timestamp': '1234567891'}], 'LastEvaluatedKey': 'key2'},
            {'Items': [{'objectID': '2', 'objectType': 'Train', 'timestamp': '1234567891'}]}  # Last page for data
        ]

        event = {
            'queryStringParameters': {
                'objectType': 'Bus,Train'
            }
        }

        result = lambda_handler(event, {})
        self.assertEqual(result['statusCode'], 200)

        body = json.loads(result['body'])
        self.assertEqual(len(body), 2)
        self.assertEqual(body[0]['objectType'], 'Bus')
        self.assertEqual(body[1]['objectType'], 'Train')

    @patch('functions.return_newest_data.lambda_function.dynamodb.Table')
    def test_lambda_handler_no_data(self, mock_table):
        # Mock empty scan response
        mock_table.return_value.scan.return_value = {'Items': []}

        event = {
            'queryStringParameters': None
        }

        result = lambda_handler(event, {})
        self.assertEqual(result['statusCode'], 200)

        body = json.loads(result['body'])
        self.assertEqual(len(body), 0)

    @patch('functions.return_newest_data.lambda_function.dynamodb.Table')
    def test_lambda_handler_error(self, mock_table):
        # Mock table scan to raise an exception
        mock_table.return_value.scan.side_effect = Exception('DynamoDB error')

        event = {
            'queryStringParameters': None
        }

        result = lambda_handler(event, {})
        self.assertEqual(result['statusCode'], 500)

        body = json.loads(result['body'])
        self.assertIn('error', body)
        self.assertEqual(body['error'], 'DynamoDB error')


if __name__ == "__main__":
    unittest.main()
