import unittest
from unittest.mock import patch, MagicMock
import json
import os

# Mock environment variable BEFORE importing lambda_handler
os.environ['TABLE_NAME'] = 'mock_table'

from functions.return_newest_data.lambda_function import lambda_handler
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError

class TestLambdaFunction(unittest.TestCase):

    @patch('src.functions.return_newest_data.lambda_function.boto3.resource')
    def test_single_object_type(self, mock_boto_resource):
        mock_table = MagicMock()
        mock_boto_resource.return_value.Table.return_value = mock_table

        # Mock scan response for single object type with pagination
        def mock_scan(**kwargs):
            if 'FilterExpression' in kwargs:
                filter_expr = kwargs['FilterExpression']
                if 'objectType' in str(filter_expr):
                    return {'Items': [{'objectType': 'type1', 'timestamp': '1234567890'}]}
                elif 'timestamp' in str(filter_expr):
                    return {'Items': [{'objectType': 'type1', 'timestamp': '1234567890'}]}
            # Simulate pagination
            if 'ExclusiveStartKey' in kwargs:
                return {'Items': [], 'LastEvaluatedKey': None}
            return {'Items': [{'timestamp': '1234567890'}], 'LastEvaluatedKey': {'dummy_key': 'dummy_value'}}

        mock_table.scan.side_effect = mock_scan

        event = {'queryStringParameters': {'objectType': 'type1'}}
        context = {}

        response = lambda_handler(event, context)

        print("test_single_object_type - Status Code:", response['statusCode'])
        print("Response Body:", response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(json.loads(response['body']), [{'objectType': 'type1', 'timestamp': '1234567890'}])

    @patch('src.functions.return_newest_data.lambda_function.boto3.resource')
    def test_multiple_object_types(self, mock_boto_resource):
        mock_table = MagicMock()
        mock_boto_resource.return_value.Table.return_value = mock_table

        # Mock scan response for multiple object types with pagination
        def mock_scan(**kwargs):
            if 'FilterExpression' in kwargs:
                filter_expr = kwargs['FilterExpression']
                if 'objectType' in str(filter_expr):
                    return {'Items': [
                        {'objectType': 'type1', 'timestamp': '1234567891'},
                        {'objectType': 'type2', 'timestamp': '1234567891'}
                    ]}
                elif 'timestamp' in str(filter_expr):
                    return {'Items': [
                        {'objectType': 'type1', 'timestamp': '1234567891'},
                        {'objectType': 'type2', 'timestamp': '1234567891'}
                    ]}
            # Simulate pagination
            if 'ExclusiveStartKey' in kwargs:
                return {'Items': [], 'LastEvaluatedKey': None}
            return {'Items': [{'timestamp': '1234567891'}], 'LastEvaluatedKey': {'dummy_key': 'dummy_value'}}

        mock_table.scan.side_effect = mock_scan

        event = {'queryStringParameters': {'objectType': 'type1,type2'}}
        context = {}

        response = lambda_handler(event, context)

        print("test_multiple_object_types - Status Code:", response['statusCode'])
        print("Response Body:", response['body'])

        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(json.loads(response['body']), [
            {'objectType': 'type1', 'timestamp': '1234567891'},
            {'objectType': 'type2', 'timestamp': '1234567891'}
        ])

    @patch('src.functions.return_newest_data.lambda_function.boto3.resource')
    def test_exception_handling(self, mock_boto_resource):
        mock_table = MagicMock()
        mock_boto_resource.return_value.Table.return_value = mock_table

        # Mock scan to raise a ResourceNotFoundException
        mock_table.scan.side_effect = ClientError(
            {"Error": {"Code": "ResourceNotFoundException", "Message": "Requested resource not found"}},
            "Scan"
        )

        event = {'queryStringParameters': {'objectType': 'type1'}}
        context = {}

        response = lambda_handler(event, context)

        print("test_exception_handling - Status Code:", response['statusCode'])
        print("Response Body:", response['body'])

        self.assertEqual(response['statusCode'], 500)
        self.assertIn('Requested resource not found', json.loads(response['body'])['error'])

if __name__ == '__main__':
    unittest.main()
