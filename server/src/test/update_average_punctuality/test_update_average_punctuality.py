import unittest
from unittest.mock import patch, MagicMock
import json
from functions.update_average_punctuality.lambda_function import lambda_handler, fetch_train_data, update_punctuality, update_punctuality_by_timestamp


class TestPunctualityLambda(unittest.TestCase):
    """
    Unit tests for the Lambda function that processes and updates train punctuality data.
    """

    ### ✅ TEST FETCHING TRAIN DATA ✅ ###

    @patch("functions.update_average_punctuality.lambda_function.requests.get")
    def test_fetch_train_data_success(self, mock_get):
        """
        Test successful train data retrieval from the API.
        """
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = json.dumps([
            {"objectID": "Train-1", "trainPunctuality": "95", "timestamp": "1711814400"},
            {"objectID": "Train-2", "trainPunctuality": "88", "timestamp": "1711814400"}
        ])
        mock_response.json.return_value = json.loads(mock_response.text)

        mock_get.return_value = mock_response

        result = fetch_train_data()
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["objectID"], "Train-1")
        self.assertEqual(result[1]["trainPunctuality"], "88")

    @patch("functions.update_average_punctuality.lambda_function.requests.get")
    def test_fetch_train_data_api_failure(self, mock_get):
        """
        Test API failure handling (request error).
        """
        mock_get.side_effect = Exception("API request failed")

        with self.assertRaises(Exception) as context:
            fetch_train_data()

        self.assertEqual(str(context.exception), "API request failed")

    @patch("functions.update_average_punctuality.lambda_function.requests.get")
    def test_fetch_train_data_empty_response(self, mock_get):
        """
        Test handling of empty API response.
        """
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = ""
        mock_response.json.return_value = []

        mock_get.return_value = mock_response

        result = fetch_train_data()
        self.assertEqual(result, [])

    @patch("functions.update_average_punctuality.lambda_function.requests.get")
    def test_fetch_train_data_invalid_json(self, mock_get):
        """
        Test handling of invalid JSON response.
        """
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = "invalid json"
        mock_response.json.side_effect = json.JSONDecodeError("Invalid JSON", doc="", pos=0)

        mock_get.return_value = mock_response

        result = fetch_train_data()
        self.assertEqual(result, [])


    ### ✅ TEST PUNCTUALITY UPDATES IN DYNAMODB ✅ ###

    @patch("functions.update_average_punctuality.lambda_function.table_train.get_item")
    @patch("functions.update_average_punctuality.lambda_function.table_train.update_item")
    @patch("functions.update_average_punctuality.lambda_function.table_train.put_item")
    def test_update_punctuality_existing_train(self, mock_put, mock_update, mock_get):
        """
        Test updating punctuality for an existing train record.
        """
        mock_get.return_value = {"Item": {"objectID": "Train-1", "average_punctuality": "90", "count": 2}}

        update_punctuality("Train-1", 95)

        mock_update.assert_called_once()
        mock_put.assert_not_called()

    @patch("functions.update_average_punctuality.lambda_function.table_train.get_item")
    @patch("functions.update_average_punctuality.lambda_function.table_train.update_item")
    @patch("functions.update_average_punctuality.lambda_function.table_train.put_item")
    def test_update_punctuality_new_train(self, mock_put, mock_update, mock_get):
        """
        Test inserting a new train punctuality record when the train does not exist.
        """
        mock_get.return_value = {}  # No existing record

        update_punctuality("Train-2", 88)

        mock_put.assert_called_once()
        mock_update.assert_not_called()

    @patch("functions.update_average_punctuality.lambda_function.table_timestamp.put_item")
    def test_update_punctuality_by_timestamp(self, mock_put):
        """
        Test updating punctuality by timestamp.
        """
        update_punctuality_by_timestamp(1711814400, [90, 85, 80])

        mock_put.assert_called_once()


    ### ✅ TEST LAMBDA HANDLER EXECUTION ✅ ###

    @patch("functions.update_average_punctuality.lambda_function.fetch_train_data")
    @patch("functions.update_average_punctuality.lambda_function.update_punctuality")
    @patch("functions.update_average_punctuality.lambda_function.update_punctuality_by_timestamp")
    def test_lambda_handler_success(self, mock_update_by_timestamp, mock_update_punctuality, mock_fetch_data):
        """
        Test successful execution of the lambda handler.
        """
        mock_fetch_data.return_value = [
            {"objectID": "Train-1", "trainPunctuality": "95", "timestamp": "1711814400"},
            {"objectID": "Train-2", "trainPunctuality": "88", "timestamp": "1711814400"}
        ]

        event = {}
        result = lambda_handler(event, {})

        self.assertEqual(result["statusCode"], 200)
        self.assertIn("Punctuality data updated successfully", result["body"])
        mock_update_punctuality.assert_called()
        mock_update_by_timestamp.assert_called_once()

    @patch("functions.update_average_punctuality.lambda_function.fetch_train_data")
    def test_lambda_handler_no_data(self, mock_fetch_data):
        """
        Test lambda handler when no train data is available.
        """
        mock_fetch_data.return_value = []

        event = {}
        result = lambda_handler(event, {})

        self.assertEqual(result["statusCode"], 500)
        self.assertIn("No train data available", result["body"])

    @patch("functions.update_average_punctuality.lambda_function.fetch_train_data")
    def test_lambda_handler_missing_timestamp(self, mock_fetch_data):
        """
        Test lambda handler when train data is missing timestamps.
        """
        mock_fetch_data.return_value = [
            {"objectID": "Train-1", "trainPunctuality": "95"}
        ]

        event = {}
        result = lambda_handler(event, {})

        self.assertEqual(result["statusCode"], 500)
        self.assertIn("Missing timestamp in train data", result["body"])

    @patch("functions.update_average_punctuality.lambda_function.fetch_train_data")
    @patch("functions.update_average_punctuality.lambda_function.update_punctuality")
    @patch("functions.update_average_punctuality.lambda_function.update_punctuality_by_timestamp")
    def test_lambda_handler_single_train_entry(self, mock_update_by_timestamp, mock_update_punctuality, mock_fetch_data):
        """
        Test lambda handler with a single train data entry.
        """
        mock_fetch_data.return_value = [
            {"objectID": "Train-1", "trainPunctuality": "90", "timestamp": "1711814400"}
        ]

        event = {}
        result = lambda_handler(event, {})

        self.assertEqual(result["statusCode"], 200)
        self.assertIn("Punctuality data updated successfully", result["body"])
        mock_update_punctuality.assert_called_once()
        mock_update_by_timestamp.assert_called_once()


if __name__ == "__main__":
    unittest.main()
