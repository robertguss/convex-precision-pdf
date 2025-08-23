# API Examples with curl

Complete examples for using the Precision PDF API with curl commands.

## 🚨 Authentication Status

**All API endpoints currently have authentication DISABLED for local development.**

For production deployment with authentication, see [Re-enabling Authentication](../security/re-enabling-auth.md).

## Prerequisites

- **curl** installed on your system
- **Precision PDF** running locally (`pnpm run dev`)
- **Optional**: FastAPI service for processing (`http://localhost:8000`)

## Basic Usage

### Check API Health

Test if the API is running and FastAPI service is connected.

```bash
# Basic health check
curl "http://localhost:3000/api/test"

# Expected response:
{
  "message": "Hello from Next.js API!",
  "fastApiStatus": "connected",
  "fastApiMessage": "FastAPI service is running"
}
```

### Load Example Document

Load one of the pre-processed example documents.

```bash
# Load invoice example
curl "http://localhost:3000/api/examples/load?example=invoice"

# Load medical report example
curl "http://localhost:3000/api/examples/load?example=medical_report_1"

# All available examples:
# - invoice
# - bank_statement_1
# - bank_statement_2  
# - medical_report_1
# - medical_report_2
# - medical_journal_article
# - mortgage_application
# - settlement_statement
```

**Response:**
```json
{
  "success": true,
  "documentId": "abc123...",
  "data": {
    "title": "Invoice Example",
    "markdown": "# Invoice\n\n**Company:** Acme Corp...",
    "chunks": [...],
    "pageImages": [...],
    "pageCount": 2
  }
}
```

## Document Upload and Processing

### Upload a PDF Document

Upload a PDF file for processing.

```bash
# Upload a document
curl -X POST \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your/document.pdf" \
  "http://localhost:3000/api/upload-document"
```

**Response:**
```json
{
  "success": true,
  "documentId": "k170...",
  "message": "Document uploaded successfully"
}
```

### Upload with Error Handling

```bash
# Upload with verbose output and error handling
curl -X POST \
  -H "Content-Type: multipart/form-data" \
  -F "file=@document.pdf" \
  -w "HTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
  -v \
  "http://localhost:3000/api/upload-document"
```

### Process Document Directly

Send a PDF directly to the processing endpoint.

```bash
# Process document with FastAPI
curl -X POST \
  -H "Content-Type: multipart/form-data" \
  -F "file=@document.pdf" \
  "http://localhost:3000/api/process-document"
```

**Response:**
```json
{
  "markdown": "# Document Title\n\nExtracted content...",
  "chunks": [
    {
      "chunk_id": "chunk_1",
      "content": "Company Name: Acme Corp",
      "page": 0,
      "bbox": {
        "x": 100,
        "y": 50,
        "width": 200,
        "height": 20
      },
      "metadata": {...}
    }
  ],
  "marginalia": [...]
}
```

## Document Export

### Export Single Document

Export a document in various formats.

```bash
# Export as JSON
curl "http://localhost:3000/api/export/json?documentId=abc123" \
  -o document.json

# Export as CSV  
curl "http://localhost:3000/api/export/csv?documentId=abc123" \
  -o document.csv

# Export as Word document
curl "http://localhost:3000/api/export/docx?documentId=abc123" \
  -o document.docx

# Export as Markdown
curl "http://localhost:3000/api/export/markdown?documentId=abc123" \
  -o document.md

# Export as plain text
curl "http://localhost:3000/api/export/text?documentId=abc123" \
  -o document.txt

# Export as Excel
curl "http://localhost:3000/api/export/xlsx?documentId=abc123" \
  -o document.xlsx
```

### Bulk Export All Documents

Export all user documents in a single archive.

```bash
# Export all as JSON files
curl "http://localhost:3000/api/export/all-json" \
  -o all-documents.zip

# Export all as Word documents
curl "http://localhost:3000/api/export/all-docx" \
  -o all-documents.zip

# Export all as Markdown
curl "http://localhost:3000/api/export/all-markdown" \
  -o all-documents.zip

# Export all as text files
curl "http://localhost:3000/api/export/all-text" \
  -o all-documents.zip

# Export all as Excel files
curl "http://localhost:3000/api/export/all-xlsx" \
  -o all-documents.zip
```

## Document Assets

### Get Page Images

Retrieve rendered page images from processed documents.

```bash
# Get first page (page 0) as PNG
curl "http://localhost:3000/api/documents/abc123/page-image/0" \
  -o page-0.png

# Get second page
curl "http://localhost:3000/api/documents/abc123/page-image/1" \
  -o page-1.png

# Download all pages in sequence
for i in {0..9}; do
  curl "http://localhost:3000/api/documents/abc123/page-image/$i" \
    -o "page-$i.png" \
    --fail --silent
done
```

## Advanced Examples

### Complete Workflow

Upload, process, and export a document in one workflow.

```bash
#!/bin/bash

# 1. Upload document
echo "Uploading document..."
RESPONSE=$(curl -X POST \
  -H "Content-Type: multipart/form-data" \
  -F "file=@invoice.pdf" \
  "http://localhost:3000/api/upload-document" \
  --silent)

# Extract document ID
DOCUMENT_ID=$(echo $RESPONSE | grep -o '"documentId":"[^"]*' | cut -d'"' -f4)
echo "Document ID: $DOCUMENT_ID"

# 2. Wait for processing (in real app, use WebSocket or polling)
echo "Waiting for processing..."
sleep 10

# 3. Export as JSON
echo "Exporting as JSON..."
curl "http://localhost:3000/api/export/json?documentId=$DOCUMENT_ID" \
  -o "exported-$DOCUMENT_ID.json"

# 4. Export as CSV
echo "Exporting as CSV..."
curl "http://localhost:3000/api/export/csv?documentId=$DOCUMENT_ID" \
  -o "exported-$DOCUMENT_ID.csv"

echo "Workflow complete!"
```

### Batch Processing

Process multiple documents in batch.

```bash
#!/bin/bash

# Directory containing PDF files
PDF_DIR="/path/to/pdf/files"
OUTPUT_DIR="/path/to/output"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Process each PDF file
for pdf_file in "$PDF_DIR"/*.pdf; do
  filename=$(basename "$pdf_file" .pdf)
  echo "Processing: $filename"
  
  # Upload document
  response=$(curl -X POST \
    -H "Content-Type: multipart/form-data" \
    -F "file=@$pdf_file" \
    "http://localhost:3000/api/upload-document" \
    --silent)
  
  # Extract document ID
  doc_id=$(echo $response | grep -o '"documentId":"[^"]*' | cut -d'"' -f4)
  
  if [ -n "$doc_id" ]; then
    echo "  Document ID: $doc_id"
    
    # Wait for processing
    sleep 5
    
    # Export as JSON
    curl "http://localhost:3000/api/export/json?documentId=$doc_id" \
      -o "$OUTPUT_DIR/$filename.json" \
      --silent
    
    echo "  Exported: $filename.json"
  else
    echo "  Error uploading: $filename"
  fi
done

echo "Batch processing complete!"
```

### Error Handling

Handle various error scenarios.

```bash
#!/bin/bash

upload_with_error_handling() {
  local file="$1"
  
  echo "Uploading: $file"
  
  # Upload with status code capture
  response=$(curl -X POST \
    -H "Content-Type: multipart/form-data" \
    -F "file=@$file" \
    -w "HTTPSTATUS:%{http_code}" \
    "http://localhost:3000/api/upload-document" \
    --silent)
  
  # Extract HTTP status
  http_status=$(echo $response | grep -o 'HTTPSTATUS:[0-9]*' | cut -d':' -f2)
  response_body=$(echo $response | sed 's/HTTPSTATUS:[0-9]*$//')
  
  case $http_status in
    200|201)
      echo "✅ Upload successful"
      echo "$response_body"
      ;;
    400)
      echo "❌ Bad Request (400)"
      echo "$response_body"
      ;;
    401)
      echo "❌ Unauthorized (401) - Authentication required"
      ;;
    402)
      echo "❌ Payment Required (402) - Insufficient credits"
      echo "$response_body"
      ;;
    413)
      echo "❌ File too large (413)"
      ;;
    500)
      echo "❌ Server Error (500)"
      echo "$response_body"
      ;;
    *)
      echo "❌ Unexpected status: $http_status"
      echo "$response_body"
      ;;
  esac
}

# Usage
upload_with_error_handling "document.pdf"
```

### API Response Validation

Validate API responses and extract data.

```bash
#!/bin/bash

# Function to validate JSON response
validate_json_response() {
  local response="$1"
  
  # Check if response is valid JSON
  if echo "$response" | jq . >/dev/null 2>&1; then
    echo "✅ Valid JSON response"
    
    # Extract success status
    success=$(echo "$response" | jq -r '.success // false')
    
    if [ "$success" = "true" ]; then
      echo "✅ Operation successful"
      
      # Extract document ID if present
      doc_id=$(echo "$response" | jq -r '.documentId // empty')
      if [ -n "$doc_id" ]; then
        echo "📄 Document ID: $doc_id"
        return 0
      fi
    else
      echo "❌ Operation failed"
      error=$(echo "$response" | jq -r '.error // "Unknown error"')
      echo "Error: $error"
      return 1
    fi
  else
    echo "❌ Invalid JSON response"
    echo "Response: $response"
    return 1
  fi
}

# Example usage
response=$(curl -X POST \
  -H "Content-Type: multipart/form-data" \
  -F "file=@document.pdf" \
  "http://localhost:3000/api/upload-document" \
  --silent)

validate_json_response "$response"
```

## Monitoring and Debugging

### Verbose Output

Get detailed information about requests.

```bash
# Verbose curl output
curl "http://localhost:3000/api/test" \
  -v \
  -w "
Status: %{http_code}
Time: %{time_total}s
Size: %{size_download} bytes
"
```

### Request Timing

Measure API performance.

```bash
# Time API requests
curl "http://localhost:3000/api/test" \
  -w "
DNS lookup:    %{time_namelookup}s
Connect:       %{time_connect}s
App connect:   %{time_appconnect}s
Pre-transfer:  %{time_pretransfer}s
Start transfer: %{time_starttransfer}s
Total time:    %{time_total}s
"
```

### Save Request/Response

Save requests and responses for debugging.

```bash
# Save headers and response
curl "http://localhost:3000/api/test" \
  -D headers.txt \
  -o response.json \
  -w "Status: %{http_code}\n"

# View saved files
echo "Headers:"
cat headers.txt
echo -e "\nResponse:"
cat response.json
```

## Integration Examples

### Python Integration

```python
import requests
import json

# Upload document
def upload_document(file_path):
    url = "http://localhost:3000/api/upload-document"
    
    with open(file_path, 'rb') as file:
        files = {'file': file}
        response = requests.post(url, files=files)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Upload failed: {response.text}")

# Export document
def export_document(document_id, format='json'):
    url = f"http://localhost:3000/api/export/{format}"
    params = {'documentId': document_id}
    
    response = requests.get(url, params=params)
    
    if response.status_code == 200:
        return response.content
    else:
        raise Exception(f"Export failed: {response.text}")

# Usage
try:
    result = upload_document("document.pdf")
    document_id = result['documentId']
    
    # Export as JSON
    json_data = export_document(document_id, 'json')
    with open('exported.json', 'wb') as f:
        f.write(json_data)
        
except Exception as e:
    print(f"Error: {e}")
```

### JavaScript/Node.js Integration

```javascript
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

// Upload document
async function uploadDocument(filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  
  const response = await fetch('http://localhost:3000/api/upload-document', {
    method: 'POST',
    body: form
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
  
  return await response.json();
}

// Export document
async function exportDocument(documentId, format = 'json') {
  const url = `http://localhost:3000/api/export/${format}?documentId=${documentId}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }
  
  return await response.buffer();
}

// Usage
(async () => {
  try {
    const result = await uploadDocument('document.pdf');
    const documentId = result.documentId;
    
    // Wait for processing
    setTimeout(async () => {
      const exportedData = await exportDocument(documentId, 'json');
      fs.writeFileSync('exported.json', exportedData);
      console.log('Document exported successfully');
    }, 5000);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
```

## Next Steps

- **[JavaScript SDK Examples](./javascript-sdk.md)** - Frontend integration
- **[Python Examples](./python-examples.md)** - Backend integration  
- **[API Reference](../developers/api-reference.md)** - Complete API documentation
- **[Authentication Setup](../security/re-enabling-auth.md)** - Enable authentication for production