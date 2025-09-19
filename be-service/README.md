# Backend Service API Documentation

## Overview

This is a Hono.js-based backend service that provides RESTful API endpoints for managing JSON data stored in the `data.json` file. The service handles reading and writing user data with automatic ID generation.

## Base URL
```
http://localhost:3000
```

## Endpoints

### 1. GET /data

Retrieves all data entries from the JSON file.

**Method:** `GET`  
**Endpoint:** `/data`  
**Content-Type:** `application/json`

#### Response

**Success (200):**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com"
  },
  {
    "id": 3,
    "name": "Bob Johnson",
    "email": "bob@example.com"
  }
]
```

**Error (500):**
```json
{
  "error": "Failed to read data"
}
```

#### Example Request
```bash
curl http://localhost:3000/data
```

---

### 2. POST /data

Adds a new entry to the data.json file while maintaining all existing entries. Automatically generates a unique ID for the new entry.

**Method:** `POST`  
**Endpoint:** `/data`  
**Content-Type:** `application/json`

#### Request Body
```json
{
  "name": "Alice Wilson",
  "email": "alice@example.com"
}
```

**Note:** The `id` field is automatically generated and should not be included in the request body.

#### Response

**Success (201):**
```json
{
  "message": "Entry added successfully",
  "entry": {
    "id": 4,
    "name": "Alice Wilson",
    "email": "alice@example.com"
  }
}
```

**Error (500):**
```json
{
  "error": "Failed to add entry"
}
```

#### Example Request
```bash
curl -X POST http://localhost:3000/data \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Wilson",
    "email": "alice@example.com"
  }'
```

## Data Structure

Each data entry follows this structure:

```json
{
  "id": "number (auto-generated)",
  "name": "string",
  "email": "string"
}
```

## Setup and Installation

1. **Navigate to the backend service directory:**
   ```bash
   cd be-service
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

   The server will start on port 3000 by default. You can change the port by setting the `PORT` environment variable:
   ```bash
   PORT=8080 npm start
   ```

## Dependencies

- **Hono**: Web framework for building APIs
- **@hono/node-server**: Node.js server adapter for Hono

## Error Handling

The API includes comprehensive error handling:

- **500 Internal Server Error**: Returned when file operations fail
- All errors return JSON responses with an `error` field describing the issue

## File Storage

- Data is stored in `data.json` in the same directory as the server
- All operations maintain data integrity and preserve existing entries
- File is formatted with proper JSON indentation for readability

## Testing the API

You can test the endpoints using curl or any HTTP client:

1. **Get all data:**
   ```bash
   curl http://localhost:3000/data
   ```

2. **Add new entry:**
   ```bash
   curl -X POST http://localhost:3000/data \
     -H "Content-Type: application/json" \
     -d '{"name": "Test User", "email": "test@example.com"}'
   ```

3. **Verify the new entry was added:**
   ```bash
   curl http://localhost:3000/data
   ```

## Notes

- The service runs synchronously and writes directly to the JSON file
- No database is required - data persists in the local file system
- Automatic ID generation ensures unique identifiers for each entry
- The service is designed for development and small-scale applications