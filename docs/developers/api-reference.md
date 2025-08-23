# API Reference

Complete reference for all Precision PDF API endpoints and Convex functions.

## 🚨 Security Status

**All API endpoints currently have authentication DISABLED for local development.**

For production deployment, see [Re-enabling Authentication](../security/re-enabling-auth.md).

## Base URLs

- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`
- **FastAPI Service**: `http://localhost:8000` (dev) / `https://your-fastapi.onrender.com` (prod)

## Authentication (When Enabled)

All API endpoints require authentication via Clerk JWT tokens:

```http
Authorization: Bearer <jwt-token>
```

## Document Management APIs

### Upload Document

Upload a PDF document for processing.

**Endpoint:** `POST /api/upload-document`

**Content-Type:** `multipart/form-data`

**Request Body:**

```typescript
{
  file: File; // PDF file
}
```

**Response:**

```typescript
{
  success: true,
  documentId: string,
  message: "Document uploaded successfully"
}
```

**Error Responses:**

```typescript
// 400 - Bad Request
{
  error: "No file provided" | "Invalid file type" | "File too large"
}

// 401 - Unauthorized (when auth enabled)
{
  error: "Unauthorized"
}

// 402 - Insufficient Credits
{
  error: "Insufficient credits",
  details: {
    required: number,
    available: number
  }
}

// 500 - Server Error
{
  error: "Upload failed",
  details: string
}
```

**Example:**

```bash
curl -X POST \
  -H "Content-Type: multipart/form-data" \
  -F "file=@document.pdf" \
  http://localhost:3000/api/upload-document
```

### Progressive Document Upload

Alternative upload endpoint with progress tracking.

**Endpoint:** `POST /api/upload-document-progressive`

Similar to standard upload but with streaming support for large files.

### Process Document

Process a document with Landing AI (called internally after upload).

**Endpoint:** `POST /api/process-document`

**Request Body:**

```typescript
{
  file: File; // PDF file
}
```

**Response:**

```typescript
{
  markdown: string,
  chunks: Array<{
    chunk_id: string,
    content: string,
    page: number,
    bbox?: {
      x: number,
      y: number,
      width: number,
      height: number
    },
    metadata: any
  }>,
  marginalia?: any[]
}
```

**Example:**

```bash
curl -X POST \
  -H "Content-Type: multipart/form-data" \
  -F "file=@document.pdf" \
  http://localhost:3000/api/process-document
```

## Document Export APIs

### Single Document Exports

Export individual documents in various formats.

#### Export as JSON

**Endpoint:** `GET /api/export/json?documentId=<id>`

**Response:** JSON file download

```json
{
  "title": "Document Title",
  "pageCount": 3,
  "markdown": "# Document content...",
  "chunks": [...]
}
```

#### Export as CSV

**Endpoint:** `GET /api/export/csv?documentId=<id>`

**Response:** CSV file download with extracted tabular data

#### Export as DOCX

**Endpoint:** `GET /api/export/docx?documentId=<id>`

**Response:** Microsoft Word document download

#### Export as Markdown

**Endpoint:** `GET /api/export/markdown?documentId=<id>`

**Response:** Markdown file download

#### Export as Text

**Endpoint:** `GET /api/export/text?documentId=<id>`

**Response:** Plain text file download

#### Export as XLSX

**Endpoint:** `GET /api/export/xlsx?documentId=<id>`

**Response:** Excel spreadsheet download

**Example:**

```bash
curl -O "http://localhost:3000/api/export/json?documentId=abc123"
```

### Bulk Exports

Export all user documents in a single archive.

**Endpoints:**

- `GET /api/export/all-json` - All documents as JSON files
- `GET /api/export/all-docx` - All documents as Word files
- `GET /api/export/all-markdown` - All documents as Markdown files
- `GET /api/export/all-text` - All documents as text files
- `GET /api/export/all-xlsx` - All documents as Excel files

**Response:** ZIP archive download

**Example:**

```bash
curl -O "http://localhost:3000/api/export/all-json"
```

## Document Asset APIs

### Get Page Image

Retrieve rendered page images from documents.

**Endpoint:** `GET /api/documents/[id]/page-image/[page]`

**Parameters:**

- `id`: Document ID
- `page`: Page number (0-indexed)

**Response:** PNG image

**Example:**

```bash
curl "http://localhost:3000/api/documents/abc123/page-image/0" \
  -o page-0.png
```

## Example Documents API

### Load Example Document

Load pre-processed example documents for demo purposes.

**Endpoint:** `GET /api/examples/load?example=<example-name>`

**Parameters:**

- `example`: One of: `invoice`, `bank_statement_1`, `bank_statement_2`, `medical_report_1`, `medical_report_2`, `medical_journal_article`, `mortgage_application`, `settlement_statement`

**Response:**

```typescript
{
  success: true,
  documentId: string,
  data: {
    title: string,
    markdown: string,
    chunks: Array<Chunk>,
    pageImages: string[],
    pageCount: number
  }
}
```

**Example:**

```bash
curl "http://localhost:3000/api/examples/load?example=invoice"
```

## Health Check APIs

### FastAPI Health Check

Check if the FastAPI service is available.

**Endpoint:** `GET /api/test`

**Response:**

```typescript
{
  message: "Hello from Next.js API!",
  fastApiStatus: "connected" | "error",
  fastApiMessage?: string
}
```

**Example:**

```bash
curl "http://localhost:3000/api/test"
```

## User Sync API

### Clerk User Sync Webhook

Webhook endpoint for syncing user data from Clerk.

**Endpoint:** `POST /api/sync-user`

**Headers:**

```http
svix-id: <webhook-id>
svix-timestamp: <timestamp>
svix-signature: <signature>
```

**Request Body:** Clerk webhook payload

**Response:**

```typescript
{
  success: true,
  message: "User synced successfully"
}
```

## Convex Functions Reference

### Queries (Read Operations)

#### Get Current User

```typescript
api.users.current;
```

**Returns:** `User | null`

#### List Documents

```typescript
api.documents.listDocuments;
```

**Returns:** `Array<Document>`

#### Get Document

```typescript
api.documents.getDocument(documentId: Id<"documents">)
```

**Returns:** `Document | null`

#### Get User Subscription

```typescript
api.subscriptions.getUserSubscription;
```

**Returns:** `Subscription | null`

#### Get Page Usage

```typescript
api.subscriptions.getUserPageUsage;
```

**Returns:** `{ used: number, limit: number, percentage: number }`

### Mutations (Write Operations)

#### Create Document

```typescript
api.documents.createDocument({
  title: string,
  fileId: Id<"_storage">,
  fileSize: number,
  mimeType: string,
  pageCount?: number
})
```

**Returns:** `Id<"documents">`

#### Update Document Status

```typescript
api.documents.updateDocumentStatus({
  documentId: Id<"documents">,
  status: "uploading" | "processing" | "completed" | "failed",
  landingAiResponse?: any,
  markdown?: string,
  chunks?: Array<Chunk>,
  pageImages?: Array<Id<"_storage">>,
  pageCount?: number,
  errorMessage?: string
})
```

**Returns:** `void`

#### Create Example Document

```typescript
api.documents.createExampleDocument({
  exampleName: string,
  data: {
    title: string,
    markdown: string,
    chunks: Array<Chunk>,
    pageImages: string[],
    pageCount: number
  }
})
```

**Returns:** `Id<"documents">`

### Actions (External API Calls)

#### Generate Upload URL

```typescript
api.documents.generateUploadUrl;
```

**Returns:** `string` (pre-signed upload URL)

#### Process Document with Landing AI

```typescript
api.documents.processDocumentWithLandingAI({
  documentId: Id<"documents">,
});
```

**Returns:** `{ success: boolean, error?: string }`

## Data Types

### Document

```typescript
interface Document {
  _id: Id<"documents">;
  userId: Id<"users">;
  title: string;
  fileId?: Id<"_storage">;
  status: "uploading" | "processing" | "completed" | "failed";
  errorMessage?: string;
  landingAiResponse?: any;
  markdown?: string;
  chunks?: Array<Chunk>;
  marginalia?: any[];
  pageImages?: Array<Id<"_storage">>;
  pageCount?: number;
  fileSize: number;
  mimeType: string;
  createdAt: number;
  updatedAt: number;
}
```

### Chunk

```typescript
interface Chunk {
  chunk_id: string;
  content: string;
  page: number;
  bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  metadata: any;
}
```

### User

```typescript
interface User {
  _id: Id<"users">;
  name: string;
  email: string;
  externalId: string; // Clerk user ID
}
```

### Subscription

```typescript
interface Subscription {
  _id: Id<"subscriptions">;
  userId: Id<"users">;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
  planId: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}
```

## Error Handling

### Standard Error Format

```typescript
{
  error: string,      // Human-readable error message
  code?: string,      // Error code for programmatic handling
  details?: any       // Additional error details
}
```

### Common Error Codes

| Code                   | Status | Description                        |
| ---------------------- | ------ | ---------------------------------- |
| `UNAUTHORIZED`         | 401    | Invalid or missing authentication  |
| `FORBIDDEN`            | 403    | User lacks required permissions    |
| `NOT_FOUND`            | 404    | Resource not found                 |
| `VALIDATION_ERROR`     | 400    | Invalid request data               |
| `RATE_LIMITED`         | 429    | Too many requests                  |
| `INSUFFICIENT_CREDITS` | 402    | User has insufficient page credits |
| `PROCESSING_FAILED`    | 500    | Document processing failed         |
| `UPLOAD_FAILED`        | 500    | File upload failed                 |

## Rate Limiting

When rate limiting is enabled:

**Limits:**

- Upload API: 10 uploads per hour per user/IP
- Export API: 100 exports per hour per user
- General API: 1000 requests per hour per user/IP

**Rate Limit Headers:**

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## FastAPI Service Integration

The main application integrates with an external FastAPI service for document processing.

### FastAPI Endpoints Used

**Base URL:** `http://localhost:8000` (dev) / `https://your-service.onrender.com` (prod)

#### Process Document

```http
POST /api/process_document
Headers:
  X-API-Key: <FAST_API_SECRET_KEY>
Body: multipart/form-data with PDF file
```

#### Convert Formats

```http
POST /api/convert_to_json
POST /api/convert_to_csv
POST /api/convert_to_docx
POST /api/convert_to_markdown
POST /api/convert_to_text
POST /api/convert_to_xlsx
```

#### Health Check

```http
GET /health
```

**FastAPI Repository:** https://github.com/robertguss/precision_pdf_fast_api

## WebSocket/Real-time Updates

Convex provides real-time updates via WebSocket connections:

### React Hooks

```typescript
// Subscribe to document list changes
const documents = useQuery(api.documents.listDocuments);

// Subscribe to specific document updates
const document = useQuery(api.documents.getDocument, {
  documentId: "abc123",
});

// Execute mutations
const createDocument = useMutation(api.documents.createDocument);
```

### Real-time Events

- Document status changes (uploading → processing → completed)
- New documents added to user's list
- Processing progress updates
- Error notifications

## SDK Examples

### JavaScript/TypeScript

```typescript
// Upload document
const formData = new FormData();
formData.append("file", file);

const response = await fetch("/api/upload-document", {
  method: "POST",
  body: formData,
});

const result = await response.json();
```

### React Integration

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function DocumentList() {
  const documents = useQuery(api.documents.listDocuments);
  const createDocument = useMutation(api.documents.createDocument);

  if (documents === undefined) return <div>Loading...</div>;

  return (
    <div>
      {documents.map(doc => (
        <div key={doc._id}>{doc.title}</div>
      ))}
    </div>
  );
}
```

## Testing the API

### Using curl

```bash
# Upload document
curl -X POST \
  -F "file=@test.pdf" \
  http://localhost:3000/api/upload-document

# Get document as JSON
curl "http://localhost:3000/api/export/json?documentId=abc123" \
  -o document.json

# Check API health
curl "http://localhost:3000/api/test"

# Load example
curl "http://localhost:3000/api/examples/load?example=invoice"
```

### Using Postman

Import the following collection:

```json
{
  "info": { "name": "Precision PDF API" },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    }
  ],
  "item": [
    {
      "name": "Upload Document",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/upload-document",
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "file",
              "type": "file"
            }
          ]
        }
      }
    }
  ]
}
```

## Next Steps

- **[Convex Functions Guide](./convex-functions.md)** - Detailed backend function documentation
- **[FastAPI Integration](./fastapi-integration.md)** - External service integration
- **[Authentication Setup](../security/re-enabling-auth.md)** - Enable authentication
- **[API Examples](../examples/curl-examples.md)** - More practical examples
