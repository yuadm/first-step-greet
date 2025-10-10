# User Guide Screenshot Capture Guide

## Overview
This guide explains what screenshots to capture and how to name them for inclusion in the HR Management System User Guide PDF.

## Screenshot Requirements

### General Guidelines
- **Resolution**: Capture at 1920x1080 or higher
- **Format**: PNG or JPG (PNG preferred for clarity)
- **Browser**: Use Chrome or Firefox with clean UI (no extensions visible)
- **Zoom Level**: 100% (default browser zoom)
- **State**: Ensure sample data is visible but not real/sensitive information
- **Quality**: Clear, well-lit screenshots with good contrast

### Naming Convention
Use kebab-case with descriptive names:
- Module name + feature + view type
- Example: `employees-list-view.png`, `employees-add-form.png`

---

## Required Screenshots (20 key screenshots)

### 1. Login & Dashboard (3 screenshots)

#### `login-page.png`
- URL: `/auth`
- Show the admin login page with email/password fields
- Ensure "Login" button is visible

#### `dashboard-overview.png`
- URL: `/` (after login)
- Capture the full dashboard showing:
  - Key metrics at the top
  - Branch breakdown
  - Activity timeline
  - Document health indicators

#### `sidebar-navigation.png`
- Capture the sidebar menu expanded
- Show all navigation items (Dashboard, Employees, Leaves, etc.)
- Ensure Help section with User Guide is visible

---

### 2. Employee Management (4 screenshots)

#### `employees-list-view.png`
- URL: `/employees`
- Show employee list with:
  - Search bar at top
  - Branch filter
  - Table with multiple employee records
  - Action buttons (Add Employee, Import, Export)

#### `employees-add-form.png`
- URL: `/employees` (with Add Employee dialog open)
- Show the employee creation form with:
  - All fields visible (Name, Email, Phone, Branch, etc.)
  - Required field markers (*)
  - Save/Cancel buttons at bottom

#### `employees-detail-view.png`
- URL: `/employees` (with an employee selected/expanded)
- Show employee details including:
  - Personal information
  - Documents section
  - Leave balance
  - Compliance records

#### `employees-bulk-import.png`
- URL: `/employees` (with Import dialog open)
- Show the import interface with:
  - Template download button
  - File upload area
  - Instructions visible

---

### 3. Leave Management (3 screenshots)

#### `leaves-list-view.png`
- URL: `/leaves`
- Show leave requests table with:
  - Status filter (Pending, Approved, Rejected)
  - Branch filter
  - Multiple leave records
  - Status badges (color-coded)

#### `leaves-create-request.png`
- URL: `/leaves` (with Add Leave Request dialog open)
- Show leave creation form with:
  - Employee dropdown
  - Leave type selector
  - Date range picker
  - Reason text field

#### `leaves-approval-dialog.png`
- URL: `/leaves` (with approval dialog open)
- Show approval interface with:
  - Leave details
  - Approve/Reject buttons
  - Comment field

---

### 4. Document Management (3 screenshots)

#### `documents-list-view.png`
- URL: `/documents`
- Show documents table with:
  - Search and filter options
  - Document type filter
  - Expiry status indicators (red for expired, yellow for expiring soon)
  - Action buttons

#### `documents-upload-form.png`
- URL: `/documents` (with Upload Document dialog open)
- Show upload interface with:
  - Employee selector
  - Document type dropdown
  - File upload area
  - Expiry date picker
  - Document number field

#### `documents-detail-view.png`
- URL: `/documents` (with document viewer open)
- Show document preview with:
  - PDF/image preview
  - Document metadata
  - Download button
  - Edit/Delete options

---

### 5. Compliance (3 screenshots)

#### `compliance-periods-view.png`
- URL: `/compliance`
- Show compliance periods table with:
  - Period list with dates
  - Completion status
  - Branch filter
  - Add Period button

#### `compliance-add-record.png`
- URL: `/compliance` (with Add Compliance Record dialog open)
- Show compliance form with:
  - Employee selector
  - Compliance type dropdown
  - Date selector
  - Notes/comments field

#### `compliance-spot-check.png`
- URL: `/compliance` (with Spot Check form open)
- Show spot check interface with:
  - Form fields
  - Observation areas
  - File upload section
  - Save button

---

### 6. Settings (2 screenshots)

#### `settings-navigation.png`
- URL: `/settings`
- Show settings page with:
  - Tabs/navigation (Company, Branches, Leave Types, etc.)
  - Left sidebar with all setting categories
  - Active setting section

#### `settings-branch-management.png`
- URL: `/settings` (on Branch settings tab)
- Show branch management with:
  - Branch list
  - Add Branch button
  - Edit/Delete options for branches

---

### 7. Additional Important Screenshots (2)

#### `user-management.png`
- URL: `/user-management` (Admin only)
- Show user list with:
  - User roles
  - Permission indicators
  - Add User button
  - Edit permissions option

#### `employee-portal-dashboard.png`
- URL: `/employee` (Employee portal login)
- Show employee self-service dashboard with:
  - Leave request option
  - Document viewing
  - Personal information section

---

## Capture Process

1. **Login**: Use admin credentials to access all areas
2. **Prepare Data**: Ensure sample data is present (not real employee data)
3. **Clean UI**: Remove any notifications/toasts that might be visible
4. **Consistent Theme**: Use the same light/dark mode for all screenshots
5. **Capture**: Use browser's full page screenshot or snipping tool
6. **Save**: Save with exact filename as specified above
7. **Place**: Put all screenshots in `public/user-guide-screenshots/` folder

## Tools for Capturing

- **Windows**: Snipping Tool (Win + Shift + S) or Greenshot
- **Mac**: Command + Shift + 4 or Cleanshot X
- **Browser Extensions**: 
  - Awesome Screenshot
  - FireShot
  - Full Page Screen Capture

## After Capturing

Once all screenshots are captured and placed in the folder, the PDF generator will automatically include them in the appropriate sections of the user guide.

## Optional Enhanced Screenshots

For even more comprehensive documentation, consider adding:
- `job-applications-list.png`
- `job-applications-form.png`
- `reports-generation.png`
- `document-signing-flow.png`
- `client-management-view.png`

---

## Questions?
If you need help capturing specific screenshots or have questions about the process, contact the development team.
