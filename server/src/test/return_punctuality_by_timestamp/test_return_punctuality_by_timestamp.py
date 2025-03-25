import unittest
from unittest.mock import patch, MagicMock
import json
from functions.return_punctuality_by_timestamp.lambda_function import lambda_handler

class TestPunctualityLambda(unittest.TestCase):
    """
    Unit tests for the Lambda function that retrieves punctuality data by timestamp.
    """

    @patch("functions.return_punctuality_by_timestamp.lambda_function.dynamodb.Table")
    def test_lambda_handler_success(self, mock_table):
        """
        Test Lambda function when DynamoDB returns valid data.
        """
        mock_table.return_value.scan.return_value = {
            "Items": [
                {"timestamp": "1711814400", "average_punctuality": "95"},
                {"timestamp": "1711900800", "average_punctuality": "88"}
            ]
        }

        event = {}
        result = lambda_handler(event, {})

        self.assertEqual(result["statusCode"], 200)
        body = json.loads(result["body"])
        self.assertIsInstance(body, list)
        self.assertEqual(len(body), 2)  # Expecting 2 items
        self.assertEqual(body[0]["timestamp"], "1711814400")
        self.assertEqual(body[1]["average_punctuality"], "88")

    @patch("functions.return_punctuality_by_timestamp.lambda_function.dynamodb.Table")
    def test_lambda_handler_empty_response(self, mock_table):
        """
        Test Lambda function when DynamoDB returns an empty response.
        """
        mock_table.return_value.scan.return_value = {"Items": []}  # Empty dataset

        event = {}
        result = lambda_handler(event, {})

        self.assertEqual(result["statusCode"], 200)
        body = json.loads(result["body"])
        self.assertIsInstance(body, list)
        self.assertEqual(len(body), 0)  # Expecting an empty list

    @patch("functions.return_punctuality_by_timestamp.lambda_function.dynamodb.Table")
    def test_lambda_handler_pagination(self, mock_table):
        """
        Test Lambda function handles paginated DynamoDB results correctly.
        """
        # Simulate paginated responses
        def scan_side_effect(*args, **kwargs):
            if "ExclusiveStartKey" not in kwargs:
                return {"Items": [{"timestamp": "1711814400", "average_punctuality": "95"}], "LastEvaluatedKey": "key1"}
            elif kwargs["ExclusiveStartKey"] == "key1":
                return {"Items": [{"timestamp": "1711900800", "average_punctuality": "88"}], "LastEvaluatedKey": "key2"}
            elif kwargs["ExclusiveStartKey"] == "key2":
                return {"Items": [{"timestamp": "1711987200", "average_punctuality": "92"}]}  # Last page

        mock_table.return_value.scan.side_effect = scan_side_effect

        event = {}
        result = lambda_handler(event, {})

        self.assertEqual(result["statusCode"], 200)
        body = json.loads(result["body"])
        self.assertIsInstance(body, list)
        self.assertEqual(len(body), 3)  # Expecting 3 items
        self.assertEqual(body[0]["timestamp"], "1711814400")
        self.assertEqual(body[1]["timestamp"], "1711900800")
        self.assertEqual(body[2]["timestamp"], "1711987200")

    @patch("functions.return_punctuality_by_timestamp.lambda_function.dynamodb.Table")
    def test_lambda_handler_exception(self, mock_table):
        """
        Test Lambda function when an exception occurs (e.g., DynamoDB error).
        """
        mock_table.return_value.scan.side_effect = Exception("DynamoDB error")  # Simulate error

        event = {}
        result = lambda_handler(event, {})

        self.assertEqual(result["statusCode"], 500)
        body = json.loads(result["body"])
        self.assertIsInstance(body, dict)
        self.assertIn("error", body)
        self.assertEqual(body["error"], "DynamoDB error")

if __name__ == "__main__":
    unittest.main()
