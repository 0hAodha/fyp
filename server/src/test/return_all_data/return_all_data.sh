#!/bin/sh

API_URL="https://a6y312dpuj.execute-api.us-east-1.amazonaws.com/permanent_data"

if [ "$1" ]; then
    query_string="?objectType=$1"
fi

curl "$API_URL$query_string"
