import unittest
from unittest.mock import patch, MagicMock
import os
from functions.transient_data.transient_data import (
    fetch_trains,
    fetch_buses
)

class TestTransientData(unittest.TestCase):
    """
    Unit tests for the transient data functions.
    """

    @patch.dict(os.environ, {"PERMANENT_DATA_API": "http://mockapi.com"})
    @patch('functions.transient_data.transient_data.session.get')
    def test_fetch_buses(self, mock_get):
        """
        Test the fetch_buses function to ensure it returns the correct data.

        Mocks the network requests to avoid real API calls and sets up the
        expected responses for bus data and bus routes.

        Args:
            mock_get (MagicMock): Mocked session.get method.

        Asserts:
            The length of the result is 1.
            The busID of the first result is 'bus1'.
            The busRouteAgencyName of the first result is 'Dublin Bus'.
        """
        # Mock response for bus data
        mock_response_1 = MagicMock()
        mock_response_1.json.return_value = {"entity": [{"id": "bus1",
                                                         "vehicle": {"position": {"latitude": 53.0, "longitude": -6.0},
                                                                     "trip": {"route_id": "1", "trip_id": "trip1",
                                                                              "start_time": "10:00",
                                                                              "start_date": "20250309",
                                                                              "schedule_relationship": "SCHEDULED",
                                                                              "direction_id": "0"}}}]}

        # Mock response for bus routes
        mock_response_2 = MagicMock()
        mock_response_2.json.return_value = [
            {"busRouteID": "1", "busRouteAgencyName": "Dublin Bus", "busRouteLongName": "Route 1"}]

        # Setting up side effects in the correct order
        mock_get.side_effect = [mock_response_1, mock_response_2]

        # Run the function
        result = fetch_buses()

        # Assertions
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['busID'], 'bus1')
        self.assertEqual(result[0]['busRouteAgencyName'], 'Dublin Bus')

    @patch('functions.transient_data.transient_data.session.get')
    @patch('functions.transient_data.transient_data.timestamp', '1234567890')
    def test_fetch_trains(self, mock_get):
        """
        Test the fetch_trains function to ensure it returns the correct data.

        Mocks the network requests to avoid real API calls and sets up the
        expected response for train data.

        Args:
            mock_get (MagicMock): Mocked session.get method.

        Asserts:
            The length of the result is 3.
            The trainCode of the first result is 'A123'.
            The trainStatus of the first result is 'Running'.
        """
        # Mock response for train API
        mock_response = MagicMock()
        # Fix: Ensure xmltodict.parse() returns a proper dictionary
        mock_response.text = '''
        <ArrayOfObjTrainPositions>
            <objTrainPositions>
                <TrainCode>A123</TrainCode>
                <TrainLatitude>53.0</TrainLatitude>
                <TrainLongitude>-6.0</TrainLongitude>
                <TrainStatus>Running</TrainStatus>
                <TrainDate>2025-03-09</TrainDate>
                <PublicMessage>On time</PublicMessage>
                <Direction>Northbound</Direction>
            </objTrainPositions>
        </ArrayOfObjTrainPositions>
        '''
        mock_get.return_value = mock_response

        with patch('functions.transient_data.transient_data.xmltodict.parse') as mock_parse:
            # Mock xmltodict to return a dictionary directly
            mock_parse.return_value = {
                "ArrayOfObjTrainPositions": {
                    "objTrainPositions": [
                        {
                            "TrainCode": "A123",
                            "TrainLatitude": "53.0",
                            "TrainLongitude": "-6.0",
                            "TrainStatus": "Running",
                            "TrainDate": "2025-03-09",
                            "PublicMessage": "On time",
                            "Direction": "Northbound"
                        }
                    ]
                }
            }

            result = fetch_trains()
            self.assertEqual(len(result), 3)  # 3 train types: M, S, D
            self.assertEqual(result[0]['trainCode'], 'A123')
            self.assertEqual(result[0]['trainStatus'], 'Running')

if __name__ == "__main__":
    unittest.main()