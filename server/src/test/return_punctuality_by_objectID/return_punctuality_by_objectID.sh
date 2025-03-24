#!/bin/sh

API_URL="https://fv7l6v5he4.execute-api.us-east-1.amazonaws.com/return_punctuality_by_objectID"

curl "$API_URL$query_string"
