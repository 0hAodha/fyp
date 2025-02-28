#!/bin/sh

API_URL="https://281bc6mcm5.execute-api.us-east-1.amazonaws.com/transient_data"

if [ "$1" ]; then
    query_string="?objectType=$1"
fi

curl "$API_URL$query_string"
