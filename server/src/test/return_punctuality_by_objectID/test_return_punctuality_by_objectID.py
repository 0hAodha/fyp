import unittest
from unittest.mock import patch, MagicMock
import json
from functions.return_punctuality_by_objectID.lambda_function import lambda_handler

class TestPunctualityLambda(unittest.TestCase):
    """
    Unit tests for the Lambda function that fetches punctuality data.
    """

    @patch("functions.return_punctuality_by_objectID.lambda_function.table.scan")
    def test_lambda_handler_success(self, mock_scan):
        """
        Test Lambda function when DynamoDB returns valid data.
        """
        mock_scan.return_value = {
            "Items": [
                {"objectID": "Train-1", "average_punctuality": "95"},
                {"objectID": "Bus-2", "average_punctuality": "88"}
            ]
        }

        event = {}
        result = lambda_handler(event, {})

        self.assertEqual(result["statusCode"], 200)
        body = json.loads(result["body"])
        self.assertIsInstance(body, list)  # Ensure response is a list
        self.assertEqual(len(body), 2)  # Expecting only 2 items
        self.assertEqual(body[0]["objectID"], "Train-1")
        self.assertEqual(body[1]["average_punctuality"], "88")

    @patch("functions.return_punctuality_by_objectID.lambda_function.table.scan")
    def test_lambda_handler_empty_response(self, mock_scan):
        """
        Test Lambda function when DynamoDB returns an empty response.
        """
        mock_scan.return_value = {"Items": []}  # Mock empty response

        event = {}
        result = lambda_handler(event, {})

        self.assertEqual(result["statusCode"], 200)
        body = json.loads(result["body"])
        self.assertIsInstance(body, list)
        self.assertEqual(len(body), 0)  # Expecting an empty list

    @patch("functions.return_punctuality_by_objectID.lambda_function.table.scan")
    def test_lambda_handler_exception(self, mock_scan):
        """
        Test Lambda function when an exception occurs (e.g., DynamoDB error).
        """
        mock_scan.side_effect = Exception("DynamoDB error")  # Simulate exception

        event = {}
        result = lambda_handler(event, {})

        self.assertEqual(result["statusCode"], 500)
        body = json.loads(result["body"])
        self.assertIsInstance(body, dict)  # Ensure error response is a dict
        self.assertIn("error", body)
        self.assertEqual(body["error"], "Failed to fetch punctuality data")

if __name__ == "__main__":
    unittest.main()
