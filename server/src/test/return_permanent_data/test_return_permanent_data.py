import unittest
from unittest.mock import patch, MagicMock
import json
import os
from functions.return_permanent_data.lambda_function import lambda_handler


class TestLambdaFunction(unittest.TestCase):

    # Mock environment variable before each test
    def setUp(self):
        patch.dict(os.environ, {'TABLE_NAME': 'test-table'}).start()

    # Clean up patches after each test
    def tearDown(self):
        patch.stopall()

    @patch('functions.return_permanent_data.lambda_function.dynamodb.Table')
    def test_lambda_handler_with_object_type(self, mock_table):
        # Mock scan response for specific object types
        mock_table.return_value.scan.return_value = {
            'Items': [
                {'objectID': '1', 'objectType': 'Bus'},
                {'objectID': '2', 'objectType': 'Train'}
            ]
        }

        # Mock event with objectType query parameter
        event = {
            'queryStringParameters': {
                'objectType': 'Bus,Train'
            }
        }

        result = lambda_handler(event, {})
        self.assertEqual(result['statusCode'], 200)

        # Parse result body
        body = json.loads(result['body'])
        self.assertEqual(len(body), 2)
        self.assertEqual(body[0]['objectType'], 'Bus')
        self.assertEqual(body[1]['objectType'], 'Train')

    @patch('functions.return_permanent_data.lambda_function.dynamodb.Table')
    def test_lambda_handler_with_pagination(self, mock_table):
        # Mock paginated scan responses
        mock_table.return_value.scan.side_effect = [
            {'Items': [{'objectID': '1', 'objectType': 'Bus'}], 'LastEvaluatedKey': 'key1'},
            {'Items': [{'objectID': '2', 'objectType': 'Train'}], 'LastEvaluatedKey': 'key2'},
            {'Items': [{'objectID': '3', 'objectType': 'Luas'}]}
        ]

        event = {
            'queryStringParameters': {
                'objectType': 'Bus,Train,Luas'
            }
        }

        result = lambda_handler(event, {})
        self.assertEqual(result['statusCode'], 200)

        body = json.loads(result['body'])
        self.assertEqual(len(body), 3)
        self.assertEqual(body[0]['objectType'], 'Bus')
        self.assertEqual(body[1]['objectType'], 'Train')
        self.assertEqual(body[2]['objectType'], 'Luas')

    @patch('functions.return_permanent_data.lambda_function.dynamodb.Table')
    def test_lambda_handler_without_object_type(self, mock_table):
        # Mock scan response for full table scan
        mock_table.return_value.scan.return_value = {
            'Items': [
                {'objectID': '1', 'objectType': 'Bus'},
                {'objectID': '2', 'objectType': 'Train'}
            ]
        }

        # Mock event without objectType query parameter
        event = {
            'queryStringParameters': None
        }

        result = lambda_handler(event, {})
        self.assertEqual(result['statusCode'], 200)

        body = json.loads(result['body'])
        self.assertEqual(len(body), 2)
        self.assertEqual(body[0]['objectType'], 'Bus')
        self.assertEqual(body[1]['objectType'], 'Train')

    @patch('functions.return_permanent_data.lambda_function.dynamodb.Table')
    def test_lambda_handler_with_no_items(self, mock_table):
        # Mock empty scan response
        mock_table.return_value.scan.return_value = {
            'Items': []
        }

        # Mock event without objectType query parameter
        event = {
            'queryStringParameters': None
        }

        result = lambda_handler(event, {})
        self.assertEqual(result['statusCode'], 200)

        body = json.loads(result['body'])
        self.assertEqual(len(body), 0)

    @patch('functions.return_permanent_data.lambda_function.dynamodb.Table')
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
