#!/bin/sh

API_URL="https://8g93x0lm0l.execute-api.us-east-1.amazonaws.com/return_historical_data"

if [ "$1" ]; then
    query_string="?objectType=$1"
fi

curl "$API_URL$query_string"
