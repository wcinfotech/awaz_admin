# Awaaz Admin Panel

The admin panel is a comprehensive management system for handling event posts, user requests, notifications, and various administrative tasks in the Awaaz application.

## Table of Contents

- [Overview](#overview)
- [Folder Structure](#folder-structure)
- [Features](#features)
- [Controllers](#controllers)
  - [Admin Event Post](#admin-event-post)
  - [Admin Auth](#admin-auth)
  - [Admin Notification](#admin-notification)
  - [Admin User](#admin-user)
  - [Admin Event Type](#admin-event-type)
  - [Admin Event Reaction](#admin-event-reaction)
  - [Admin Report](#admin-report)
  - [Admin General Post](#admin-general-post)
  - [Admin General Post Draft](#admin-general-post-draft)
  - [Admin Event Post Draft](#admin-event-post-draft)
- [API Routes](#api-routes)
- [Models](#models)
- [Services](#services)
- [Validations](#validations)

## Overview

The admin panel provides administrative endpoints to manage:
- Event posts (create, update, delete, approve/reject)
- User requests and responses
- Notifications
- User management
- Event categories and reactions
- Reports and support tickets
- General posts and drafts
- Timeline updates and attachments

## Folder Structure

```
admin-panel/
├── controllers/           # Business logic handlers
├── models/               # Database schemas
├── routes/               # API endpoint definitions
├── services/             # Reusable business logic
└── validations/          # Request validation schemas
```

## Features (Admin Panel)

### Access & Roles
- ✅ Admin auth (email/password, Google), JWT-based sessions
- ✅ Role guard (ADMIN, OWNER) on every admin route
- ✅ Token verification endpoints for session checks

### Event Post Moderation
- ✅ Create admin event posts (direct or from user requests)
- ✅ Approve/reject user-submitted posts and rescue updates
- ✅ Update event posts (content, media, status) and delete or permanently delete
- ✅ Timelines: add/update timeline entries, files, thumbnails; delete attachments
- ✅ Filtering with pagination by type, status, date, distance, category; nearby/rescue helpers

### Drafts & Publishing
- ✅ Admin event post drafts (create/list/delete)
- ✅ Admin general post drafts (create)

### Categories & Reactions
- ✅ Event categories and sub-categories CRUD with icons
- ✅ Event reactions CRUD with reaction icons

### General Posts
- ✅ Create/update general posts with media (gallery + thumbnail)

### Notifications
- ✅ Geo notification sender for events
- ✅ User/device FCM token update for admins

### Users & Reports
- ✅ Admin profile CRUD, list admins, approve/reject admin users
- ✅ Block/unblock app users; list app users; update admin radius
- ✅ Reports: post/user/comment reports listing; update report status; delete comments

### Media Handling
- ✅ Multer in-memory uploads for attachments/thumbnails
- ✅ S3 upload helpers used in controllers (via shared helper)

### Supporting
- ✅ Health/verification endpoints to validate tokens
- ✅ Standardized responses via apiResponse helper

## Controllers

### Admin Event Post

**File:** `admin-panel/controllers/admin-event-post.controllers.js`

#### Create Admin Event Post
```javascript
POST /admin/v1/event-post

Body: {
  isDirectAdminPost: boolean,
  latitude: number,
  longitude: number,
  title: string,
  description: string,
  eventTime: ISO-string,
  address: string,
  hashTags: array,
  postCategoryId: ObjectId,
  reactionId: ObjectId,
  isSensitiveContent: boolean,
  isShareAnonymously: boolean,
  userRequestedEventId: ObjectId,
  userId: ObjectId
}

Files: {
  gallaryAttachment: file,
  gallaryThumbnail: file
}
```

#### Update Admin Event Post
```javascript
PUT /admin/v1/event-post

Body: {
  eventPostId: ObjectId,
  latitude: number,
  longitude: number,
  title: string,
  description: string,
  address: string,
  eventTime: ISO-string,
  hashTags: array,
  postCategoryId: ObjectId,
  reactionId: ObjectId,
  timeLineAttachments: array
}

Files: {
  gallaryAttachment: file,
  gallaryThumbnail: file
}
```

#### Delete Admin Event Post
```javascript
DELETE /admin/v1/event-post/:eventPostId

Returns: Success/failure message
```

#### Add Timeline to Event Post
```javascript
POST /admin/v1/event-post/timeline

Body: {
  eventPostId: ObjectId,
  userId: ObjectId,
  eventTime: ISO-string,
  description: string,
  isShareAnonymously: boolean,
  isSensitiveContent: boolean,
  address: string,
  countryCode: string,
  mobileNumber: string,
  hashTags: array,
  rescueUpdateId: ObjectId
}

Files: {
  gallaryAttachment: file,
  thumbnailAttachment: file
}
```

#### Upload File to Event Post
```javascript
POST /admin/v1/event-post/upload-file

Body: {
  eventPostId: ObjectId,
  isSensitiveContent: boolean
}

Files: {
  gallaryAttachment: file,
  thumbnailAttachment: file
}
```

#### Get Filtered Event Posts
```javascript
GET /admin/v1/event-post/:postType/:filterType

Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
- search: string
- date: ISO-string or array
- distance: number (km)
- lat: number (latitude)
- lon: number (longitude)
- status: string
- category: JSON array of category IDs

Filter Types: "approved", "rejected", "pending", "all"
Post Types: "incident", "rescue", "general_category"
```

#### Get Rescue Updates
```javascript
GET /admin/v1/event-post/:eventPostId/rescue-updates/:status

Status Options: "pending", "approved", "rejected"
```

#### Update Rescue Update Status
```javascript
PUT /admin/v1/event-post/rescue-update

Body: {
  eventPostId: ObjectId,
  rescueUpdateId: ObjectId,
  rescueUpdateStatus: string
}
```

#### Bulk Create Posts
```javascript
POST /admin/v1/event-post/bulk-create

Files: {
  gallaryAttachment: file,
  gallaryThumbnail: file
}

Creates 5000 test posts with the provided media
```

### Admin Auth

**File:** `admin-panel/controllers/admin-auth.controllers.js`

Handles:
- Admin login/registration
- JWT token generation
- Password management
- Role-based access control

### Admin Notification

**File:** `admin-panel/controllers/admin-notification.controller.js`

Handles:
- Sending notifications to users
- Managing notification preferences
- Tracking notification delivery

### Admin User

**File:** `admin-panel/controllers/admin-user.controllers.js`

Handles:
- User management
- User verification
- User statistics
- Profile management

### Admin Event Type

**File:** `admin-panel/controllers/admin-event-type.controllers.js`

Handles:
- Event category management
- Sub-category management
- Category icons and metadata

### Admin Event Reaction

**File:** `admin-panel/controllers/admin-event-reaction.controllers.js`

Handles:
- Reaction type management
- Reaction icons/emojis
- User reactions tracking

### Admin Report

**File:** `admin-panel/controllers/admin-report.controllers.js`

Handles:
- Report management
- Report status updates
- Report resolution

### Admin General Post

**File:** `admin-panel/controllers/admin-general-post.controllers.js`

Handles:
- Creating general posts
- Updating general post content
- Deleting general posts
- Managing general post categories

### Admin General Post Draft

**File:** `admin-panel/controllers/admin-general-post-draft.controllers.js`

Handles:
- Draft creation and management
- Saving incomplete posts
- Converting drafts to published posts

### Admin Event Post Draft

**File:** `admin-panel/controllers/admin-event-post-draft.controllers.js`

Handles:
- Event post draft management
- Auto-saving functionality
- Draft to post conversion

## Models

Located in `admin-panel/models/`:

- `admin-event-post.model.js` - Event post schema with timelines
- `admin-event-post-draft.model.js` - Draft event post schema
- `admin-event-type.model.js` - Event category schema
- `admin-event-reaction.model.js` - Reaction type schema
- `admin-general-post.model.js` - General post schema
- `admin-general-post-draft.model.js` - Draft general post schema
- `admin-notification.model.js` - Notification schema
- `admin-report.model.js` - Report schema
- `admin-support.model.js` - Support ticket schema
- `admin-user.model.js` - User management schema

## Services

Located in `admin-panel/services/`:

- `notification.services.js` - Notification sending and management
- Email/SMS delivery services
- User verification services

## Validations

Located in `admin-panel/validations/`:

- `admin-auth.validation.js` - Login/registration validation
- `admin-event-post.validation.js` - Event post input validation
- `admin-event-post-draft.validation.js` - Draft validation
- `admin-general-post.validation.js` - General post validation
- `admin-user.validation.js` - User management validation
- `admin-report.validation.js` - Report validation
- `admin-support.validation.js` - Support ticket validation

## API Routes

### Base Path: `/admin/v1`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/login` | Admin login |
| POST | `/auth/register` | Admin registration |
| GET/POST | `/event-post` | Get/Create event posts |
| PUT | `/event-post` | Update event post |
| DELETE | `/event-post/:id` | Delete event post |
| POST | `/event-post/timeline` | Add timeline |
| GET | `/event-post/:postType/:filterType` | Get filtered posts |
| POST | `/event-post/bulk-create` | Bulk create posts |
| GET | `/user` | Get users |
| POST | `/notification/send` | Send notification |
| GET/POST | `/general-post` | Manage general posts |
| GET/POST | `/event-category` | Manage categories |
| POST | `/report/:id/approve` | Approve report |

## Authentication

All admin endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <admin_jwt_token>
```

Admin role verification is enforced by the `verifyRole` middleware.

## Error Handling

All endpoints return standardized responses:

### Success Response
```json
{
  "status": true,
  "message": "Operation successful",
  "statusCode": 200,
  "data": {}
}
```

### Error Response
```json
{
  "status": false,
  "message": "Error description",
  "statusCode": 400,
  "data": null
}
```

## Key Features

### Post Filtering
Posts can be filtered by:
- Status (approved, rejected, pending)
- Post type (incident, rescue, general)
- Date range
- Geographic distance
- Text search (title/description)
- Category

### Timeline Management
- Multiple attachments per post
- Timeline entries for chronological updates
- Address and contact information per timeline
- Support for different file types

### Media Handling
- S3 bucket integration
- Automatic thumbnail generation
- File type validation
- Secure file deletion

### Notifications
- Automatic user notifications
- Approval/rejection notifications
- Event timeline notifications
- Batch notification sending

## Usage Example

```javascript
// Create an event post
const response = await fetch('/admin/v1/event-post', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer admin_token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Fire at City Hospital',
    description: 'Major fire incident',
    latitude: 21.325,
    longitude: 72.234,
    address: 'Ahmedabad',
    postCategoryId: '67ac24077ad841f38bb9d5ae',
    isDirectAdminPost: true
  })
});

// Get filtered posts
const filteredPosts = await fetch(
  '/admin/v1/event-post/incident/approved?page=1&limit=10&search=fire',
  {
    headers: {
      'Authorization': 'Bearer admin_token'
    }
  }
);
```

## Database Collections

- `adminEventPosts` - Published event posts
- `adminEventPostDrafts` - Draft event posts
- `adminEventTypes` - Event categories
- `adminEventReactions` - Reaction types
- `adminGeneralPosts` - General posts
- `adminGeneralPostDrafts` - Draft general posts
- `adminNotifications` - Notification records
- `adminReports` - Report records
- `adminUsers` - Admin user accounts

## Security

- JWT token-based authentication
- Role-based access control (RBAC)
- Request validation with Joi
- Protected file uploads
- SQL injection prevention via Mongoose
- CORS enabled for trusted origins

## Performance Optimization

- Pagination support
- Indexed database queries
- S3 media optimization
- Promise-based concurrent operations
- Lazy loading of relationships

## Support & Contributing

For issues or feature requests, contact the development team.

---

**Last Updated:** January 2026
**Version:** 1.0.0
