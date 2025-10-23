# Frontend Implementation Guide: Deck-to-Model Feature

## 📋 Overview

This document provides complete instructions for frontend developers to implement the Deck-to-Model feature. This feature allows users to upload business presentations (pitch decks) and receive AI-generated Excel financial models.

**Backend Base URL:** `http://localhost:3000` (development) or your production URL

---

## 🎯 Feature Summary

**What it does:**
- User uploads a PDF or PowerPoint presentation
- System extracts financial data using AI
- System generates a 3-statement financial model
- User downloads Excel file with projections

**Key Points:**
- Processing takes 3-5 minutes
- Files available for 7 days after generation
- Cookie-based authentication (no Bearer tokens)
- Supports PDF and PowerPoint files (.pdf, .ppt, .pptx)
- Maximum file size: 50MB
- User can download same file multiple times within 7 days
- Files automatically deleted after 7 days

**What User Gets:**
- Excel file (.xlsx) with 5 worksheets:
  1. Summary - Key metrics overview
  2. Income Statement - P&L projections
  3. Balance Sheet - Assets, liabilities, equity
  4. Cash Flow - Operating, investing, financing activities
  5. Assumptions - Model assumptions and scenarios

---

## 🌐 API Endpoints Summary

**Base URL:** `http://localhost:3000` (or your production URL)

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/auth/login` | POST | User login | No |
| `/api/auth/signup` | POST | User registration | No |
| `/api/auth/me` | GET | Check auth status | Yes |
| `/api/deck-to-model/upload` | POST | Upload deck | Yes |
| `/api/deck-to-model/orders` | GET | List all orders | Yes |
| `/api/deck-to-model/orders/:id` | GET | Get order status | Yes |
| `/api/deck-to-model/orders/:id/download` | GET | Download Excel | Yes |
| `/api/deck-to-model/orders/:id` | DELETE | Cancel order | Yes |
| `/api/deck-to-model/metrics` | GET | Get user metrics | Yes |

**Important:** All requests must include `credentials: 'include'` to send cookies.

---

## 🔐 Authentication Flow

### 1. User Must Be Logged In

**Before accessing any deck-to-model features:**
- User must complete login via `/api/auth/login`
- Cookies are automatically set by the backend
- All subsequent requests automatically include cookies

**Frontend Requirements:**
- Use `credentials: 'include'` in all fetch requests
- Don't manually handle tokens
- Check authentication status before showing upload page
- Redirect to login if user is not authenticated

**How to check if user is logged in:**
- Call `GET /api/auth/me`
- If successful: user is logged in
- If 401 error: redirect to login page

---

## 📄 Pages to Implement

### Page 1: Upload Page

**Route:** `/deck-to-model/upload` or `/upload-deck`

**Purpose:** Allow users to upload their pitch deck

**UI Elements Required:**

1. **File Upload Area**
   - Drag-and-drop zone for PDF/PowerPoint files
   - Click to browse file selector
   - Show file name after selection
   - Display file size
   - Show file type icon (PDF or PowerPoint)
   - Clear/remove file button

2. **File Validation (Client-Side)**
   - Accept only: `.pdf`, `.ppt`, `.pptx`
   - Maximum size: 50MB
   - Show error message if invalid file type
   - Show error message if file too large
   - Disable upload button if no file selected

3. **Optional Form Fields**
   - Company Name (text input, optional)
   - Industry (dropdown or text input, optional)
     - Options: SaaS, FinTech, E-commerce, Healthcare, etc.
   - Stage (dropdown, optional)
     - Options: Pre-seed, Seed, Series A, Series B, Series C, Growth, Other
   - Additional Notes (textarea, optional, max 1000 characters)

4. **Upload Button**
   - Disabled state when no file selected
   - Loading state during upload
   - Show progress indicator during upload

5. **Information Display**
   - Explain what the feature does
   - Show estimated processing time (3-5 minutes)
   - Display file retention policy: "Files available for 7 days"
   - Show supported file formats
   - Display maximum file size

6. **Success State**
   - Show success message after upload
   - Display order ID
   - Show estimated completion time
   - Provide link to "My Orders" page
   - Option to upload another deck

side bar with order history and file download option for user

7. **Error Handling**
   - Show error message if upload fails
   - Display specific error (file too large, invalid format, etc.)
   - Allow user to retry
   - Show contact support option for persistent errors

**API Call:**
```
POST /api/deck-to-model/upload
Content-Type: multipart/form-data
Credentials: include

Form Data:
- pdf: File (required)
- company_name: String (optional)
- industry: String (optional)
- stage: String (optional)
- additional_notes: String (optional)
```

**Success Response:**
```json
{
  "success": true,
  "message": "Deck uploaded successfully...",
  "data": {
    "orderId": "uuid",
    "status": "pending",
    "estimatedTime": "3-5 minutes",
    "checkStatusUrl": "/api/deck-to-model/orders/uuid"
  }
}
```

**After Successful Upload:**
- Save orderId to state/localStorage
- Redirect to Order Detail page or Orders List page
- Show success notification

---

### Page 2: Orders List Page

**Route:** `/deck-to-model/orders` or `/my-models`

**Purpose:** Show all user's orders (past and current)

**UI Elements Required:**

1. **Page Header**
   - Title: "My Financial Models"
   - Button: "Upload New Deck"
   - Show total count of orders

2. **Orders Table/List**
   - Display all orders in reverse chronological order (newest first)
   - Each row/card shows:
     - Company name (or "Untitled" if not provided)
     - Upload date and time
     - Status badge (color-coded)
     - File name
     - Actions (Download button, View details link)

3. **Status Badges**
   - **Pending** (gray/yellow): Just uploaded, waiting to start
   - **Processing** (blue): Currently being processed
     - Show sub-status: "Extracting data", "Generating model", "Creating Excel"
   - **Ready** (green): Completed, ready to download
   - **Failed** (red): Processing failed
   - **Expired** (gray): File deleted after 7 days

4. **For Each Order - Actions**
   - **If status = "Ready":**
     - Download button (primary action)
     - Show days remaining (e.g., "5 days left")
     - View details link
   - **If status = "Processing":**
     - Show progress indicator
     - Show current stage
     - Refresh button
     - View details link
   - **If status = "Failed":**
     - Show error message
     - Retry button (optional)
     - Contact support link
   - **If status = "Expired":**
     - Show "File expired" message
     - Show "Contact support to regenerate" link
     - Disable download button

5. **Pagination**
   - Show 10-20 orders per page
   - Next/Previous buttons
   - Page numbers
   - Total count display

6. **Filters (Optional)**
   - Filter by status (All, Ready, Processing, Failed, Expired)
   - Filter by date range
   - Search by company name

7. **Empty State**
   - Show when user has no orders
   - Display message: "You haven't uploaded any decks yet"
   - Show "Upload Your First Deck" button
   - Explain what the feature does

8. **Auto-Refresh**
   - If any order is "Processing", auto-refresh every 5-10 seconds
   - Stop auto-refresh when all orders are complete
   - Show "Refreshing..." indicator

**API Call:**
```
GET /api/deck-to-model/orders?limit=20&offset=0
Credentials: include
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "company_name": "Acme Inc",
        "status": "delivered",
        "created_at": "2024-01-15T10:30:00Z",
        "delivered_at": "2024-01-15T10:33:07Z",
        "pdf_filename": "pitch-deck.pdf"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 20,
      "offset": 0
    }
  }
}
```

---

### Page 3: Order Detail Page

**Route:** `/deck-to-model/orders/:orderId`

**Purpose:** Show detailed information about a specific order

**UI Elements Required:**

1. **Order Header**
   - Company name (large, prominent)
   - Order ID (small, for reference)
   - Upload date and time
   - Status badge (large, color-coded)

2. **Order Information Card**
   - Company name
   - Industry
   - Stage
   - File name
   - File size
   - Upload date
   - Completion date (if completed)
   - Processing time (if completed)

3. **Status Timeline/Progress**
   - Visual timeline showing:
     - ✅ Uploaded
     - ✅ Extracting data (with timestamp)
     - ✅ Generating model (with timestamp)
     - ✅ Creating Excel (with timestamp)
     - ✅ Ready (with timestamp)
   - Highlight current step if processing
   - Show checkmarks for completed steps

4. **Download Section (If Ready)**
   - Large "Download Excel File" button
   - File size display
   - Expiration warning:
     - "Available for X more days"
     - Progress bar showing days remaining
     - Color-coded: Green (5+ days), Yellow (2-4 days), Red (1 day)
   - Note: "You can download this file multiple times"

5. **Expiration Information**
   - Show expiration date
   - Show countdown: "Expires in X days"
   - If expired: Show "File expired on [date]"
   - Link to contact support for regeneration

6. **Processing Information (If Processing)**
   - Current stage display
   - Progress percentage (if available)
   - Estimated time remaining
   - Auto-refresh every 5 seconds
   - "Refresh Status" button

7. **Error Information (If Failed)**
   - Error message display
   - Reason for failure
   - Troubleshooting tips
   - "Upload Again" button
   - "Contact Support" button

8. **Additional Actions**
   - Back to Orders List button
   - Upload Another Deck button
   - Share link (copy order URL)

9. **Model Preview (Optional, If Ready)**
   - Show extracted data summary
   - Display key metrics found
   - Show model assumptions
   - Preview of what's in the Excel file

**API Call:**
```
GET /api/deck-to-model/orders/:orderId
Credentials: include
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "status": "delivered",
    "companyName": "Acme Inc",
    "industry": "SaaS",
    "stage": "seed",
    "pdfFilename": "pitch-deck.pdf",
    "createdAt": "2024-01-15T10:30:00Z",
    "deliveredAt": "2024-01-15T10:33:07Z",
    "processingTimeSeconds": 187,
    "isProcessing": false,
    "isReady": true,
    "isFailed": false,
    "downloadUrl": "/api/deck-to-model/orders/uuid/download",
    "expiration": {
      "expiresAt": "2024-01-22T10:33:07Z",
      "daysRemaining": 5,
      "isExpired": false,
      "retentionDays": 7,
      "message": "File available for 5 more days"
    },
    "errorMessage": null,
    "jobProgress": null
  }
}
```

---

### Page 4: Download Handler (Not a Page, Just Logic)

**Purpose:** Handle file download when user clicks download button

**Implementation Requirements:**

1. **Download Trigger**
   - User clicks "Download" button
   - Show loading state on button
   - Disable button during download

2. **API Call**
   - Make fetch request to download endpoint
   - Use `credentials: 'include'`
   - Handle response as blob

3. **File Download**
   - Create blob URL from response
   - Create temporary anchor element
   - Set filename: `Financial_Model_CompanyName_Date.xlsx`
   - Trigger download
   - Clean up blob URL

4. **Success Handling**
   - Show success notification
   - Re-enable download button
   - Update UI to show "Downloaded" status (optional)

5. **Error Handling**
   - If 410 (expired): Show expiration message
   - If 404: Show "File not found" message
   - If 400: Show "Not ready yet" message
   - If 401: Redirect to login
   - Show error notification
   - Re-enable download button

**API Call:**
```
GET /api/deck-to-model/orders/:orderId/download
Credentials: include
```

**Response:**
- Binary file (Excel)
- Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- Content-Disposition: attachment; filename="Financial_Model_Acme_Inc_2024-01-15.xlsx"

**Headers to Check:**
- `X-Days-Remaining`: Number of days before expiration
- `X-Expires-At`: ISO date string of expiration

---

## 🔄 Polling Strategy

### When to Poll

**Poll for status updates when:**
- User is on Order Detail page with processing order
- User is on Orders List page with any processing orders
- After uploading a new deck

**How to Poll:**

1. **Initial State**
   - Make first API call immediately
   - Check status

2. **If Processing**
   - Set interval to call API every 5 seconds
   - Update UI with new status
   - Continue until status changes to "delivered" or "failed"

3. **Stop Polling When**
   - Status becomes "delivered"
   - Status becomes "failed"
   - User navigates away from page
   - Maximum time reached (10 minutes)

4. **Polling Best Practices**
   - Clear interval when component unmounts
   - Don't poll if user is not on the page (use visibility API)
   - Show "Checking status..." indicator
   - Provide manual "Refresh" button
   - Handle network errors gracefully

---

## 🎨 UI/UX Guidelines

### Visual Design

1. **Status Colors**
   - Pending: Gray (#6B7280)
   - Processing: Blue (#3B82F6)
   - Ready: Green (#10B981)
   - Failed: Red (#EF4444)
   - Expired: Gray (#9CA3AF)

2. **Progress Indicators**
   - Use spinner for processing
   - Use progress bar for stages
   - Use checkmarks for completed steps
   - Use warning icon for expiring soon

3. **File Upload Area**
   - Dashed border for drag-and-drop zone
   - Change appearance on drag-over
   - Show file icon after selection
   - Display file size in human-readable format (MB)

4. **Buttons**
   - Primary: Download, Upload
   - Secondary: View Details, Refresh
   - Danger: Cancel, Delete
   - Disabled state for unavailable actions

### User Feedback

1. **Loading States**
   - Show spinner during upload
   - Show progress during processing
   - Show skeleton loaders while fetching data

2. **Success Messages**
   - "Deck uploaded successfully!"
   - "Download started"
   - "File downloaded successfully"

3. **Error Messages**
   - Be specific about what went wrong
   - Provide actionable next steps
   - Show contact support option

4. **Warnings**
   - "File expires in 2 days"
   - "File size is large, upload may take longer"
   - "Processing is taking longer than usual"

### Responsive Design

1. **Mobile**
   - Stack form fields vertically
   - Make upload area full-width
   - Use cards instead of table for orders list
   - Simplify order detail layout

2. **Tablet**
   - 2-column layout for forms
   - Table view for orders list
   - Side-by-side info cards

3. **Desktop**
   - Full table view
   - Multi-column layouts
   - Larger upload area

---

## 🔔 Notifications

### When to Show Notifications

1. **Upload Success**
   - "Your deck has been uploaded and is being processed"
   - Duration: 5 seconds
   - Type: Success

2. **Processing Complete**
   - "Your financial model is ready to download!"
   - Duration: Until dismissed
   - Type: Success
   - Action: "Download Now" button

3. **Download Success**
   - "File downloaded successfully"
   - Duration: 3 seconds
   - Type: Success

4. **Errors**
   - "Upload failed: [reason]"
   - Duration: Until dismissed
   - Type: Error
   - Action: "Try Again" button

5. **Expiration Warning**
   - "Your file expires in 1 day"
   - Duration: Until dismissed
   - Type: Warning
   - Action: "Download Now" button

6. **File Expired**
   - "Your file has expired and been deleted"
   - Duration: Until dismissed
   - Type: Info
   - Action: "Contact Support" button

---

## 📱 Navigation

### Menu Structure

Add to main navigation:
- "Deck to Model" or "Financial Models"
- Sub-items:
  - "Upload Deck"
  - "My Models"

### Breadcrumbs

- Home > Deck to Model
- Home > Deck to Model > Upload
- Home > Deck to Model > My Models
- Home > Deck to Model > My Models > [Company Name]

---

## 🔒 Security Considerations

### Client-Side

1. **File Validation**
   - Check file type before upload
   - Check file size before upload
   - Sanitize file names for display

2. **Authentication**
   - Check auth status before showing pages
   - Redirect to login if not authenticated
   - Handle 401 errors globally

3. **Data Display**
   - Sanitize user-provided data (company names, notes)
   - Don't display sensitive information
   - Use HTTPS only

### Error Handling

1. **Network Errors**
   - Show "Connection lost" message
   - Provide retry option
   - Don't lose user's form data

2. **API Errors**
   - Handle all HTTP status codes
   - Show user-friendly error messages
   - Log errors for debugging

3. **Validation Errors**
   - Show inline validation errors
   - Highlight invalid fields
   - Provide clear error messages

---

## 📊 Analytics Events to Track

### User Actions

1. **Upload Flow**
   - `deck_upload_started`
   - `deck_upload_completed`
   - `deck_upload_failed`

2. **Download Flow**
   - `model_download_clicked`
   - `model_download_completed`
   - `model_download_failed`

3. **Navigation**
   - `orders_page_viewed`
   - `order_detail_viewed`
   - `upload_page_viewed`

4. **Errors**
   - `file_expired_viewed`
   - `processing_failed_viewed`
   - `upload_error_occurred`

### Metrics to Track

- Time from upload to download
- Number of downloads per order
- Abandonment rate (uploads not downloaded)
- Error rates by type
- File sizes uploaded
- Processing times

---

## 🧪 Testing Checklist

### Functional Testing

- [ ] Upload PDF file successfully
- [ ] Upload PowerPoint file successfully
- [ ] Reject invalid file types
- [ ] Reject files over 50MB
- [ ] Show processing status correctly
- [ ] Download file successfully
- [ ] Download same file multiple times
- [ ] Show expiration warning correctly
- [ ] Handle expired files correctly
- [ ] Show error messages for failed processing
- [ ] Pagination works on orders list
- [ ] Polling updates status automatically
- [ ] Manual refresh works
- [ ] Authentication required for all pages
- [ ] Redirect to login when not authenticated

### Edge Cases

- [ ] Upload without optional fields
- [ ] Upload with very long company name
- [ ] Upload with special characters in filename
- [ ] Network interruption during upload
- [ ] Network interruption during download
- [ ] Multiple tabs open with same order
- [ ] Browser refresh during processing
- [ ] Back button navigation
- [ ] Direct URL access to order detail
- [ ] Access other user's order (should fail)

### Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Responsive Testing

- [ ] Mobile (320px - 767px)
- [ ] Tablet (768px - 1023px)
- [ ] Desktop (1024px+)
- [ ] Large desktop (1920px+)

---

## 🚀 Performance Optimization

### Best Practices

1. **Lazy Loading**
   - Load orders list on demand
   - Paginate results
   - Don't load all orders at once

2. **Caching**
   - Cache order list for 30 seconds
   - Cache order details for 10 seconds
   - Invalidate cache after upload

3. **Optimistic UI**
   - Show upload success immediately
   - Update UI before API confirms
   - Rollback if API fails

4. **File Upload**
   - Show upload progress
   - Use chunked upload for large files (optional)
   - Compress files before upload (optional)

5. **Polling**
   - Use exponential backoff
   - Stop polling when not visible
   - Limit maximum poll duration

---

## 📝 Copy/Content Guidelines

### Tone

- Professional but friendly
- Clear and concise
- Action-oriented
- Helpful and supportive

### Key Messages

1. **Upload Page**
   - "Transform your pitch deck into a professional financial model"
   - "Upload your deck and get a 3-statement model in minutes"
   - "Supports PDF and PowerPoint files"

2. **Processing**
   - "We're analyzing your deck and building your model"
   - "This usually takes 3-5 minutes"
   - "You can close this page and come back later"

3. **Ready**
   - "Your financial model is ready!"
   - "Download your Excel file now"
   - "Available for 7 days"

4. **Expired**
   - "This file has expired due to storage limitations"
   - "Contact support to regenerate your model"
   - "Files are kept for 7 days after generation"

---

## 🔄 Real-Time Updates (Optional Enhancement)

### WebSocket Connection (For Admin/Power Users)

**Note:** This is OPTIONAL. Most users don't need real-time updates - polling is sufficient.

**If you want to implement WebSocket for real-time progress:**

1. **Connect to WebSocket**
   - URL: `ws://localhost:3000/deck-to-model`
   - Use Socket.IO client library

2. **Join Order Room**
   - Emit: `join_order` with `{ orderId: 'uuid' }`

3. **Listen for Events**
   - `progress` - Processing progress updates
   - `complete` - Processing completed
   - `error` - Processing failed

4. **Disconnect**
   - Emit: `leave_order` when leaving page
   - Close connection when done

**When to Use:**
- Admin dashboard
- Power users who want real-time updates
- When you want to show live progress bar

**When NOT to Use:**
- Regular users (polling is simpler)
- Mobile apps (battery drain)
- When simplicity is preferred

---

## 🆘 Help & Support

### Help Text to Include

1. **What file formats are supported?**
   - PDF and PowerPoint (.ppt, .pptx) files

2. **How long does processing take?**
   - Typically 3-5 minutes, depending on deck complexity

3. **How long are files available?**
   - Files are available for 7 days after generation

4. **Can I download the file multiple times?**
   - Yes, you can download as many times as you need within 7 days

5. **What if my file expires?**
   - Contact support to regenerate your model

6. **What's included in the Excel file?**
   - 5 worksheets: Summary, Income Statement, Balance Sheet, Cash Flow, Assumptions
   - 5-year projections
   - 3 scenarios: Conservative, Base, Optimistic

### Support Contact

- Email: support@yourdomain.com
- Link to help documentation
- Link to FAQ page

---

## 🎯 Success Criteria

### User Can Successfully:

1. Upload a pitch deck
2. See processing status
3. Download Excel file when ready
4. View all past orders
5. Re-download files within 7 days
6. Understand expiration policy
7. Get help when needed

### Performance Targets:

- Upload completes in < 5 seconds
- Page loads in < 2 seconds
- Status updates within 5 seconds
- Download starts immediately
- No errors for valid files

---

## 🚨 Error Codes & Handling

### HTTP Status Codes You'll Encounter

| Code | Meaning | When It Happens | What to Do |
|------|---------|-----------------|------------|
| 200 | Success | Request successful | Process response data |
| 201 | Created | Upload successful | Show success, redirect to orders |
| 400 | Bad Request | Invalid input (wrong file type, missing fields) | Show error message, let user fix |
| 401 | Unauthorized | Not logged in or session expired | Redirect to login page |
| 404 | Not Found | Order doesn't exist or user doesn't own it | Show "Order not found" message |
| 410 | Gone | File expired (deleted after 7 days) | Show expiration message, offer support contact |
| 413 | Payload Too Large | File > 50MB | Show "File too large" error |
| 429 | Too Many Requests | Rate limit exceeded | Show "Please wait" message, retry after delay |
| 500 | Server Error | Backend error | Show generic error, offer retry |

### Error Response Format

All errors follow this format:
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE" // Optional
}
```

### Specific Error Messages

**Upload Errors:**
- "PDF file is required"
- "Only PDF and PowerPoint files are allowed"
- "File size exceeds 50MB limit"
- "Missing authentication token"

**Download Errors:**
- "Order not found"
- "Model not yet ready" (status not 'delivered')
- "File has expired" (410 status)
- "Excel file not available"

**Authentication Errors:**
- "Missing authentication token" (401)
- "Invalid token" (401)
- "Token expired" (401)

### How to Handle Each Error

1. **401 Unauthorized**
   - Clear any local auth state
   - Redirect to login page
   - Show message: "Please log in to continue"

2. **410 File Expired**
   - Show expiration message with date
   - Disable download button
   - Show "Contact Support" button
   - Display retention policy

3. **400 Bad Request**
   - Parse error message from response
   - Show inline error on form field
   - Don't clear form data
   - Let user fix and retry

4. **500 Server Error**
   - Show generic error message
   - Offer "Try Again" button
   - Log error for debugging
   - Show "Contact Support" if persists

5. **Network Error (no response)**
   - Show "Connection lost" message
   - Offer "Retry" button
   - Don't lose user's form data
   - Check internet connection

---

## ⚠️ Common Pitfalls & Solutions

### Issue 1: "Missing authentication token" Error
**Cause:** Not including credentials in fetch request
**Solution:** Always use `credentials: 'include'` in fetch options

### Issue 2: File Upload Fails Silently
**Cause:** Wrong Content-Type header
**Solution:** Don't set Content-Type manually - let browser set it for FormData

### Issue 3: Download Doesn't Start
**Cause:** Trying to use fetch response as JSON
**Solution:** Use `response.blob()` and create download link

### Issue 4: Status Never Updates
**Cause:** Not polling or polling stopped
**Solution:** Implement polling with setInterval, clear on unmount

### Issue 5: "File expired" But It's Only Been 5 Days
**Cause:** Timezone confusion
**Solution:** Use ISO dates from API, don't calculate locally

### Issue 6: Can't Access Other User's Files
**Cause:** This is correct behavior (security)
**Solution:** This is expected - users can only access their own files

### Issue 7: Upload Progress Not Showing
**Cause:** Not using XMLHttpRequest or fetch doesn't support progress
**Solution:** Use XMLHttpRequest for upload progress, or show indeterminate progress

### Issue 8: CORS Errors
**Cause:** Backend CORS not configured for your domain
**Solution:** Contact backend team to add your domain to CORS whitelist

### Issue 9: Cookies Not Being Sent
**Cause:** SameSite cookie policy or HTTPS/HTTP mismatch
**Solution:** Ensure both frontend and backend use same protocol (both HTTP or both HTTPS)

### Issue 10: File Download Has Wrong Name
**Cause:** Not reading Content-Disposition header
**Solution:** Parse filename from Content-Disposition header or use default

---

## 🎨 Design Assets Needed

### Icons Required
- Upload icon (cloud with arrow up)
- PDF file icon
- PowerPoint file icon
- Excel file icon
- Download icon
- Refresh/reload icon
- Success checkmark
- Error/warning icon
- Clock/timer icon
- Trash/delete icon

### Illustrations (Optional)
- Empty state illustration (no orders yet)
- Processing illustration (gears/loading)
- Success illustration (celebration)
- Error illustration (broken file)
- Expired illustration (calendar with X)

### Colors
- Primary: Your brand color
- Success: #10B981 (green)
- Warning: #F59E0B (yellow/orange)
- Error: #EF4444 (red)
- Info: #3B82F6 (blue)
- Gray: #6B7280 (neutral)

---

## 📚 Additional Resources

### API Documentation
- See `DECK_TO_MODEL_API.md` for complete API reference
- See `DECK_TO_MODEL_CURL_COLLECTION.md` for cURL examples

### Backend Documentation
- See `DECK_TO_MODEL_FLOW.md` for system architecture
- See `DECK_TO_MODEL_SIMPLE.md` for feature overview

### Testing
- Use Airbnb pitch deck for testing: https://www.failory.com/pitch-deck/airbnb
- Test with various file sizes and formats
- Test error scenarios

### Sample Test Data
**Test User Credentials:**
- Email: test@example.com
- Password: TestPass123!

**Test Files:**
- Small PDF (< 1MB): Use any simple pitch deck
- Large PDF (10-20MB): Use detailed pitch deck with images
- PowerPoint: Use .pptx file
- Invalid file: Try uploading .docx or .jpg (should fail)

**Test Scenarios:**
1. Happy path: Upload → Wait → Download
2. Multiple uploads: Upload 3 decks in a row
3. Re-download: Download same file twice
4. Expiration: Check file after 7 days (or ask backend to set shorter retention for testing)
5. Error: Upload corrupted PDF
6. Cancel: Upload then immediately cancel
7. Logout/Login: Upload, logout, login, check if order still there

---

## ✅ Implementation Checklist

### Phase 1: Core Functionality
- [ ] Implement authentication check
- [ ] Create upload page with file selector
- [ ] Implement upload API call
- [ ] Create orders list page
- [ ] Implement download functionality
- [ ] Create order detail page

### Phase 2: Status & Polling
- [ ] Implement status polling
- [ ] Show processing progress
- [ ] Handle status updates
- [ ] Auto-refresh orders list

### Phase 3: Expiration & Errors
- [ ] Show expiration warnings
- [ ] Handle expired files
- [ ] Implement error handling
- [ ] Show error messages

### Phase 4: Polish
- [ ] Add loading states
- [ ] Add notifications
- [ ] Implement responsive design
- [ ] Add analytics tracking

### Phase 5: Testing
- [ ] Test all user flows
- [ ] Test error scenarios
- [ ] Test on multiple browsers
- [ ] Test on mobile devices

---

## 🎉 Launch Checklist

Before launching to users:

- [ ] All pages implemented
- [ ] All API calls working
- [ ] Authentication working
- [ ] File upload working
- [ ] File download working
- [ ] Status polling working
- [ ] Error handling working
- [ ] Expiration handling working
- [ ] Mobile responsive
- [ ] Browser tested
- [ ] Analytics implemented
- [ ] Help documentation ready
- [ ] Support contact available
- [ ] Performance optimized
- [ ] Security reviewed

---

**End of Frontend Implementation Guide**

For questions or clarifications, refer to the API documentation or contact the backend team.
