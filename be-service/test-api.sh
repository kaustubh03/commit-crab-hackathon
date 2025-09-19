#!/bin/bash

# API Testing Script for Backend Service
# This script tests both GET and POST endpoints

BASE_URL="http://localhost:3000"
DATA_ENDPOINT="/data"

echo "🚀 Testing Backend Service API"
echo "================================="

# Test 1: GET /data - Retrieve all data
echo ""
echo "📋 Test 1: GET /data - Retrieve all data"
echo "----------------------------------------"
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" $BASE_URL$DATA_ENDPOINT)
http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

if [ "$http_status" -eq 200 ]; then
    echo "✅ SUCCESS: HTTP $http_status"
    echo "📄 Response:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo "❌ FAILED: HTTP $http_status"
    echo "📄 Response: $body"
fi

# Test 2: POST /data - Add new entry
echo ""
echo "📝 Test 2: POST /data - Add new entry"
echo "-------------------------------------"
test_data='{
  "name": "Test User",
  "email": "test@example.com"
}'

echo "📤 Sending data: $test_data"
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d "$test_data" \
  $BASE_URL$DATA_ENDPOINT)

http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

if [ "$http_status" -eq 201 ]; then
    echo "✅ SUCCESS: HTTP $http_status"
    echo "📄 Response:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo "❌ FAILED: HTTP $http_status"
    echo "📄 Response: $body"
fi

# Test 3: GET /data again - Verify new entry was added
echo ""
echo "🔄 Test 3: GET /data - Verify new entry was added"
echo "--------------------------------------------------"
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" $BASE_URL$DATA_ENDPOINT)
http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

if [ "$http_status" -eq 200 ]; then
    echo "✅ SUCCESS: HTTP $http_status"
    echo "📊 Total entries: $(echo "$body" | jq '. | length' 2>/dev/null || echo "Unable to parse")"
    echo "📄 Latest entries:"
    echo "$body" | jq '.[-2:]' 2>/dev/null || echo "$body"
else
    echo "❌ FAILED: HTTP $http_status"
    echo "📄 Response: $body"
fi

echo ""
echo "🎉 API Testing Complete!"
echo "========================"
echo "💡 Make sure the server is running with: npm start"
echo "💡 Server should be available at: $BASE_URL"