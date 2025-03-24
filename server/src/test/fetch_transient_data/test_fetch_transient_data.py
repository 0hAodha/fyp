import unittest
from unittest.mock import patch, MagicMock
import os
from functions.fetch_transient_data.lambda_function import (
    fetch_trains,
    fetch_buses
)

class TestTransientData(unittest.TestCase):
    """
    Unit tests for the transient data functions.
    """

    @patch.dict(os.environ, {"PERMANENT_DATA_API": "http://mockapi.com"})
    @patch('functions.fetch_transient_data.lambda_function.session.get')
    def test_fetch_buses(self, mock_get):
        """
        Test the fetch_buses function to ensure it returns the correct data.
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

    @patch('functions.fetch_transient_data.lambda_function.session.get')
    @patch('functions.fetch_transient_data.lambda_function.timestamp', '1234567890')
    def test_fetch_trains(self, mock_get):
        """
        Test the fetch_trains function to ensure it returns the correct data.
        """
        # Mock response for train API
        mock_response = MagicMock()
        mock_response.text = '''
        <ArrayOfObjTrainPositions>
            <objTrainPositions>
                <TrainCode>A123</TrainCode>
                <TrainLatitude>53.0</TrainLatitude>
                <TrainLongitude>-6.0</TrainLongitude>
                <TrainStatus>R</TrainStatus>
                <TrainDate>2025-03-09</TrainDate>
                <PublicMessage>5 mins late</PublicMessage>
                <Direction>Northbound</Direction>
            </objTrainPositions>
        </ArrayOfObjTrainPositions>
        '''
        mock_get.return_value = mock_response

        with patch('functions.fetch_transient_data.lambda_function.xmltodict.parse') as mock_parse:
            # Mock xmltodict to return a dictionary directly
            mock_parse.return_value = {
                "ArrayOfObjTrainPositions": {
                    "objTrainPositions": [
                        {
                            "TrainCode": "A123",
                            "TrainLatitude": "53.0",
                            "TrainLongitude": "-6.0",
                            "TrainStatus": "R",
                            "TrainDate": "2025-03-09",
                            "PublicMessage": "5 mins late",
                            "Direction": "Northbound"
                        }
                    ]
                }
            }

            result = fetch_trains()
            self.assertEqual(len(result), 3)  # 3 train types: M, S, D
            self.assertEqual(result[0]['trainCode'], 'A123')
            self.assertEqual(result[0]['trainStatus'], 'R')
            self.assertEqual(result[0]['trainStatusFull'], 'Running')
            self.assertEqual(result[0]['trainPunctuality'], 5)
            self.assertEqual(result[0]['trainPunctualityStatus'], 'late')
            self.assertEqual(result[0]['latenessMessage'], '5 minutes late')

if __name__ == "__main__":
    unittest.main()
