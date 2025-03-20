# Florida Insurance Claims Assistant API Documentation

## API Overview

This document provides comprehensive documentation for the Florida Insurance Claims Assistant API endpoints. The API follows RESTful principles and enables client applications to interact with the system's core functionality including user management, policy management, claims processing, document handling, and more.

### Base URL
```
https://api.flinsuranceclaims.com/api
```

### Authentication
All API requests (except authentication endpoints) require a valid JWT token obtained through the authentication process. Include the token in the `Authorization` header as a Bearer token:

```
Authorization: Bearer <your-jwt-token>
```

### Response Format
All API responses are returned in JSON format with a standard structure:

```json
{
  "success": true,
  "data": { ... },  // Response data
  "error": null     // Error message if success is false
}
```

### Rate Limiting
API requests are rate-limited to prevent abuse. The current limits are:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated requests

## API Endpoints

### Authentication

#### POST /auth/login
Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-123",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "USER"
    }
  },
  "error": null
}
```

#### POST /auth/register
Creates a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "USER"
    }
  },
  "error": null
}
```

#### POST /auth/refresh-token
Refreshes an expired JWT token.

**Request Headers:**
- `Authorization: Bearer <expired-token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "error": null
}
```

#### POST /auth/verify-email
Verifies a user's email address using the verification token.

**Request Body:**
```json
{
  "token": "verification-token-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verified": true
  },
  "error": null
}
```

#### POST /auth/setup-mfa
Initiates multi-factor authentication setup.

**Request Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCodeUrl": "data:image/png;base64,..."
  },
  "error": null
}
```

#### POST /auth/verify-mfa
Verifies MFA token during setup or login.

**Request Body:**
```json
{
  "token": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verified": true
  },
  "error": null
}
```

### User Management

#### GET /user/profile
Retrieves the authenticated user's profile.

**Request Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "USER",
    "emailVerified": true,
    "mfaEnabled": true,
    "createdAt": "2023-01-01T00:00:00Z"
  },
  "error": null
}
```

#### PUT /user/profile
Updates the authenticated user's profile.

**Request Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Updated Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "name": "John Updated Doe",
    "email": "user@example.com"
  },
  "error": null
}
```

#### POST /user/change-password
Changes the user's password.

**Request Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "updated": true
  },
  "error": null
}
```

#### GET /user/sessions
Lists all active sessions for the user.

**Request Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session-123",
        "ipAddress": "192.168.1.1",
        "deviceInfo": "Chrome on Windows",
        "lastActive": "2023-01-01T12:00:00Z",
        "current": true
      },
      {
        "id": "session-456",
        "ipAddress": "192.168.1.2",
        "deviceInfo": "Safari on iPhone",
        "lastActive": "2023-01-02T09:30:00Z",
        "current": false
      }
    ]
  },
  "error": null
}
```

#### DELETE /user/sessions/{sessionId}
Terminates a specific session.

**Request Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "terminated": true
  },
  "error": null
}
```

### Insurance Policies

#### GET /policies
Lists all policies for the authenticated user.

**Request Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Results per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "policies": [
      {
        "id": "policy-123",
        "policyNumber": "POL-001",
        "provider": "Insurance Co",
        "insuranceType": "HOME",
        "coverageAmount": 250000,
        "premium": 1200,
        "startDate": "2023-01-01T00:00:00Z",
        "endDate": "2024-01-01T00:00:00Z",
        "isActive": true,
        "description": "Home insurance policy",
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  },
  "error": null
}
```

#### GET /policies/{policyId}
Retrieves a specific policy.

**Request Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "policy-123",
    "policyNumber": "POL-001",
    "provider": "Insurance Co",
    "insuranceType": "HOME",
    "coverageAmount": 250000,
    "premium": 1200,
    "startDate": "2023-01-01T00:00:00Z",
    "endDate": "2024-01-01T00:00:00Z",
    "isActive": true,
    "description": "Home insurance policy",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z",
    "documents": [
      {
        "id": "doc-123",
        "fileName": "policy-document.pdf",
        "documentType": "POLICY",
        "uploadDate": "2023-01-01T00:00:00Z"
      }
    ]
  },
  "error": null
}
```

#### POST /policies
Creates a new insurance policy.

**Request Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "policyNumber": "POL-002",
  "provider": "Insurance Co",
  "insuranceType": "AUTO",
  "coverageAmount": 50000,
  "premium": 800,
  "startDate": "2023-01-01",
  "endDate": "2024-01-01",
  "description": "Auto insurance policy"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "policy-456",
    "policyNumber": "POL-002",
    "provider": "Insurance Co",
    "insuranceType": "AUTO",
    "coverageAmount": 50000,
    "premium": 800,
    "startDate": "2023-01-01T00:00:00Z",
    "endDate": "2024-01-01T00:00:00Z",
    "isActive": true,
    "description": "Auto insurance policy",
    "createdAt": "2023-01-15T00:00:00Z",
    "updatedAt": "2023-01-15T00:00:00Z"
  },
  "error": null
}
```

#### PUT /policies/{policyId}
Updates an existing insurance policy.

**Request Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "premium": 850,
  "description": "Updated auto insurance policy"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "policy-456",
    "policyNumber": "POL-002",
    "provider": "Insurance Co",
    "insuranceType": "AUTO",
    "coverageAmount": 50000,
    "premium": 850,
    "startDate": "2023-01-01T00:00:00Z",
    "endDate": "2024-01-01T00:00:00Z",
    "isActive": true,
    "description": "Updated auto insurance policy",
    "updatedAt": "2023-01-20T00:00:00Z"
  },
  "error": null
}
```

#### DELETE /policies/{policyId}
Deletes an insurance policy.

**Request Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted": true
  },
  "error": null
}
```

#### GET /policies/filter
Filters policies based on various criteria.

**Request Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `insuranceType` (optional): Comma-separated list of insurance types
- `provider` (optional): Comma-separated list of providers
- `isActive` (optional): Boolean indicating active status
- `minAmount` (optional): Minimum coverage amount
- `maxAmount` (optional): Maximum coverage amount
- `startAfter` (optional): Filter policies starting after this date
- `endBefore` (optional): Filter policies ending before this date
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Results per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "policies": [...],
    "total": 3
  },
  "error": null
}
```

### Claims

#### GET /claims
Lists all claims for the authenticated user.

**Request Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Results per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "claims": [
      {
        "id": "claim-123",
        "claimNumber": "CLM-001",
        "policyId": "policy-123",
        "status": "SUBMITTED",
        "incidentDate": "2023-02-15T00:00:00Z",
        "reportDate": "2023-02-16T00:00:00Z",
        "description": "Water damage in kitchen",
        "damageAmount": 5000,
        "createdAt": "2023-02-16T00:00:00Z",
        "updatedAt": "2023-02-16T00:00:00Z",
        "policy": {
          "policyNumber": "POL-001",
          "provider": "Insurance Co",
          "insuranceType": "HOME"
        }
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  },
  "error": null
}
```

#### GET /claims/{claimId}
Retrieves a specific claim.

**Request Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "claim-123",
    "claimNumber": "CLM-001",
    "policyId": "policy-123",
    "status": "SUBMITTED",
    "incidentDate": "2023-02-15T00:00:00Z",
    "reportDate": "2023-02-16T00:00:00Z",
    "description": "Water damage in kitchen",
    "damageAmount": 5000,
    "createdAt": "2023-02-16T00:00:00Z",
    "updatedAt": "2023-02-16T00:00:00Z",
    "policy": {
      "policyNumber": "POL-001",
      "provider": "Insurance Co",
      "insuranceType": "HOME"
    },
    "documents": [
      {
        "id": "doc-456",
        "fileName": "water-damage.jpg",
        "documentType": "PHOTO",
        "uploadDate": "2023-02-16T00:00:00Z"
      }
    ]
  },
  "error": null
}
```

#### POST /claims
Creates a new insurance claim.

**Request Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "policyId": "policy-123",
  "incidentDate": "2023-02-15",
  "description": "Water damage in kitchen",
  "damageAmount": 5000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "claim-123",
    "claimNumber": "CLM-001",
    "policyId": "policy-123",
    "status": "DRAFT",
    "incidentDate": "2023-02-15T00:00:00Z",
    "reportDate": "2023-02-16T00:00:00Z",
    "description": "Water damage in kitchen",
    "damageAmount": 5000,
    "createdAt": "2023-02-16T00:00:00Z",
    "updatedAt": "2023-02-16T00:00:00Z"
  },
  "error": null
}
```

#### PUT /claims/{claimId}
Updates an existing insurance claim.

**Request Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "description": "Severe water damage in kitchen and bathroom",
  "damageAmount": 7500
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "claim-123",
    "claimNumber": "CLM-001",
    "status": "DRAFT",
    "description": "Severe water damage in kitchen and bathroom",
    "damageAmount": 7500,
    "updatedAt": "2023-02-17T00:00:00Z"
  },
  "error": null
}
```

#### PUT /claims/{claimId}/status
Updates the status of a claim.

**Request Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "SUBMITTED"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "claim-123",
    "claimNumber": "CLM-001",
    "status": "SUBMITTED",
    "updatedAt": "2023-02-17T12:00:00Z"
  },
  "error": null
}
```

#### GET /claims/filter
Filters claims based on various criteria.

**Request Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (optional): Comma-separated list of statuses
- `policyId` (optional): Filter by policy ID
- `incidentDateFrom` (optional): Filter incidents after this date
- `incidentDateTo` (optional): Filter incidents before this date
- `minAmount` (optional): Minimum damage amount
- `maxAmount` (optional): Maximum damage amount
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Results per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "claims": [...],
    "total": 5
  },
  "error": null
}
```

### Documents

#### GET /documents
Lists all documents for the authenticated user.

**Request Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Results per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "doc-123",
        "fileName": "policy-document.pdf",
        "fileType": "application/pdf",
        "fileSize": 1024000,
        "documentType": "POLICY",
        "uploadDate": "2023-01-01T00:00:00Z",
        "description": "Home insurance policy document",
        "policyId": "policy-123",
        "claimId": null,
        "isAnalyzed": true,
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  },
  "error": null
}
```

#### GET /documents/{documentId}
Retrieves a specific document.

**Request Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doc-123",
    "fileName": "policy-document.pdf",
    "fileKey": "users/user-123/policies/policy-123/policy-document.pdf",
    "fileType": "application/pdf",
    "fileSize": 1024000,
    "documentType": "POLICY",
    "uploadDate": "2023-01-01T00:00:00Z",
    "description": "Home insurance policy document",
    "policyId": "policy-123",
    "claimId": null,
    "isAnalyzed": true,
    "extractedData": {
      "policyNumber": "POL-001",
      "provider": "Insurance Co",
      "coverageAmount": "250000",
      "startDate": "2023-01-01",
      "endDate": "2024-01-01"
    },
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z",
    "downloadUrl": "https://s3.amazonaws.com/..."
  },
  "error": null
}
```

#### POST /documents/upload
Uploads a new document.

**Request Headers:**
- `Authorization: Bearer <token>`

**Request Body (multipart/form-data):**
- `file`: Document file
- `documentType`: Type of document (POLICY, CLAIM, PHOTO, etc.)
- `description` (optional): Document description
- `policyId` (optional): Associated policy ID
- `claimId` (optional): Associated claim ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doc-456",
    "fileName": "water-damage.jpg",
    "fileType": "image/jpeg",
    "fileSize": 2048000,
    "documentType": "PHOTO",
    "uploadDate": "2023-02-16T00:00:00Z",
    "description": "Photo of water damage",
    "policyId": null,
    "claimId": "claim-123",
    "isAnalyzed": false,
    "createdAt": "2023-02-16T00:00:00Z",
    "updatedAt": "2023-02-16T00:00:00Z",
    "downloadUrl": "https://s3.amazonaws.com/..."
  },
  "error": null
}
```

#### PUT /documents/{documentId}
Updates document metadata.

**Request Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "description": "Updated document description",
  "documentType": "INVOICE",
  "policyId": "policy-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doc-456",
    "fileName": "water-damage.jpg",
    "description": "Updated document description",
    "documentType": "INVOICE",
    "policyId": "policy-123",
    "updatedAt": "2023-02-17T00:00:00Z"
  },
  "error": null
}
```

#### DELETE /documents/{documentId}
Deletes a document.

**Request Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted": true
  },
  "error": null
}
```

#### POST /documents/{documentId}/analyze
Analyzes a document for text extraction.

**Request Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doc-456",
    "isAnalyzed": true,
    "extractedData": {
      "invoiceNumber": "INV-1234",
      "date": "2023-02-15",
      "amount": "7500",
      "vendor": "Plumbing Service Co"
    }
  },
  "error": null
}
```

#### GET /documents/filter
Filters documents based on various criteria.

**Request Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `documentType` (optional): Comma-separated list of document types
- `policyId` (optional): Filter by policy ID
- `claimId` (optional): Filter by claim ID
- `uploadDateFrom` (optional): Filter uploads after this date
- `uploadDateTo` (optional): Filter uploads before this date
- `isAnalyzed` (optional): Boolean indicating analysis status
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Results per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [...],
    "total": 12
  },
  "error": null
}
```

### Search

#### GET /search
Performs a global search across policies, claims, and documents.

**Request Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `q`: Search query term
- `types` (optional): Comma-separated list of result types (policy, claim, document)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "policy-123",
        "type": "policy",
        "title": "Policy #POL-001",
        "description": "Home Insurance - Insurance Co",
        "date": "2023-01-01T00:00:00Z",
        "link": "/policies/policy-123"
      },
      {
        "id": "claim-123",
        "type": "claim",
        "title": "Claim #CLM-001",
        "description": "Water damage in kitchen - SUBMITTED",
        "date": "2023-02-16T00:00:00Z",
        "link": "/claims/claim-123"
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  },
  "error": null
}
```

### Notifications

#### GET /notifications
Lists notifications for the authenticated user.

**Request Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif-123",
        "type": "CLAIM_STATUS_CHANGE",
        "title": "Claim Status Updated",
        "message": "Your claim #CLM-001 status has been updated to APPROVED",
        "link": "/claims/claim-123",
        "isRead": false,
        "createdAt": "2023-02-20T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    },
    "unreadCount": 3
  },
  "error": null
}
```

#### PUT /notifications/{notificationId}/read
Marks a notification as read.

**Request Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "notif-123",
    "isRead": true
  },
  "error": null
}
```

#### PUT /notifications/read-all
Marks all notifications as read.

**Request Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "markedRead": 3
  },
  "error": null
}
```

#### GET /notifications/preferences
Gets notification preferences for the user.

**Request Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "claimStatus": "BOTH",
      "policyExpiry": "BOTH",
      "documentUpload": "IN_APP",
      "paymentReminder": "BOTH",
      "systemAlert": "IN_APP",
      "securityAlert": "BOTH"
    }
  },
  "error": null
}
```

#### PUT /notifications/preferences
Updates notification preferences.

**Request Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "claimStatus": "EMAIL",
  "documentUpload": "NONE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "claimStatus": "EMAIL",
      "policyExpiry": "BOTH",
      "documentUpload": "NONE",
      "paymentReminder": "BOTH",
      "systemAlert": "IN_APP",
      "securityAlert": "BOTH"
    }
  },
  "error": null
}
```

## Error Codes

The API uses standard HTTP status codes and provides descriptive error messages:

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - The request was malformed or contains invalid parameters |
| 401 | Unauthorized - Authentication is required or failed |
| 403 | Forbidden - The authenticated user does not have permission |
| 404 | Not Found - The requested resource was not found |
| 409 | Conflict - The request conflicts with the current state |
| 422 | Unprocessable Entity - Validation errors |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server encountered an unexpected error |

Error responses will include a descriptive message:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      }
    ]
  }
}
```

## Pagination

Most list endpoints support pagination with the following parameters:

- `page`: Page number (starts at 1)
- `limit` or `pageSize`: Number of items per page

Responses include pagination metadata:

```json
"pagination": {
  "total": 50,       // Total number of items
  "page": 2,         // Current page
  "limit": 10,       // Items per page
  "totalPages": 5    // Total number of pages
}
```

## Versioning

The API is versioned to ensure backward compatibility. The current version is v1.

Future versions may be accessed by including the version in the URL path:
```
https://api.flinsuranceclaims.com/api/v2/...
```

## Rate Limiting

The API implements rate limiting to prevent abuse. Rate limit information is included in response headers:

```
X-Rate-Limit-Limit: 100
X-Rate-Limit-Remaining: 99
X-Rate-Limit-Reset: 1611278400
``` 