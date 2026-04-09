# Toast Retail Underwriting Platform
## Complete User Documentation

**Version:** 1.0  
**Last Updated:** April 2026  
**Platform Name:** Toast Retail Underwriting (TRU)

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [User Roles and Permissions](#2-user-roles-and-permissions)
3. [Authentication and Access](#3-authentication-and-access)
4. [Dashboard](#4-dashboard)
5. [Submitting a New Request](#5-submitting-a-new-request)
6. [Exposure Calculation](#6-exposure-calculation)
7. [Approval Workflow](#7-approval-workflow)
8. [Case Management](#8-case-management)
9. [User Management (Admin)](#9-user-management-admin)
10. [Data Export](#10-data-export)
11. [Audit Trail](#11-audit-trail)
12. [Technical Specifications](#12-technical-specifications)

---

## 1. Platform Overview

### 1.1 Purpose

The Toast Retail Underwriting Platform (TRU) is an enterprise risk management system designed to streamline the underwriting process for merchant accounts. The platform automates exposure calculations, manages approval workflows, and maintains comprehensive audit trails for all underwriting decisions.

### 1.2 Key Features

- **Automated Exposure Calculation:** Calculates total exposure based on annual processing volume and advance delivery days
- **Risk-Based Approval Routing:** Automatically routes cases to appropriate approval levels based on exposure and risk criteria
- **Auto-Approval:** Low-risk cases meeting specific criteria are automatically approved
- **Case Management:** Complete lifecycle management from submission to approval/decline
- **Audit Trail:** Full tracking of all actions and changes for compliance
- **Document Management:** Upload and manage supporting documents for each case
- **User Management:** Role-based access control with approval limits
- **Export Capabilities:** Export approved cases to CSV for reporting

### 1.3 System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Valid user credentials

---

## 2. User Roles and Permissions

### 2.1 Available Roles

The platform supports three user roles that can be combined:

#### 2.1.1 User Role
- **Permissions:**
  - Submit new underwriting requests
  - View own submitted cases
  - View case details and status
  - Upload documents to cases
  - Respond to revision requests
  - Export approved cases data

#### 2.1.2 Approver Role
- **Permissions (includes all User permissions plus):**
  - View cases pending approval
  - Approve cases within approval limit
  - Decline cases with reason
  - Request revisions on cases
  - Set next review dates
  - Add approval comments

#### 2.1.3 Admin Role
- **Permissions (includes all Approver permissions plus):**
  - Manage all users (create, edit, delete)
  - Approve/reject access requests
  - Set user roles and approval limits
  - View all cases regardless of assignment
  - Configure system settings

### 2.2 Approval Limits

- Approvers can have a maximum approval limit set
- Cases with exposure exceeding the approver's limit require escalation
- Approvers cannot approve cases beyond their limit
- The system displays a warning when exposure exceeds the user's limit

---

## 3. Authentication and Access

### 3.1 Login Process

1. Navigate to the platform URL
2. Enter your email address (format: user@toasttab.com)
3. Enter your password
4. Click "Sign In"
5. Upon successful authentication, you are redirected to the Dashboard

### 3.2 Login Restrictions

- **Pending Users:** Cannot login until an admin approves their access request
- **Inactive Users:** Cannot login; must contact administrator
- **Invalid Credentials:** Error message displayed; user remains on login page

### 3.3 Request Access (New Users)

1. Click "Request Access" on the login page
2. Fill in the required information:
   - **Full Name:** Your complete name
   - **Email:** Your work email address
   - **Password:** Create a secure password (minimum 6 characters)
3. Click "Submit Request"
4. Wait for administrator approval
5. Once approved, login with your credentials

### 3.4 Logout

1. Click on your user profile in the sidebar
2. Select "Sign out"
3. You are redirected to the login page

---

## 4. Dashboard

### 4.1 Dashboard Overview

The dashboard provides a comprehensive view of all underwriting activity and portfolio metrics.

### 4.2 Metrics Cards

The top section displays five key metrics:

| Metric | Description |
|--------|-------------|
| **Total Cases** | Count of all cases in the system |
| **Pending** | Count of cases awaiting review or in draft status |
| **Approved** | Count of approved and auto-approved cases |
| **Exposure** | Total exposure amount across all approved cases |
| **Reserves** | Total reserve amounts across all approved cases |

### 4.3 Cases Table

The cases table provides three views via tabs:

#### 4.3.1 All Tab
- Shows all cases in the system
- Sorted by creation date (newest first)

#### 4.3.2 Pending Tab
- Shows cases with status: draft, pending_review, or revision_requested
- Allows quick access to cases needing attention

#### 4.3.3 Approved Tab
- Shows cases with status: approved or auto_approved
- Represents the active portfolio

### 4.4 Table Columns

| Column | Description |
|--------|-------------|
| **Case ID** | Unique case number (format: TRU-YYYY-XXXXX) |
| **Status** | Current case status with color-coded badge |
| **AE Name** | Account Executive name |
| **Parent Company** | Parent company name |
| **Subsidiary** | Subsidiary name (if applicable) |
| **Total Exposure** | Calculated total exposure amount |
| **Created** | Case creation date |
| **Actions** | View, Edit (if draft/revision), Export PDF |

### 4.5 Quick Actions

- **Submit New Request:** Opens the request submission form
- **Export Approved (CSV):** Downloads all approved cases as CSV file
- **View Case:** Opens case detail page
- **Edit Case:** Opens case for editing (only for draft/revision cases)
- **Export PDF:** Generates printable PDF report for individual case

---

## 5. Submitting a New Request

### 5.1 Accessing the Submit Form

1. Click "Submit New Request" button on the dashboard
2. Or navigate via sidebar menu to "Submit Request"

### 5.2 Form Sections

The request form is divided into two main sections:

#### 5.2.1 Section A - Merchant Information

| Field | Required | Description |
|-------|----------|-------------|
| **AE Name** | Yes | Account Executive handling the merchant |
| **Parent Company Name** | Yes | Legal name of the parent company |
| **Subsidiary Name** | No | Name of subsidiary (if different from parent) |
| **DBA (Doing Business As)** | Yes | Trade name the business operates under |
| **MCC (Merchant Category Code)** | Yes | 4-digit industry classification code |
| **Salesforce Account Number** | Yes | Unique Salesforce account identifier |
| **Salesforce Link** | No | Direct URL to Salesforce account |

#### 5.2.2 Section B - Processing Profile

| Field | Required | Description | Format |
|-------|----------|-------------|--------|
| **Annual Processing Volume** | Yes | Expected yearly transaction volume | Dollar amount |
| **Average Ticket Size** | Yes | Average transaction amount | Dollar amount |
| **CNP Volume %** | Yes | Card-Not-Present transaction percentage | 0-100 |
| **Advance Delivery Days (ADD)** | Yes | Days between payment and delivery | Whole number |
| **Brick and Mortar** | No | Whether merchant has physical location | Yes/No |
| **Business Description** | No | Brief description of the business | Text |

### 5.3 Sidebar Components

#### 5.3.1 Approval Criteria Guide
Displays the three approval criteria levels:
- **Auto Approved (Green):** Exposure ≤ $200K AND ADD ≤ 3 days
- **Abbreviated Review (Blue):** Exposure > $200K - < $500K AND ADD 4-45 days
- **Full Credit Review (Red):** Exposure ≥ $500K AND ADD > 45 days

#### 5.3.2 Exposure Calculator
- Displays real-time exposure calculation
- Shows breakdown of:
  - Daily Volume
  - Base Exposure
  - Chargeback Exposure
  - Refund/Return Exposure
  - **Total Exposure**
- Updates automatically as form fields change

#### 5.3.3 Decision Banner
- Shows which approval path the case will follow
- Displays color-coded indicator based on exposure and ADD

#### 5.3.4 Initial Notes
- Text area for adding notes to the case
- Notes are added to the case chatter when created
- Visible to all users who can access the case

### 5.4 Auto-Save (Draft)

- Form data is automatically saved as you type
- If you leave the page, your progress is preserved
- Drafts can be resumed later
- Clear Draft button removes saved data

### 5.5 Submission

1. Complete all required fields
2. Review the exposure calculation and decision banner
3. Add any initial notes (optional)
4. Click "Submit Request"
5. Case is created and routed based on approval criteria

---

## 6. Exposure Calculation

### 6.1 Calculation Formula

The platform uses the following formulas to calculate exposure:

```
Daily Volume = Annual Processing Volume ÷ 365

Base Exposure = Daily Volume × Advance Delivery Days (ADD)

Chargeback Exposure = Daily Volume × 5%

Refund/Return Exposure = Daily Volume × 1%

TOTAL EXPOSURE = Base Exposure + Chargeback Exposure + Refund/Return Exposure
```

### 6.2 Example Calculation

For a merchant with:
- Annual Processing Volume: $10,000,000
- Advance Delivery Days: 30

```
Daily Volume = $10,000,000 ÷ 365 = $27,397.26

Base Exposure = $27,397.26 × 30 = $821,917.81

Chargeback Exposure = $27,397.26 × 5% = $1,369.86

Refund/Return Exposure = $27,397.26 × 1% = $273.97

TOTAL EXPOSURE = $821,917.81 + $1,369.86 + $273.97 = $823,561.64
```

### 6.3 Exposure Thresholds

| Total Exposure | ADD | Approval Type |
|----------------|-----|---------------|
| ≤ $200,000 | ≤ 3 days | Auto Approved |
| > $200,000 and < $500,000 | 4-45 days | Abbreviated Review |
| ≥ $500,000 | > 45 days | Full Credit Review |
| Other combinations | Any | Manual Review |

---

## 7. Approval Workflow

### 7.1 Workflow Overview

```
[Submit Request] → [Exposure Calculation] → [Approval Routing]
                                                    ↓
        ┌───────────────────────────────────────────┼───────────────────────────────────┐
        ↓                                           ↓                                   ↓
[Auto Approved]                          [Abbreviated Review]                [Full Credit Review]
        ↓                                           ↓                                   ↓
   [Complete]                              [Risk Approval]                     [Risk Approval]
                                                    ↓                                   ↓
                                              [Approved/                          [Approved/
                                               Declined/                           Declined/
                                               Revision]                           Revision]
```

### 7.2 Case Statuses

| Status | Description | Color |
|--------|-------------|-------|
| **Draft** | Case saved but not submitted | Gray outline |
| **Auto Approved** | Automatically approved (low risk) | Green |
| **Pending Risk Approval** | Awaiting risk team approval | Yellow |
| **Pending Review** | Under review by approver | Yellow |
| **Revision Requested** | Changes requested by approver | Red outline |
| **Approved** | Manually approved by approver | Green |
| **Declined** | Rejected by approver | Red |

### 7.3 Auto-Approval

Cases are automatically approved when ALL criteria are met:
- Total Exposure ≤ $200,000
- Advance Delivery Days ≤ 3

Auto-approved cases:
- Skip the manual review process
- Are immediately marked as "Auto Approved"
- Appear in the approved cases list
- Generate an audit entry for compliance

### 7.4 Risk Approval Process

For cases requiring manual review:

1. Case enters "Pending Risk Approval" status
2. Approvers see the case in their approval queue
3. Approver reviews case details and documents
4. Approver can:
   - **Approve:** Case moves to "Approved" status
   - **Decline:** Case moves to "Declined" status with reason
   - **Request Revision:** Case moves to "Revision Requested" status

### 7.5 Approval Actions

#### 7.5.1 Approving a Case

1. Navigate to the case detail page
2. Click "Approve" button
3. Review the case summary
4. Optionally add:
   - Approval comment
   - Next review date
5. Click "Submit Approval"

**Note:** Approvers cannot approve cases exceeding their approval limit.

#### 7.5.2 Declining a Case

1. Navigate to the case detail page
2. Click "Decline" button
3. Enter a required decline reason
4. Click "Decline Case"

The decline reason is:
- Stored in the audit trail
- Visible to the case submitter
- Required for compliance purposes

#### 7.5.3 Requesting Revision

1. Navigate to the case detail page
2. Click "Request Revision" button
3. Enter revision instructions
4. Click "Request Revision"

The case:
- Returns to "Revision Requested" status
- Can be edited by the original submitter
- Maintains all audit history

---

## 8. Case Management

### 8.1 Case Detail Page

The case detail page displays comprehensive information about a case:

#### 8.1.1 Header Section
- Case number
- Status badge
- Approval type badge
- Parent company name
- Quick action buttons (Approve, Decline, Request Revision)

#### 8.1.2 Case Information Sections

**Section A - Merchant Information**
- AE Name
- Parent Company Name
- Subsidiary Name
- DBA
- MCC
- Salesforce Account Number
- Salesforce Link

**Section B - Processing Profile**
- Annual Processing Volume
- Average Ticket Size
- CNP Volume %
- Advance Delivery Days
- Brick and Mortar indicator
- Business Description

**Section C - Exposure Summary**
- Daily Volume
- Base Exposure
- Chargeback Exposure
- Refund/Return Exposure
- Total Exposure (highlighted)

**Section D - Reserves & Guarantees** (if applicable)
- Rolling Reserve Percentage
- Rolling Reserve Days
- Minimum Reserve Percentage
- Minimum Reserve Amount

**Section E - Case Description** (if provided)
- Free-form description text
- Snapshot image (if uploaded)

### 8.2 Activity Panel

Access the activity panel by clicking "Activity" button:

#### 8.2.1 Audit Trail Tab
- Chronological list of all case actions
- Shows user, action, timestamp, and comments
- Includes system-generated events

#### 8.2.2 Documents Tab
- List of uploaded documents
- Shows filename, type, size, upload date
- Download button for each document

### 8.3 Editing Cases

Cases can be edited when in:
- Draft status
- Revision Requested status

To edit a case:
1. Click the "Edit" button on the case detail page
2. Modify the required fields
3. Click "Save Changes"
4. If in revision status, can resubmit for approval

### 8.4 Case Chatter

Each case has a chatter/chat feature:
- Users can send messages
- Messages are visible to all case participants
- Timestamps and sender names are displayed
- Useful for case discussions and clarifications

---

## 9. User Management (Admin)

### 9.1 Accessing User Management

1. Click "User Management" in the sidebar
2. Only visible to users with Admin role

### 9.2 User Management Dashboard

#### 9.2.1 Statistics
- Total Users count
- Approvers count
- Admins count

#### 9.2.2 Users Table

| Column | Description |
|--------|-------------|
| **Name** | User's full name |
| **Email** | User's email address |
| **Roles** | Assigned roles (badges) |
| **Approval Limit** | Maximum exposure they can approve |
| **Status** | Active, Pending, or Inactive |
| **Created** | Account creation date |
| **Actions** | Edit and Delete buttons |

### 9.3 Adding a New User

1. Click "Add User" button
2. Fill in the form:
   - **Name:** Full name (required)
   - **Email:** Email address (required)
   - **Password:** Initial password (required)
   - **Roles:** Select one or more roles (required)
   - **Approval Limit:** For approvers only (optional)
3. Click "Create User"

### 9.4 Editing a User

1. Click the Edit icon on the user row
2. Modify the desired fields
3. Leave password blank to keep current password
4. Click "Save Changes"

### 9.5 Deleting a User

1. Click the Delete icon on the user row
2. Confirm deletion

**Restrictions:**
- Cannot delete your own account
- Cannot delete the primary admin account

### 9.6 Managing Access Requests

When users request access:
1. Their status is set to "Pending"
2. Admins see pending users in the list
3. Admin can:
   - Edit user to set status to "Active"
   - Assign appropriate roles
   - Set approval limits if approver

---

## 10. Data Export

### 10.1 Export Approved Cases (CSV)

1. Navigate to Dashboard
2. Click "Export Approved (CSV)" button
3. CSV file downloads automatically

**Exported Fields:**
- Case Number
- Status
- AE Name
- Parent Company
- Subsidiary
- DBA
- MCC
- SF Account #
- Annual Volume
- Average Ticket
- CNP Volume %
- ADD
- Daily Volume
- Base Exposure
- Chargeback Exposure
- Refund Exposure
- Total Exposure
- Reserve %
- Reserve Amount
- Approval Type
- Created Date
- Approved Date
- Next Review Date

### 10.2 Export Individual Case (PDF)

1. Navigate to the case detail page
2. Click the PDF export icon in the actions
3. Print dialog opens with formatted case report
4. Save as PDF or print directly

**PDF Contents:**
- Complete case header
- All merchant information
- Processing profile details
- Exposure calculation breakdown
- Reserves information (if applicable)
- Timeline (created, approved dates)
- Generated timestamp

---

## 11. Audit Trail

### 11.1 Overview

Every action in the system is tracked in the audit trail for compliance and accountability.

### 11.2 Tracked Actions

| Action | Description |
|--------|-------------|
| **Created** | Case initially created |
| **Submitted** | Case submitted for approval |
| **Approved** | Case approved by approver |
| **Declined** | Case declined with reason |
| **Revision Requested** | Approver requested changes |
| **Updated** | Case information modified |
| **Document Uploaded** | New document attached |

### 11.3 Audit Entry Information

Each audit entry contains:
- **Timestamp:** When the action occurred
- **User:** Who performed the action
- **Action:** Type of action taken
- **Comment:** Additional details or reasons
- **Fields Modified:** Which fields changed (for updates)

### 11.4 Viewing Audit Trail

1. Open the case detail page
2. Click "Activity" button
3. Select "Audit Trail" tab
4. Entries displayed in reverse chronological order

---

## 12. Technical Specifications

### 12.1 Case Number Format

`TRU-YYYY-XXXXX`

- **TRU:** Toast Retail Underwriting prefix
- **YYYY:** Four-digit year
- **XXXXX:** Five-digit sequential number (zero-padded)

Example: TRU-2026-00001

### 12.2 Data Storage

- All data is stored locally in browser localStorage
- Data persists across browser sessions
- No server-side database required
- Data is scoped to the browser/device

### 12.3 Supported File Types for Documents

- PDF documents
- Image files (PNG, JPG, JPEG)
- Excel spreadsheets (XLS, XLSX)
- Word documents (DOC, DOCX)

### 12.4 Session Management

- Sessions persist until user logs out
- No automatic timeout
- Login state maintained across browser sessions

### 12.5 Browser Compatibility

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **ADD** | Advance Delivery Days - time between payment and goods/service delivery |
| **AE** | Account Executive |
| **CNP** | Card Not Present - transactions where card is not physically presented |
| **DBA** | Doing Business As - trade name |
| **MCC** | Merchant Category Code - 4-digit industry classification |
| **TRU** | Toast Retail Underwriting |

---

## Appendix B: Status Flow Diagram

```
                    ┌─────────────┐
                    │   DRAFT     │
                    └──────┬──────┘
                           │ Submit
                           ▼
              ┌────────────────────────┐
              │  Exposure Calculation  │
              └────────────┬───────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │AUTO APPROVED │ │ ABBREVIATED  │ │ FULL CREDIT  │
   │  (Complete)  │ │   REVIEW     │ │   REVIEW     │
   └──────────────┘ └──────┬───────┘ └──────┬───────┘
                           │                │
                           ▼                ▼
                    ┌──────────────────────────┐
                    │   PENDING RISK APPROVAL  │
                    └────────────┬─────────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            │                    │                    │
            ▼                    ▼                    ▼
     ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
     │   APPROVED   │    │   DECLINED   │    │  REVISION    │
     │  (Complete)  │    │  (Complete)  │    │  REQUESTED   │
     └──────────────┘    └──────────────┘    └──────┬───────┘
                                                    │
                                                    │ Resubmit
                                                    ▼
                                            ┌──────────────┐
                                            │   PENDING    │
                                            │    REVIEW    │
                                            └──────────────┘
```

---

## Appendix C: Contact and Support

For technical support or questions:
- Email: support@toasttab.com
- Internal Slack: #underwriting-platform-support

---

**Document End**

*This documentation is confidential and intended for internal use only.*
