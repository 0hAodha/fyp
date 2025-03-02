#!/bin/sh

API_URL="https://3fzg2hdskc.execute-api.us-east-1.amazonaws.com/return_luas_data"

if [ "$1" ]; then
    query_string="?luasStopCode=$1"
fi

curl "$API_URL$query_string"
