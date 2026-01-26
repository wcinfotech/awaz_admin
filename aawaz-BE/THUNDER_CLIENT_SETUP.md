# Thunder Client Setup Guide

## Step 1: Get Your Bearer Token

### Option A: Guest Login (Easiest - No verification needed)

**Request:**
```
Method: POST
URL: http://localhost:8001/api/v1/auth/guest-login
Headers: 
  Content-Type: application/json
Body (raw JSON):
{
  "deviceId": "my-test-device-001"
}
```

**Response will contain:**
```json
{
  "status": true,
  "message": "User logged in successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2Nzc...",
    "user": { ... }
  }
}
```

**Copy the token value** from `data.token`

### Option B: Email Login (If you have an existing user)

**Request:**
```
Method: POST
URL: http://localhost:8001/api/v1/auth/login/email
Headers:
  Content-Type: application/json
Body:
{
  "email": "your@email.com",
  "password": "yourpassword"
}
```

### Option C: Admin Login (For admin endpoints)

**Request:**
```
Method: POST
URL: http://localhost:8001/admin/v1/auth/login/email
Headers:
  Content-Type: application/json
Body:
{
  "email": "admin@example.com",
  "password": "adminpassword"
}
```

---

## Step 2: Use the Token in Thunder Client

### Manual Method:
1. Copy the token from the login response
2. In any protected request, add a header:
   - **Key:** `Authorization`
   - **Value:** `Bearer YOUR_TOKEN_HERE`

Example:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2Nzc...
```

### Environment Method (Recommended):
1. Click **Env** in Thunder Client sidebar
2. Create new environment: `Awaaz-Local`
3. Add variables:
   ```
   baseUrl: http://localhost:8001
   token: (leave empty for now)
   ```
4. In your guest-login request, go to **Tests** tab and add:
   ```javascript
   if (response.body?.data?.token) {
     tc.setVar("token", response.body.data.token);
   }
   ```
5. Run the guest-login request - token will auto-save to environment
6. In other requests, use:
   - URL: `{{baseUrl}}/api/v1/user/profile`
   - Header: `Authorization: Bearer {{token}}`

---

## Step 3: Test a Protected Endpoint

**Request:**
```
Method: GET
URL: http://localhost:8001/api/v1/user/profile
Headers:
  Authorization: Bearer YOUR_TOKEN_FROM_STEP_1
```

**Expected Response (200 OK):**
```json
{
  "status": true,
  "message": "User profile fetched successfully",
  "data": {
    "_id": "...",
    "name": "...",
    "email": "...",
    ...
  }
}
```

---

## Common Thunder Client Requests

### 1. Health Check (No auth)
```
GET http://localhost:8001/
```

### 2. Get User Profile (Auth required)
```
GET http://localhost:8001/api/v1/user/profile
Headers:
  Authorization: Bearer {{token}}
```

### 3. Get Event Posts (Auth required)
```
GET http://localhost:8001/api/v1/event-post/list
Headers:
  Authorization: Bearer {{token}}
```

### 4. Get Admin Event Posts (Admin auth required)
```
GET http://localhost:8001/admin/v1/event-post/filter/incident/approved?page=1&limit=10
Headers:
  Authorization: Bearer {{adminToken}}
```

### 5. Create Event Post (Auth + Multipart)
```
POST http://localhost:8001/api/v1/event-post/add
Headers:
  Authorization: Bearer {{token}}
Body (form-data):
  latitude: 21.325235
  longitude: 72.23423
  title: Test Event
  description: Test Description
  eventTime: 2026-01-08T12:00:00.000Z
  address: Test Address
  postCategoryId: <category_id>
  isSensitiveContent: false
  isShareAnonymously: false
  attachment: (file - image/video)
  thumbnail: (file - image)
```

---

## Troubleshooting

### Error: "Authorization token is required"
- ✅ Make sure header key is exactly: `Authorization` (capital A)
- ✅ Value must start with: `Bearer ` (with space after Bearer)
- ✅ Token should be directly after Bearer with no extra spaces

### Error: "Authorization token is expired or invalid"
- ✅ Get a new token by running guest-login again
- ✅ Check token is complete (not truncated)
- ✅ Ensure no quotes around the token in the header value

### Error: "Please verify your email"
- ✅ Use guest-login instead (automatically verified)
- ✅ Or complete email/mobile OTP verification flow

---

## Quick Copy-Paste Bearer Token Format

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ACTUAL_TOKEN_HERE
```

Replace `YOUR_ACTUAL_TOKEN_HERE` with the token from your login response.
