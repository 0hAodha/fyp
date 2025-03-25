#!/bin/sh

API_URL="https://z3o9pdmy8g.execute-api.us-east-1.amazonaws.com/return_punctuality_by_timestamp"

curl "$API_URL$query_string"
