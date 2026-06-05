# NextStock — Backend API Documentation

> Inventory & Vendor Management System  
> Node.js · Express · Prisma · PostgreSQL (Neon) · JWT Auth

---

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Error Response Format](#error-response-format)
- [Modules](#modules)
  - [1. Auth](#1-auth)
  - [2. Users](#2-users)
  - [3. Categories](#3-categories)
  - [4. Products](#4-products)
  - [5. Stock](#5-stock)
  - [6. Vendors](#6-vendors)
  - [7. Purchases](#7-purchases)
  - [8. Sales](#8-sales)
  - [9. Reports](#9-reports)

---

## Base URL

```
http://localhost:5000/api
```

---

## Authentication

All routes except `/auth/register`, `/auth/login`, and `/auth/refresh` require a Bearer token in the Authorization header.

```
Authorization: Bearer <accessToken>
```

- **Access Token** — short-lived (15 min), returned in login response body
- **Refresh Token** — long-lived (7 days), stored in HttpOnly cookie, used to get a new access token

---

## Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ],
  "stack": "..." 
}
```

> `stack` is only included in development mode (`NODE_ENV=development`)

**Common status codes:**

| Code | Meaning |
|------|---------|
| 400 | Bad request / validation error |
| 401 | Missing or invalid access token |
| 403 | Forbidden — insufficient role |
| 404 | Resource not found |
| 409 | Conflict — duplicate value |
| 500 | Internal server error |

---

## Modules

---

## 1. Auth

### POST `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "Pradipta Karmakar",
  "email": "pradipta@example.com",
  "password": "secret123",
  "role": "ADMIN"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | Yes | Min 2 characters |
| email | string | Yes | Valid email |
| password | string | Yes | Min 6 characters |
| role | string | No | `ADMIN` or `STAFF`, defaults to `STAFF` |

**Response `201`:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "Pradipta Karmakar",
    "email": "pradipta@example.com",
    "role": "ADMIN"
  }
}
```

---

### POST `/auth/login`

Login and receive tokens.

**Request Body:**
```json
{
  "email": "pradipta@example.com",
  "password": "secret123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "Pradipta Karmakar",
    "email": "pradipta@example.com",
    "role": "ADMIN"
  }
}
```

> Refresh token is set as an `HttpOnly` cookie named `refreshToken`. No need to handle it manually.

---

### POST `/auth/refresh`

Get a new access token using the refresh token cookie.

**Request Body:** None (refresh token is read from cookie automatically)

**Response `200`:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### POST `/auth/logout`

Logout and invalidate refresh token.

**Request Body:** None

**Response `200`:**
```json
{
  "success": true,
  "message": "Logged out"
}
```

---

## 2. Users

> All routes require `ADMIN` role.

### GET `/users`

Get all users (excludes the requesting admin).

**Headers:** `Authorization: Bearer <token>`

**Response `200`:**
```json
{
  "success": true,
  "users": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "STAFF",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### POST `/users`

Create a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "STAFF"
}
```

**Response `201`:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "STAFF",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### PUT `/users/:id`

Update user details.

**Request Body (all optional):**
```json
{
  "name": "John Updated",
  "email": "johnupdated@example.com",
  "role": "ADMIN"
}
```

**Response `200`:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "John Updated",
    "email": "johnupdated@example.com",
    "role": "ADMIN",
    "isActive": true
  }
}
```

---

### PATCH `/users/:id/toggle-status`

Activate or deactivate a user account.

**Request Body:** None

**Response `200`:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "isActive": false
  }
}
```

---

### PATCH `/users/:id/reset-password`

Reset a user's password.

**Request Body:**
```json
{
  "newPassword": "newSecret123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## 3. Categories

### GET `/categories`

Get all active categories with product count.

**Auth:** Required (ADMIN or STAFF)

**Response `200`:**
```json
{
  "success": true,
  "categories": [
    {
      "id": "uuid",
      "name": "Electronics",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "_count": {
        "products": 12
      }
    }
  ]
}
```

---

### POST `/categories`

Create a new category.

**Auth:** ADMIN only

**Request Body:**
```json
{
  "name": "Electronics"
}
```

**Response `201`:**
```json
{
  "success": true,
  "category": {
    "id": "uuid",
    "name": "Electronics",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### PUT `/categories/:id`

Update a category.

**Auth:** ADMIN only

**Request Body (all optional):**
```json
{
  "name": "Electronics & Gadgets",
  "isActive": false
}
```

**Response `200`:**
```json
{
  "success": true,
  "category": {
    "id": "uuid",
    "name": "Electronics & Gadgets",
    "isActive": false
  }
}
```

---

### DELETE `/categories/:id`

Soft delete a category. Fails if any active products are linked.

**Auth:** ADMIN only

**Response `200`:**
```json
{
  "success": true,
  "message": "Category deleted"
}
```

**Error if products linked `400`:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Cannot delete category with linked products"
}
```

---

## 4. Products

### GET `/products`

Get paginated products with live stock levels.

**Auth:** Required

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10) |
| search | string | Search by name or SKU |
| categoryId | string | Filter by category UUID |
| isActive | boolean | Filter by status (`true` or `false`) |
| lowStock | boolean | Show only low stock products (`true`) |

**Response `200`:**
```json
{
  "success": true,
  "products": [
    {
      "id": "uuid",
      "name": "USB-C Cable",
      "sku": "PRD-00001",
      "imageUrl": "https://res.cloudinary.com/...",
      "unit": "pcs",
      "minStockThreshold": 10,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "category": {
        "id": "uuid",
        "name": "Electronics"
      },
      "currentStock": 45,
      "isLowStock": false
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

---

### GET `/products/:id`

Get a single product with live stock.

**Auth:** Required

**Response `200`:**
```json
{
  "success": true,
  "product": {
    "id": "uuid",
    "name": "USB-C Cable",
    "sku": "PRD-00001",
    "description": "1 metre USB-C charging cable",
    "imageUrl": "https://res.cloudinary.com/...",
    "unit": "pcs",
    "minStockThreshold": 10,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T08:00:00.000Z",
    "category": {
      "id": "uuid",
      "name": "Electronics"
    },
    "currentStock": 45,
    "isLowStock": false
  }
}
```

---

### POST `/products`

Create a new product. SKU is auto-generated if not provided.

**Auth:** ADMIN only

**Request Body:**
```json
{
  "name": "USB-C Cable",
  "categoryId": "uuid",
  "unit": "pcs",
  "minStockThreshold": 10,
  "description": "1 metre USB-C charging cable",
  "imageUrl": "https://res.cloudinary.com/...",
  "isActive": true,
  "sku": "CUSTOM-001"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | Yes | Min 2 characters |
| categoryId | string | Yes | Valid UUID |
| unit | string | Yes | e.g. pcs, kg, litre |
| minStockThreshold | number | No | Default 0 |
| description | string | No | |
| imageUrl | string | No | Valid URL |
| isActive | boolean | No | Default true |
| sku | string | No | Auto-generated as `PRD-00001` if omitted |

**Response `201`:**
```json
{
  "success": true,
  "product": {
    "id": "uuid",
    "name": "USB-C Cable",
    "sku": "PRD-00001",
    "unit": "pcs",
    "isActive": true,
    "category": {
      "id": "uuid",
      "name": "Electronics"
    }
  }
}
```

---

### PUT `/products/:id`

Update a product.

**Auth:** ADMIN only

**Request Body (all optional):**
```json
{
  "name": "USB-C Cable Pro",
  "categoryId": "uuid",
  "unit": "pcs",
  "minStockThreshold": 20,
  "description": "Updated description",
  "imageUrl": "https://res.cloudinary.com/...",
  "isActive": false
}
```

**Response `200`:**
```json
{
  "success": true,
  "product": {
    "id": "uuid",
    "name": "USB-C Cable Pro",
    "sku": "PRD-00001",
    "unit": "pcs",
    "isActive": false,
    "category": {
      "id": "uuid",
      "name": "Electronics"
    }
  }
}
```

---

### DELETE `/products/:id`

Soft delete a product.

**Auth:** ADMIN only

**Response `200`:**
```json
{
  "success": true,
  "message": "Product deleted"
}
```

---

## 5. Stock

### POST `/stock`

Add a stock movement (IN / OUT / ADJUSTMENT).

**Auth:** ADMIN only

**Request Body:**
```json
{
  "productId": "uuid",
  "type": "IN",
  "quantity": 50,
  "note": "Initial stock entry"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| productId | string | Yes | Valid product UUID |
| type | string | Yes | `IN`, `OUT`, or `ADJUSTMENT` |
| quantity | number | Yes | Integer, cannot be 0. Can be negative for ADJUSTMENT |
| note | string | No | Reason for movement |

> `OUT` will fail if quantity exceeds current stock.

**Response `201`:**
```json
{
  "success": true,
  "movement": {
    "id": "uuid",
    "type": "IN",
    "quantity": 50,
    "note": "Initial stock entry",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "product": {
      "id": "uuid",
      "name": "USB-C Cable",
      "sku": "PRD-00001"
    }
  }
}
```

---

### GET `/stock/:productId`

Get paginated stock movement history for a product.

**Auth:** Required

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| page | number | Default 1 |
| limit | number | Default 10 |
| type | string | Filter by `IN`, `OUT`, or `ADJUSTMENT` |

**Response `200`:**
```json
{
  "success": true,
  "movements": [
    {
      "id": "uuid",
      "type": "IN",
      "quantity": 50,
      "note": "Purchase Order PO-00001 confirmed",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "uuid",
      "type": "OUT",
      "quantity": 5,
      "note": "Sale INV-00001 confirmed",
      "createdAt": "2024-01-16T14:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

### GET `/stock/:productId/current`

Get live current stock level for a product.

**Auth:** Required

**Response `200`:**
```json
{
  "success": true,
  "stock": {
    "id": "uuid",
    "name": "USB-C Cable",
    "sku": "PRD-00001",
    "unit": "pcs",
    "minStockThreshold": 10,
    "currentStock": 45,
    "isLowStock": false
  }
}
```

---

## 6. Vendors

### GET `/vendors`

Get paginated vendors.

**Auth:** Required

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| page | number | Default 1 |
| limit | number | Default 10 |
| search | string | Search by name, email, contact person |
| isActive | boolean | Filter by status |

**Response `200`:**
```json
{
  "success": true,
  "vendors": [
    {
      "id": "uuid",
      "name": "TechSupply Co.",
      "contactPerson": "Rahul Sharma",
      "email": "rahul@techsupply.com",
      "phone": "9876543210",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "_count": {
        "purchaseOrders": 8,
        "vendorProducts": 5
      }
    }
  ],
  "pagination": {
    "total": 20,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

---

### GET `/vendors/:id`

Get full vendor profile with performance metrics and recent orders.

**Auth:** Required

**Response `200`:**
```json
{
  "success": true,
  "vendor": {
    "id": "uuid",
    "name": "TechSupply Co.",
    "contactPerson": "Rahul Sharma",
    "email": "rahul@techsupply.com",
    "phone": "9876543210",
    "address": "123 MG Road, Bangalore",
    "gstNumber": "29ABCDE1234F1Z5",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "vendorProducts": [
      {
        "product": {
          "id": "uuid",
          "name": "USB-C Cable",
          "sku": "PRD-00001",
          "unit": "pcs",
          "isActive": true
        }
      }
    ],
    "performance": {
      "orderCount": 8,
      "totalOrdered": 125000.00,
      "totalPaid": 100000.00,
      "outstandingBalance": 25000.00,
      "onTimeDeliveryRate": 87
    },
    "recentOrders": [
      {
        "id": "uuid",
        "orderNumber": "PO-00008",
        "status": "CONFIRMED",
        "totalAmount": 15000.00,
        "paidAmount": 15000.00,
        "expectedDelivery": "2024-02-01T00:00:00.000Z",
        "deliveredAt": "2024-01-30T00:00:00.000Z",
        "createdAt": "2024-01-20T10:00:00.000Z"
      }
    ]
  }
}
```

---

### POST `/vendors`

Create a new vendor.

**Auth:** ADMIN only

**Request Body:**
```json
{
  "name": "TechSupply Co.",
  "contactPerson": "Rahul Sharma",
  "email": "rahul@techsupply.com",
  "phone": "9876543210",
  "address": "123 MG Road, Bangalore",
  "gstNumber": "29ABCDE1234F1Z5"
}
```

| Field | Type | Required |
|-------|------|----------|
| name | string | Yes |
| contactPerson | string | No |
| email | string | No |
| phone | string | No |
| address | string | No |
| gstNumber | string | No |

**Response `201`:**
```json
{
  "success": true,
  "vendor": {
    "id": "uuid",
    "name": "TechSupply Co.",
    "contactPerson": "Rahul Sharma",
    "email": "rahul@techsupply.com",
    "phone": "9876543210",
    "gstNumber": "29ABCDE1234F1Z5",
    "address": "123 MG Road, Bangalore",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### PUT `/vendors/:id`

Update vendor details.

**Auth:** ADMIN only

**Request Body (all optional):**
```json
{
  "name": "TechSupply Co. Ltd.",
  "contactPerson": "Rahul Sharma",
  "email": "new@techsupply.com",
  "phone": "9876543210",
  "address": "456 Brigade Road, Bangalore",
  "gstNumber": "29ABCDE1234F1Z5",
  "isActive": true
}
```

**Response `200`:**
```json
{
  "success": true,
  "vendor": {
    "id": "uuid",
    "name": "TechSupply Co. Ltd.",
    "contactPerson": "Rahul Sharma",
    "email": "new@techsupply.com",
    "phone": "9876543210",
    "isActive": true
  }
}
```

---

### DELETE `/vendors/:id`

Soft delete a vendor.

**Auth:** ADMIN only

**Response `200`:**
```json
{
  "success": true,
  "message": "Vendor deleted"
}
```

---

### POST `/vendors/:id/products`

Map one or more products to a vendor.

**Auth:** ADMIN only

**Request Body:**
```json
{
  "productIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response `200`:**
```json
{
  "success": true,
  "products": [
    {
      "product": {
        "id": "uuid1",
        "name": "USB-C Cable",
        "sku": "PRD-00001"
      }
    },
    {
      "product": {
        "id": "uuid2",
        "name": "HDMI Cable",
        "sku": "PRD-00002"
      }
    }
  ]
}
```

---

### DELETE `/vendors/:id/products/:productId`

Remove a product mapping from a vendor.

**Auth:** ADMIN only

**Response `200`:**
```json
{
  "success": true,
  "message": "Product removed from vendor"
}
```

---

## 7. Purchases

### GET `/purchases`

Get paginated purchase orders.

**Auth:** Required

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| page | number | Default 1 |
| limit | number | Default 10 |
| search | string | Search by order number or vendor name |
| vendorId | string | Filter by vendor UUID |
| status | string | `DRAFT`, `CONFIRMED`, `DELIVERED`, `CANCELLED` |
| paymentStatus | string | `PENDING`, `PARTIAL`, `PAID` |
| from | string | Date range start (ISO date string) |
| to | string | Date range end (ISO date string) |

**Response `200`:**
```json
{
  "success": true,
  "purchases": [
    {
      "id": "uuid",
      "orderNumber": "PO-00001",
      "status": "CONFIRMED",
      "paymentStatus": "PARTIAL",
      "totalAmount": 15000.00,
      "paidAmount": 10000.00,
      "purchaseDate": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "vendor": {
        "id": "uuid",
        "name": "TechSupply Co."
      },
      "_count": {
        "items": 3
      }
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### GET `/purchases/:id`

Get full purchase order with items.

**Auth:** Required

**Response `200`:**
```json
{
  "success": true,
  "purchase": {
    "id": "uuid",
    "orderNumber": "PO-00001",
    "status": "CONFIRMED",
    "paymentStatus": "PARTIAL",
    "totalAmount": 15000.00,
    "paidAmount": 10000.00,
    "invoiceUrl": "https://res.cloudinary.com/...",
    "notes": "Urgent order",
    "purchaseDate": "2024-01-15T10:30:00.000Z",
    "expectedDelivery": "2024-01-20T00:00:00.000Z",
    "deliveredAt": "2024-01-19T00:00:00.000Z",
    "vendor": {
      "id": "uuid",
      "name": "TechSupply Co.",
      "email": "rahul@techsupply.com",
      "phone": "9876543210"
    },
    "items": [
      {
        "id": "uuid",
        "quantity": 100,
        "unitPrice": 150.00,
        "totalPrice": 15000.00,
        "product": {
          "id": "uuid",
          "name": "USB-C Cable",
          "sku": "PRD-00001",
          "unit": "pcs"
        }
      }
    ]
  }
}
```

---

### POST `/purchases`

Create a new purchase order (starts in DRAFT status).

**Auth:** ADMIN only

**Request Body:**
```json
{
  "vendorId": "uuid",
  "expectedDelivery": "2024-01-25",
  "purchaseDate": "2024-01-15",
  "invoiceUrl": "https://res.cloudinary.com/...",
  "notes": "Urgent order",
  "items": [
    {
      "productId": "uuid",
      "quantity": 100,
      "unitPrice": 150.00
    },
    {
      "productId": "uuid2",
      "quantity": 50,
      "unitPrice": 200.00
    }
  ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| vendorId | string | Yes | Valid vendor UUID |
| items | array | Yes | Min 1 item |
| items[].productId | string | Yes | Valid product UUID |
| items[].quantity | number | Yes | Min 1 |
| items[].unitPrice | number | Yes | Min 0 |
| expectedDelivery | string | No | ISO date |
| purchaseDate | string | No | ISO date, defaults to now |
| invoiceUrl | string | No | Cloudinary URL |
| notes | string | No | |

**Response `201`:**
```json
{
  "success": true,
  "purchase": {
    "id": "uuid",
    "orderNumber": "PO-00001",
    "status": "DRAFT",
    "paymentStatus": "PENDING",
    "totalAmount": 25000.00,
    "paidAmount": 0,
    "vendor": {
      "id": "uuid",
      "name": "TechSupply Co."
    },
    "items": [
      {
        "id": "uuid",
        "quantity": 100,
        "unitPrice": 150.00,
        "totalPrice": 15000.00,
        "product": {
          "id": "uuid",
          "name": "USB-C Cable",
          "sku": "PRD-00001",
          "unit": "pcs"
        }
      }
    ]
  }
}
```

---

### PUT `/purchases/:id`

Edit a purchase order. Only allowed when status is `DRAFT`.

**Auth:** ADMIN only

**Request Body (all optional):**
```json
{
  "expectedDelivery": "2024-01-28",
  "invoiceUrl": "https://res.cloudinary.com/...",
  "notes": "Updated notes",
  "items": [
    {
      "productId": "uuid",
      "quantity": 120,
      "unitPrice": 145.00
    }
  ]
}
```

> Providing `items` replaces all existing items.

**Response `200`:** Same structure as `GET /purchases/:id`

---

### PATCH `/purchases/:id/confirm`

Confirm a purchase order. Auto-increments stock for all items.

**Auth:** ADMIN only

**Request Body:** None

**Response `200`:**
```json
{
  "success": true,
  "purchase": {
    "id": "uuid",
    "orderNumber": "PO-00001",
    "status": "CONFIRMED",
    "deliveredAt": "2024-01-15T10:30:00.000Z"
  }
}
```

> Stock movements of type `IN` are automatically created for each item.

---

### PATCH `/purchases/:id/cancel`

Cancel a purchase order. Auto-reverses stock if previously confirmed.

**Auth:** ADMIN only

**Request Body:** None

**Response `200`:**
```json
{
  "success": true,
  "purchase": {
    "id": "uuid",
    "orderNumber": "PO-00001",
    "status": "CANCELLED"
  }
}
```

> If order was `CONFIRMED`, stock movements of type `OUT` are created to reverse the stock.

---

### PATCH `/purchases/:id/payment`

Update the paid amount on a purchase order. Payment status is auto-calculated.

**Auth:** ADMIN only

**Request Body:**
```json
{
  "paidAmount": 12500.00
}
```

**Response `200`:**
```json
{
  "success": true,
  "purchase": {
    "id": "uuid",
    "orderNumber": "PO-00001",
    "totalAmount": 25000.00,
    "paidAmount": 12500.00,
    "paymentStatus": "PARTIAL"
  }
}
```

**Payment status logic:**

| Condition | Status |
|-----------|--------|
| paidAmount = 0 | `PENDING` |
| 0 < paidAmount < totalAmount | `PARTIAL` |
| paidAmount >= totalAmount | `PAID` |

---

## 8. Sales

### GET `/sales`

Get paginated sales.

**Auth:** Required

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| page | number | Default 1 |
| limit | number | Default 10 |
| search | string | Search by invoice number, customer name, phone |
| status | string | `DRAFT`, `CONFIRMED`, `CANCELLED` |
| paymentStatus | string | `PENDING`, `PARTIAL`, `PAID` |
| from | string | Date range start |
| to | string | Date range end |

**Response `200`:**
```json
{
  "success": true,
  "sales": [
    {
      "id": "uuid",
      "invoiceNumber": "INV-00001",
      "status": "CONFIRMED",
      "paymentStatus": "PAID",
      "customerName": "Arjun Mehta",
      "customerPhone": "9123456789",
      "totalAmount": 3000.00,
      "paidAmount": 3000.00,
      "saleDate": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "_count": {
        "items": 2
      }
    }
  ],
  "pagination": {
    "total": 80,
    "page": 1,
    "limit": 10,
    "totalPages": 8
  }
}
```

---

### GET `/sales/:id`

Get full sale with items.

**Auth:** Required

**Response `200`:**
```json
{
  "success": true,
  "sale": {
    "id": "uuid",
    "invoiceNumber": "INV-00001",
    "status": "CONFIRMED",
    "paymentStatus": "PAID",
    "customerName": "Arjun Mehta",
    "customerPhone": "9123456789",
    "customerEmail": "arjun@example.com",
    "totalAmount": 3000.00,
    "paidAmount": 3000.00,
    "notes": null,
    "saleDate": "2024-01-15T10:30:00.000Z",
    "items": [
      {
        "id": "uuid",
        "quantity": 10,
        "unitPrice": 200.00,
        "totalPrice": 2000.00,
        "product": {
          "id": "uuid",
          "name": "USB-C Cable",
          "sku": "PRD-00001",
          "unit": "pcs"
        }
      },
      {
        "id": "uuid",
        "quantity": 2,
        "unitPrice": 500.00,
        "totalPrice": 1000.00,
        "product": {
          "id": "uuid",
          "name": "HDMI Cable",
          "sku": "PRD-00002",
          "unit": "pcs"
        }
      }
    ]
  }
}
```

---

### POST `/sales`

Create a new sale (starts in DRAFT status).

**Auth:** ADMIN only

**Request Body:**
```json
{
  "customerName": "Arjun Mehta",
  "customerPhone": "9123456789",
  "customerEmail": "arjun@example.com",
  "notes": "Bulk order",
  "saleDate": "2024-01-15",
  "items": [
    {
      "productId": "uuid",
      "quantity": 10,
      "unitPrice": 200.00
    }
  ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| items | array | Yes | Min 1 item |
| items[].productId | string | Yes | Valid product UUID |
| items[].quantity | number | Yes | Min 1 |
| items[].unitPrice | number | Yes | Min 0 |
| customerName | string | No | |
| customerPhone | string | No | |
| customerEmail | string | No | |
| saleDate | string | No | Defaults to now |
| notes | string | No | |

**Response `201`:** Same structure as `GET /sales/:id` with `status: "DRAFT"`

---

### PUT `/sales/:id`

Edit a sale. Only allowed when status is `DRAFT`.

**Auth:** ADMIN only

**Request Body (all optional):** Same fields as POST. Providing `items` replaces all existing items.

**Response `200`:** Same structure as `GET /sales/:id`

---

### PATCH `/sales/:id/confirm`

Confirm a sale. Checks stock availability and auto-deducts stock for all items.

**Auth:** ADMIN only

**Request Body:** None

**Response `200`:**
```json
{
  "success": true,
  "sale": {
    "id": "uuid",
    "invoiceNumber": "INV-00001",
    "status": "CONFIRMED"
  }
}
```

**Error if insufficient stock `400`:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Insufficient stock for USB-C Cable. Available: 5"
}
```

> Stock movements of type `OUT` are automatically created for each item.

---

### PATCH `/sales/:id/cancel`

Cancel a sale. Auto-reverses stock if previously confirmed.

**Auth:** ADMIN only

**Request Body:** None

**Response `200`:**
```json
{
  "success": true,
  "sale": {
    "id": "uuid",
    "invoiceNumber": "INV-00001",
    "status": "CANCELLED"
  }
}
```

---

### PATCH `/sales/:id/payment`

Update paid amount on a sale.

**Auth:** ADMIN only

**Request Body:**
```json
{
  "paidAmount": 3000.00
}
```

**Response `200`:**
```json
{
  "success": true,
  "sale": {
    "id": "uuid",
    "invoiceNumber": "INV-00001",
    "totalAmount": 3000.00,
    "paidAmount": 3000.00,
    "paymentStatus": "PAID"
  }
}
```

---

## 9. Reports

> All report endpoints support `?export=csv` and `?export=pdf` query params to download the report as a file.
> When exporting, the response is a binary file stream, not JSON.

---

### GET `/reports/dashboard`

Get dashboard summary statistics.

**Auth:** Required

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalProducts": 45,
    "totalVendors": 12,
    "totalCategories": 8,
    "lowStockCount": 3,
    "todaySales": {
      "count": 5,
      "total": 12500.00
    },
    "todayPurchases": {
      "count": 2,
      "total": 45000.00
    },
    "outstandingReceivables": 8000.00,
    "outstandingPayables": 25000.00
  }
}
```

---

### GET `/reports/low-stock`

All products currently below minimum stock threshold.

**Auth:** Required

**Query Params:** `?export=csv` or `?export=pdf`

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "USB-C Cable",
      "sku": "PRD-00001",
      "unit": "pcs",
      "minStockThreshold": 10,
      "currentStock": 3,
      "category": { "name": "Electronics" }
    }
  ]
}
```

---

### GET `/reports/stock-summary`

Current stock levels across all products.

**Auth:** Required

**Query Params:** `?export=csv` or `?export=pdf`

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "USB-C Cable",
      "sku": "PRD-00001",
      "category": "Electronics",
      "unit": "pcs",
      "currentStock": 45,
      "minStockThreshold": 10,
      "isLowStock": false,
      "isActive": true
    }
  ]
}
```

---

### GET `/reports/stock-daily`

All stock movements for a specific day.

**Auth:** Required

**Query Params:**

| Param | Type | Description |
|-------|------|-------------|
| date | string | ISO date e.g. `2024-01-15`, defaults to today |
| export | string | `csv` or `pdf` |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "summary": {
      "totalIn": 200,
      "totalOut": 45,
      "totalAdjustments": 1
    },
    "movements": [
      {
        "type": "IN",
        "quantity": 100,
        "note": "Purchase Order PO-00001 confirmed",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "product": { "name": "USB-C Cable", "sku": "PRD-00001", "unit": "pcs" }
      }
    ]
  }
}
```

---

### GET `/reports/stock-monthly`

Aggregated stock movements grouped by product for a month.

**Auth:** Required

**Query Params:**

| Param | Type | Description |
|-------|------|-------------|
| year | number | e.g. `2024`, defaults to current year |
| month | number | e.g. `1` for January, defaults to current month |
| export | string | `csv` or `pdf` |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "year": 2024,
    "month": 1,
    "products": [
      {
        "name": "USB-C Cable",
        "sku": "PRD-00001",
        "unit": "pcs",
        "totalIn": 300,
        "totalOut": 120,
        "totalAdjustment": -5
      }
    ]
  }
}
```

---

### GET `/reports/purchases`

Purchase orders filtered by date range and vendor.

**Auth:** Required

**Query Params:**

| Param | Type | Description |
|-------|------|-------------|
| from | string | Start date |
| to | string | End date |
| vendorId | string | Filter by vendor |
| export | string | `csv` or `pdf` |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "purchases": [
      {
        "orderNumber": "PO-00001",
        "status": "CONFIRMED",
        "paymentStatus": "PAID",
        "totalAmount": 25000.00,
        "paidAmount": 25000.00,
        "purchaseDate": "2024-01-15T10:30:00.000Z",
        "vendor": { "name": "TechSupply Co." },
        "_count": { "items": 3 }
      }
    ],
    "summary": {
      "count": 10,
      "totalAmount": 250000.00,
      "totalPaid": 200000.00,
      "outstanding": 50000.00
    }
  }
}
```

---

### GET `/reports/sales`

Sales filtered by date range and customer.

**Auth:** Required

**Query Params:**

| Param | Type | Description |
|-------|------|-------------|
| from | string | Start date |
| to | string | End date |
| search | string | Customer name or phone |
| export | string | `csv` or `pdf` |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "sales": [
      {
        "invoiceNumber": "INV-00001",
        "status": "CONFIRMED",
        "paymentStatus": "PAID",
        "customerName": "Arjun Mehta",
        "customerPhone": "9123456789",
        "totalAmount": 3000.00,
        "paidAmount": 3000.00,
        "saleDate": "2024-01-15T10:30:00.000Z",
        "_count": { "items": 2 }
      }
    ],
    "summary": {
      "count": 25,
      "totalRevenue": 75000.00,
      "totalCollected": 65000.00,
      "outstanding": 10000.00
    }
  }
}
```

---

### GET `/reports/purchase-vs-sales`

Comparison of purchase vs sales amounts grouped by month.

**Auth:** Required

**Query Params:** `from`, `to`, `export`

**Response `200`:**
```json
{
  "success": true,
  "data": [
    { "period": "2024-01", "purchases": 85000.00, "sales": 62000.00 },
    { "period": "2024-02", "purchases": 45000.00, "sales": 78000.00 },
    { "period": "2024-03", "purchases": 95000.00, "sales": 110000.00 }
  ]
}
```

---

### GET `/reports/vendor-purchases`

Total purchase amounts grouped by vendor.

**Auth:** Required

**Query Params:** `from`, `to`, `export`

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "vendorId": "uuid",
      "vendorName": "TechSupply Co.",
      "orderCount": 8,
      "totalAmount": 125000.00,
      "totalPaid": 100000.00,
      "outstanding": 25000.00
    }
  ]
}
```

---

### GET `/reports/profit`

Estimated profit — total sales revenue minus total purchase cost.

**Auth:** Required

**Query Params:** `from`, `to`, `export`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 250000.00,
    "totalCost": 180000.00,
    "estimatedProfit": 70000.00,
    "profitMargin": 28
  }
}
```

---

### GET `/reports/ledger`

Vendor-wise outstanding payment summary.

**Auth:** Required

**Query Params:** `export`

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "vendorId": "uuid",
      "vendorName": "TechSupply Co.",
      "email": "rahul@techsupply.com",
      "phone": "9876543210",
      "totalOrdered": 125000.00,
      "totalPaid": 100000.00,
      "outstanding": 25000.00,
      "orderCount": 8
    }
  ]
}
```

---

### GET `/reports/top-selling`

Most sold products by quantity in a date range.

**Auth:** Required

**Query Params:**

| Param | Type | Description |
|-------|------|-------------|
| from | string | Start date |
| to | string | End date |
| limit | number | Number of products to return (default 10) |
| export | string | `csv` or `pdf` |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "USB-C Cable",
      "sku": "PRD-00001",
      "unit": "pcs",
      "totalQuantity": 450,
      "totalRevenue": 90000.00
    },
    {
      "id": "uuid",
      "name": "HDMI Cable",
      "sku": "PRD-00002",
      "unit": "pcs",
      "totalQuantity": 280,
      "totalRevenue": 140000.00
    }
  ]
}
```

---

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
```

---

## Project Structure

```
src/
├── config/
│   └── db.js                    # Prisma client
├── middleware/
│   ├── verifyToken.js           # JWT verification
│   ├── requireRole.js           # Role-based access
│   └── errorHandler.js          # Global error handler
├── modules/
│   ├── auth/
│   │   ├── auth.routes.js
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   └── auth.schema.js
│   ├── user/
│   ├── category/
│   ├── product/
│   ├── stock/
│   ├── vendor/
│   ├── purchase/
│   ├── sale/
│   └── reports/
├── utils/
│   ├── ApiError.js
│   ├── validate.js
│   ├── generateOrderNumber.js
│   ├── csvExport.js
│   └── pdfExport.js
└── app.js

prisma/
└── schema.prisma

server.js
.env
```

---

## Scripts

```bash
npm run dev      # Start with nodemon
npm start        # Start production
npx prisma migrate dev --name <name>   # Run migration
npx prisma studio                      # Open Prisma Studio GUI
npx prisma generate                    # Regenerate Prisma client
```
