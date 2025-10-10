import { jsPDF } from 'jspdf';

interface Section {
  title: string;
  content: string[];
  subsections?: Section[];
}

export const generateUserGuidePDF = () => {
  const doc = new jsPDF();
  let yPosition = 20;
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let pageNumber = 1;

  // Helper function to add page number
  const addPageNumber = () => {
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    pageNumber++;
  };

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace = 20) => {
    if (yPosition + requiredSpace > pageHeight - 30) {
      addPageNumber();
      doc.addPage();
      yPosition = 20;
    }
  };

  // Helper function to add text with word wrap
  const addWrappedText = (text: string, fontSize = 11, isBold = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(0, 0, 0);
    
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      checkNewPage();
      doc.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    });
    yPosition += 5;
  };

  // Helper function to add section header
  const addSectionHeader = (title: string, level = 1) => {
    checkNewPage(30);
    yPosition += 10;
    
    if (level === 1) {
      doc.setFillColor(41, 128, 185);
      doc.rect(margin, yPosition - 8, maxWidth, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin + 5, yPosition);
      yPosition += 15;
    } else if (level === 2) {
      doc.setFillColor(52, 152, 219);
      doc.rect(margin, yPosition - 6, maxWidth, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin + 5, yPosition);
      yPosition += 12;
    } else {
      doc.setTextColor(41, 128, 185);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin, yPosition);
      yPosition += 10;
    }
    
    doc.setTextColor(0, 0, 0);
  };

  // Helper function to add bullet point
  const addBulletPoint = (text: string, indent = 0) => {
    checkNewPage();
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('•', margin + indent, yPosition);
    const lines = doc.splitTextToSize(text, maxWidth - indent - 5);
    lines.forEach((line: string, index: number) => {
      if (index > 0) checkNewPage();
      doc.text(line, margin + indent + 5, yPosition);
      yPosition += 6;
    });
  };

  // Helper function to add numbered step
  const addNumberedStep = (number: number, text: string) => {
    checkNewPage();
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(52, 152, 219);
    doc.circle(margin + 3, yPosition - 2, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(number.toString(), margin + 3, yPosition, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(text, maxWidth - 15);
    lines.forEach((line: string, index: number) => {
      if (index > 0) checkNewPage();
      doc.text(line, margin + 10, yPosition);
      yPosition += 6;
    });
    yPosition += 2;
  };

  // Helper function to add info box
  const addInfoBox = (title: string, content: string, color: [number, number, number] = [52, 152, 219]) => {
    checkNewPage(40);
    doc.setDrawColor(...color);
    doc.setLineWidth(0.5);
    
    const boxY = yPosition;
    doc.rect(margin, boxY, maxWidth, 5, 'S');
    
    doc.setFillColor(...color);
    doc.rect(margin, boxY, maxWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 3, boxY + 5);
    
    yPosition = boxY + 12;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(content, maxWidth - 6);
    lines.forEach((line: string) => {
      checkNewPage();
      doc.text(line, margin + 3, yPosition);
      yPosition += 5;
    });
    yPosition += 8;
  };

  // Helper function to add screenshot
  const addScreenshot = (imageName: string, caption: string, heightInMm: number = 80) => {
    const imagePath = `/user-guide-screenshots/${imageName}`;
    
    checkNewPage(heightInMm + 20);
    
    try {
      // Add a border for the screenshot area
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.rect(margin, yPosition, maxWidth, heightInMm, 'S');
      
      // Try to add the image
      // Note: In production, you would need to load the image first
      // For now, we'll add a placeholder box
      doc.setFillColor(245, 245, 245);
      doc.rect(margin + 1, yPosition + 1, maxWidth - 2, heightInMm - 2, 'F');
      
      // Add a centered text indicating where the screenshot should appear
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`[Screenshot: ${imageName}]`, pageWidth / 2, yPosition + (heightInMm / 2), { align: 'center' });
      doc.text('Place screenshot in: public/user-guide-screenshots/', pageWidth / 2, yPosition + (heightInMm / 2) + 5, { align: 'center' });
      
      yPosition += heightInMm + 3;
      
      // Add caption below screenshot
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'italic');
      const captionLines = doc.splitTextToSize(caption, maxWidth);
      captionLines.forEach((line: string) => {
        doc.text(line, margin, yPosition);
        yPosition += 4;
      });
      
      yPosition += 8;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      
    } catch (error) {
      console.log(`Screenshot ${imageName} not found, adding placeholder`);
      // Continue with placeholder
    }
  };

  // Title Page
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('HR Management System', pageWidth / 2, 80, { align: 'center' });
  
  doc.setFontSize(24);
  doc.text('Complete User Guide', pageWidth / 2, 100, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Step-by-Step Instructions for All Users', pageWidth / 2, 120, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 40, { align: 'center' });
  doc.text('Version 1.0', pageWidth / 2, pageHeight - 30, { align: 'center' });

  addPageNumber();
  doc.addPage();
  yPosition = 20;

  // Table of Contents
  addSectionHeader('Table of Contents', 1);
  const sections = [
    '1. Introduction & System Overview',
    '2. Getting Started',
    '3. Employee Management',
    '4. Client Management',
    '5. Leave Management',
    '6. Document Management',
    '7. Compliance Management',
    '8. Document Signing',
    '9. Job Applications',
    '10. Reports & Analytics',
    '11. Settings & Configuration',
    '12. User Management',
    '13. Employee Portal',
    '14. Best Practices',
    '15. Troubleshooting',
    '16. Quick Reference Guide'
  ];
  
  sections.forEach(section => {
    addBulletPoint(section);
  });

  yPosition += 10;
  doc.addPage();
  yPosition = 20;

  // Section 1: Introduction & System Overview
  addSectionHeader('1. Introduction & System Overview', 1);
  addWrappedText('Welcome to the HR Management System. This comprehensive guide will help you navigate and utilize all features of the system effectively.');
  
  addSectionHeader('System Capabilities', 2);
  addBulletPoint('Employee record management and tracking');
  addBulletPoint('Client management and compliance monitoring');
  addBulletPoint('Leave request and approval workflow');
  addBulletPoint('Document storage with expiry tracking');
  addBulletPoint('Compliance recording and monitoring');
  addBulletPoint('Digital document signing');
  addBulletPoint('Job application processing');
  addBulletPoint('Comprehensive reporting and analytics');
  addBulletPoint('Multi-branch support with granular permissions');
  addBulletPoint('Employee self-service portal');

  addSectionHeader('User Roles & Permissions', 2);
  addWrappedText('The system supports three main user roles with different access levels:');
  
  addInfoBox('Admin Role', 'Full system access including user management, all settings, and complete control over all modules. Admins can manage users, configure system settings, and access all branches.', [46, 204, 113]);
  
  addInfoBox('Manager Role', 'Limited administrative access with permissions to manage employees, approve leaves, and generate reports within assigned branches.', [52, 152, 219]);
  
  addInfoBox('User Role', 'Standard access with customizable permissions. Users can view and manage records based on specifically granted permissions and assigned branches.', [155, 89, 182]);

  addSectionHeader('Login Instructions', 2);
  addWrappedText('There are two separate login portals:');
  addNumberedStep(1, 'Admin Portal: For administrators, managers, and staff users. Access via the main login page.');
  addNumberedStep(2, 'Employee Portal: For employee self-service. Employees use their email and default password (123456) for first login.');
  
  addScreenshot('login-page.png', 'Figure 1.1: Admin login page with email and password fields');
  
  addInfoBox('Security Note', 'All users should change their password after first login. Contact your system administrator if you experience login issues.', [230, 126, 34]);

  // Section 2: Getting Started
  doc.addPage();
  yPosition = 20;
  addSectionHeader('2. Getting Started', 1);
  
  addSectionHeader('Navigation Basics', 2);
  addWrappedText('The system uses a sidebar navigation menu on the left side of the screen. The menu includes:');
  addBulletPoint('Dashboard - System overview and key metrics');
  addBulletPoint('Employees - Employee records management');
  addBulletPoint('Clients - Client management (if applicable)');
  addBulletPoint('Leaves - Leave request management');
  addBulletPoint('Documents - Document tracking system');
  addBulletPoint('Document Signing - Digital signature workflows');
  addBulletPoint('Compliance - Compliance tracking and recording');
  addBulletPoint('Reports - Analytics and reporting');
  addBulletPoint('Job Applications - Application processing');
  addBulletPoint('Settings - System configuration');
  addBulletPoint('User Management - User and permission management (Admin only)');
  
  addScreenshot('sidebar-navigation.png', 'Figure 2.1: Sidebar navigation menu showing all available modules');

  addSectionHeader('Understanding the Dashboard', 2);
  addWrappedText('The dashboard provides a quick overview of your HR system:');
  addNumberedStep(1, 'Key Metrics: View total employees, active projects, pending tasks, and system completion rate at the top of the dashboard.');
  addNumberedStep(2, 'Branch Breakdown: Visual representation of employee distribution across branches.');
  addNumberedStep(3, 'Activity Timeline: Recent system activities and changes.');
  addNumberedStep(4, 'Document Health: Overview of document expiry status and compliance.');
  addNumberedStep(5, 'Quick Actions: Shortcuts to frequently used features.');
  
  addScreenshot('dashboard-overview.png', 'Figure 2.2: Dashboard overview with key metrics, branch breakdown, and activity timeline');

  // Section 3: Employee Management
  doc.addPage();
  yPosition = 20;
  addSectionHeader('3. Employee Management', 1);
  
  addSectionHeader('3.1 Viewing Employees', 2);
  addWrappedText('The Employees page displays all employee records with filtering and search capabilities.');
  
  addNumberedStep(1, 'Access the Employees page from the sidebar navigation.');
  addNumberedStep(2, 'Use the search bar to find employees by name or employee code.');
  addNumberedStep(3, 'Filter by branch using the branch dropdown (you will only see branches you have access to).');
  addNumberedStep(4, 'Sort the list by clicking column headers (Name, Employee Code, Branch, Working Hours, Leave Days).');
  addNumberedStep(5, 'View employee status badges indicating active/inactive status.');

  addScreenshot('employees-list-view.png', 'Figure 3.1: Employee list view with search, filters, and action buttons');

  addInfoBox('Permission Note', 'You can only view employees if you have "view" permission for the Employees module. Contact your administrator if you cannot access this page.', [52, 152, 219]);

  addSectionHeader('3.2 Adding New Employees', 2);
  addWrappedText('Follow these steps to add a new employee to the system:');
  
  addNumberedStep(1, 'Click the "Add Employee" button (requires "create" permission).');
  addNumberedStep(2, 'Fill in the required fields marked with an asterisk (*).');
  addNumberedStep(3, 'Name: Enter the employee\'s full name (required).');
  addNumberedStep(4, 'Email: Enter a unique email address (required). Each employee must have a unique email.');
  addNumberedStep(5, 'Phone: Enter the employee\'s contact number.');
  addNumberedStep(6, 'Branch: Select the employee\'s assigned branch from the dropdown (required).');
  addNumberedStep(7, 'Employee Code: Enter a unique employee identifier (required).');
  addNumberedStep(8, 'Job Title: Enter the employee\'s position or role.');
  addNumberedStep(9, 'Employee Type: Select Regular or Temporary.');
  addNumberedStep(10, 'Working Hours: Specify weekly working hours (affects leave calculations).');
  addNumberedStep(11, 'Leave Allowance: Set the annual leave days allocated to this employee.');
  addNumberedStep(12, 'Hours Restriction: Set maximum weekly hours if applicable.');
  addNumberedStep(13, 'Click "Save" to create the employee record.');

  addScreenshot('employees-add-form.png', 'Figure 3.2: Add employee form with all required and optional fields');

  addInfoBox('Default Password', 'New employees are assigned a default password: 123456. Employees should change this password on first login to the Employee Portal.', [230, 126, 34]);

  addSectionHeader('3.3 Editing Employees', 2);
  addWrappedText('To modify existing employee information:');
  
  addNumberedStep(1, 'Locate the employee in the employee list.');
  addNumberedStep(2, 'Click the "Edit" button (requires "edit" permission).');
  addNumberedStep(3, 'Modify any field as needed.');
  addNumberedStep(4, 'Note: Email addresses must remain unique across all employees.');
  addNumberedStep(5, 'Click "Save Changes" to update the record.');

  addInfoBox('Validation Errors', 'If you see "Email already exists" error, another employee is using that email address. Choose a different email or contact your administrator.', [231, 76, 60]);

  addSectionHeader('3.4 Deleting Employees', 2);
  addWrappedText('Employee records can be deleted individually or in bulk:');
  
  addWrappedText('Single Deletion:');
  addNumberedStep(1, 'Find the employee to delete.');
  addNumberedStep(2, 'Click the "Delete" button (requires "delete" permission).');
  addNumberedStep(3, 'Confirm the deletion in the dialog box.');
  addNumberedStep(4, 'The employee record will be permanently removed.');

  addWrappedText('Batch Deletion:');
  addNumberedStep(1, 'Select multiple employees using the checkboxes.');
  addNumberedStep(2, 'Click the "Delete Selected" button (requires "bulk-delete" permission).');
  addNumberedStep(3, 'Confirm deletion of all selected records.');

  addInfoBox('Warning', 'Deleting an employee is permanent and will remove all associated records including documents, leave history, and compliance records. Consider deactivating employees instead of deleting them.', [231, 76, 60]);

  addSectionHeader('3.5 Bulk Operations', 2);
  addWrappedText('The system supports bulk import and export of employee data:');
  
  addWrappedText('Importing Employees:');
  addNumberedStep(1, 'Click the "Import" button.');
  addNumberedStep(2, 'Download the CSV or Excel template.');
  addNumberedStep(3, 'Fill in employee data following the template format.');
  addNumberedStep(4, 'Upload the completed file.');
  addNumberedStep(5, 'Review the import preview showing what will be created.');
  addNumberedStep(6, 'Confirm the import to add all employees.');
  addNumberedStep(7, 'Review any error messages for rows that failed validation.');

  addScreenshot('employees-bulk-import.png', 'Figure 3.3: Bulk import interface with template download and file upload');

  addWrappedText('Exporting Employees:');
  addNumberedStep(1, 'Click the "Export" button.');
  addNumberedStep(2, 'Choose your preferred format (CSV or Excel).');
  addNumberedStep(3, 'The file will download with all employee data.');

  addSectionHeader('3.6 Managing Employee Passwords', 2);
  addWrappedText('Administrators can reset employee passwords:');
  addNumberedStep(1, 'Navigate to the employee record.');
  addNumberedStep(2, 'Click "Reset Password".');
  addNumberedStep(3, 'The password will be reset to the default: 123456.');
  addNumberedStep(4, 'Inform the employee to change their password on next login.');

  // Section 4: Client Management
  doc.addPage();
  yPosition = 20;
  addSectionHeader('4. Client Management', 1);
  
  addWrappedText('The Client Management module helps you track clients and their compliance requirements.');
  
  addSectionHeader('4.1 Viewing Clients', 2);
  addNumberedStep(1, 'Access the Clients page from the sidebar (requires "view" permission).');
  addNumberedStep(2, 'View the list of all clients you have access to.');
  addNumberedStep(3, 'Use the branch filter to view clients by branch.');
  addNumberedStep(4, 'Search for specific clients using the search bar.');

  addSectionHeader('4.2 Adding Clients', 2);
  addNumberedStep(1, 'Click "Add Client" button (requires "create" permission).');
  addNumberedStep(2, 'Enter client name (required).');
  addNumberedStep(3, 'Enter contact information (email, phone).');
  addNumberedStep(4, 'Select the assigned branch.');
  addNumberedStep(5, 'Enter client address and additional details.');
  addNumberedStep(6, 'Click "Save" to create the client record.');

  addSectionHeader('4.3 Client Compliance', 2);
  addWrappedText('Track compliance requirements for each client:');
  addNumberedStep(1, 'Open a client record.');
  addNumberedStep(2, 'Navigate to the Compliance tab.');
  addNumberedStep(3, 'View compliance periods and completion status.');
  addNumberedStep(4, 'Add new compliance records as needed.');

  addSectionHeader('4.4 Client Spot Checks', 2);
  addNumberedStep(1, 'Open a client record.');
  addNumberedStep(2, 'Click "Add Spot Check".');
  addNumberedStep(3, 'Complete the spot check form with observations and findings.');
  addNumberedStep(4, 'Upload supporting documents if needed.');
  addNumberedStep(5, 'Save the spot check record.');
  addNumberedStep(6, 'Generate PDF reports of spot checks for records.');

  // Section 5: Leave Management
  doc.addPage();
  yPosition = 20;
  addSectionHeader('5. Leave Management', 1);
  
  addSectionHeader('5.1 Viewing Leave Requests', 2);
  addWrappedText('The Leaves page displays all leave requests with filtering options:');
  addNumberedStep(1, 'Access the Leaves page from the sidebar.');
  addNumberedStep(2, 'View leaves filtered by branch (only branches you have access to).');
  addNumberedStep(3, 'Filter by status: All, Pending, Approved, or Rejected.');
  addNumberedStep(4, 'View leave details including employee, dates, type, and status.');

  addScreenshot('leaves-list-view.png', 'Figure 5.1: Leave requests list with status filters and branch selection');

  addInfoBox('Status Indicators', 'Pending (Yellow): Awaiting approval | Approved (Green): Request accepted | Rejected (Red): Request denied', [52, 152, 219]);

  addSectionHeader('5.2 Creating Leave Requests', 2);
  addNumberedStep(1, 'Click "Add Leave Request" (requires "create" permission).');
  addNumberedStep(2, 'Select the employee from the dropdown.');
  addNumberedStep(3, 'Choose the leave type (Annual Leave, Sick Leave, etc.).');
  addNumberedStep(4, 'Select start date using the date picker.');
  addNumberedStep(5, 'Select end date (must be after start date).');
  addNumberedStep(6, 'Add notes or reason for the leave request.');
  addNumberedStep(7, 'Click "Submit" to create the request.');

  addScreenshot('leaves-create-request.png', 'Figure 5.2: Create leave request form with employee selector and date pickers');

  addInfoBox('Leave Balance', 'The system will show the employee\'s remaining leave balance when creating a request. Ensure sufficient balance before submitting.', [46, 204, 113]);

  addSectionHeader('5.3 Approving and Rejecting Leaves', 2);
  addWrappedText('If you have "approve" permission, you can process leave requests:');
  
  addWrappedText('To Approve:');
  addNumberedStep(1, 'Find the pending leave request.');
  addNumberedStep(2, 'Review the request details and employee leave balance.');
  addNumberedStep(3, 'Click "Approve" button.');
  addNumberedStep(4, 'Confirm the approval.');
  addNumberedStep(5, 'The employee will be notified of the approval.');

  addWrappedText('To Reject:');
  addNumberedStep(1, 'Find the pending leave request.');
  addNumberedStep(2, 'Click "Reject" button.');
  addNumberedStep(3, 'Enter a reason for rejection (recommended).');
  addNumberedStep(4, 'Confirm the rejection.');
  addNumberedStep(5, 'The employee will be notified with the reason.');

  addScreenshot('leaves-approval-dialog.png', 'Figure 5.3: Leave approval/rejection dialog with comment field');

  addSectionHeader('5.4 Leave Analytics', 2);
  addWrappedText('View leave statistics and trends:');
  addBulletPoint('Total pending requests requiring action');
  addBulletPoint('Approved vs rejected leave ratio');
  addBulletPoint('Leave usage by branch');
  addBulletPoint('Employee leave balance tracking');
  addBulletPoint('Leave patterns and trends over time');

  // Section 6: Document Management
  doc.addPage();
  yPosition = 20;
  addSectionHeader('6. Document Management', 1);
  
  addSectionHeader('6.1 Understanding Document Types', 2);
  addWrappedText('The system tracks various employee document types:');
  addBulletPoint('Passport - International travel documents');
  addBulletPoint('Right to Work - Legal work authorization');
  addBulletPoint('DBS (Disclosure and Barring Service) - Background check certificates');
  addBulletPoint('Visa - Work visa documents');
  addBulletPoint('Driving License - Driver permits');
  addBulletPoint('Professional Certifications - Industry qualifications');
  addBulletPoint('Training Certificates - Completed training records');
  addBulletPoint('Custom Document Types - Configurable in Settings');

  addSectionHeader('6.2 Document Status Tracking', 2);
  addWrappedText('Documents are automatically categorized by expiry status:');
  
  addInfoBox('Valid (Green)', 'Document is current and more than 30 days until expiry. No action required.', [46, 204, 113]);
  addInfoBox('Expiring Soon (Orange)', 'Document expires within 30 days. Renewal should be initiated.', [230, 126, 34]);
  addInfoBox('Expired (Red)', 'Document has passed expiry date. Immediate action required.', [231, 76, 60]);

  addScreenshot('documents-list-view.png', 'Figure 6.1: Documents list with expiry status indicators and filters');

  addSectionHeader('6.3 Adding Documents', 2);
  addNumberedStep(1, 'Navigate to Documents page (requires "view" permission).');
  addNumberedStep(2, 'Click "Add Document" (requires "create" permission).');
  addNumberedStep(3, 'Select the employee from dropdown.');
  addNumberedStep(4, 'Choose document type.');
  addNumberedStep(5, 'Enter document number or reference ID.');
  addNumberedStep(6, 'Select issue date using date picker.');
  addNumberedStep(7, 'Select expiry date (if applicable).');
  addNumberedStep(8, 'Choose country of issue.');
  addNumberedStep(9, 'Select nationality status if relevant.');
  addNumberedStep(10, 'Add any notes or additional information.');
  addNumberedStep(11, 'Click "Save" to create the document record.');
  
  addScreenshot('documents-upload-form.png', 'Figure 6.2: Document upload form with all required fields');

  addSectionHeader('6.4 Managing Documents', 2);
  addWrappedText('Edit or delete existing documents:');
  
  addWrappedText('To Edit:');
  addNumberedStep(1, 'Find the document in the list.');
  addNumberedStep(2, 'Click "Edit" (requires "edit" permission).');
  addNumberedStep(3, 'Update any field as needed.');
  addNumberedStep(4, 'Click "Save Changes".');

  addWrappedText('To Delete:');
  addNumberedStep(1, 'Find the document to remove.');
  addNumberedStep(2, 'Click "Delete" (requires "delete" permission).');
  addNumberedStep(3, 'Confirm deletion in the dialog.');

  addInfoBox('Best Practice', 'When documents are renewed, add the new document rather than editing the old one. This maintains a complete audit trail.', [52, 152, 219]);

  addSectionHeader('6.5 Document Expiry Management', 2);
  addWrappedText('Stay on top of expiring documents:');
  addNumberedStep(1, 'Review the Document Health widget on the dashboard.');
  addNumberedStep(2, 'Filter documents by status (Valid/Expiring/Expired).');
  addNumberedStep(3, 'Set up reminder notifications for expiring documents.');
  addNumberedStep(4, 'Generate expiry reports from the Reports page.');
  addNumberedStep(5, 'Contact employees proactively about renewals.');

  addSectionHeader('6.6 Bulk Document Operations', 2);
  addWrappedText('Import or export documents in bulk:');
  addBulletPoint('Download document template (CSV/Excel format)');
  addBulletPoint('Fill in document details following template structure');
  addBulletPoint('Upload completed file to import multiple documents');
  addBulletPoint('Export all documents for backup or reporting');

  // Section 7: Compliance Management
  doc.addPage();
  yPosition = 20;
  addSectionHeader('7. Compliance Management', 1);
  
  addSectionHeader('7.1 Compliance Types Overview', 2);
  addWrappedText('The system supports various compliance tracking types:');
  addBulletPoint('Supervision - Regular employee supervision sessions');
  addBulletPoint('Spot Checks - Random quality assurance checks');
  addBulletPoint('Annual Appraisals - Yearly performance reviews');
  addBulletPoint('Medication Competency - Medical administration assessments');
  addBulletPoint('Care Worker Statements - Employee self-assessments');
  addBulletPoint('Questionnaires - Custom compliance questionnaires');
  addBulletPoint('Custom Types - Configurable compliance requirements');

  addSectionHeader('7.2 Compliance Periods', 2);
  addWrappedText('Compliance is organized into periods (e.g., Q1 2024, Monthly March 2024):');
  addNumberedStep(1, 'Navigate to Compliance page from sidebar.');
  addNumberedStep(2, 'View existing compliance periods or create new ones.');
  addNumberedStep(3, 'Each period has a start date, end date, and assigned employees.');
  addNumberedStep(4, 'Track completion percentage for each period.');
  addNumberedStep(5, 'View detailed breakdown of completed vs pending items.');

  addSectionHeader('7.3 Creating Compliance Periods', 2);
  addNumberedStep(1, 'Click "Add Period" on the Compliance Type page.');
  addNumberedStep(2, 'Enter period name (e.g., "Q1 2024 Supervision").');
  addNumberedStep(3, 'Select start date.');
  addNumberedStep(4, 'Select end date.');
  addNumberedStep(5, 'Assign employees or select all employees.');
  addNumberedStep(6, 'Save the period to activate it.');

  addScreenshot('compliance-periods-view.png', 'Figure 7.1: Compliance periods view with period list and status');

  addSectionHeader('7.4 Recording Compliance', 2);
  addWrappedText('Complete compliance records for employees:');
  addNumberedStep(1, 'Open a compliance period.');
  addNumberedStep(2, 'Click on an employee to add/view their compliance record.');
  addNumberedStep(3, 'If using questionnaire: Answer all required questions.');
  addNumberedStep(4, 'If using form: Complete all form fields.');
  addNumberedStep(5, 'Upload supporting documents or evidence if required.');
  addNumberedStep(6, 'Set completion status (Completed/Compliant).');
  addNumberedStep(7, 'Add supervisor notes or comments.');
  addNumberedStep(8, 'Save the compliance record.');
  addNumberedStep(9, 'Generate PDF of the completed form if needed.');
  
  addScreenshot('compliance-add-record.png', 'Figure 7.2: Add compliance record form with questionnaire or form fields');

  addSectionHeader('7.5 Supervision Records', 2);
  addWrappedText('Conducting employee supervision:');
  addNumberedStep(1, 'Navigate to Compliance > Supervision.');
  addNumberedStep(2, 'Select the supervision period.');
  addNumberedStep(3, 'Click "Add Supervision" for an employee.');
  addNumberedStep(4, 'Complete the supervision form with discussion points.');
  addNumberedStep(5, 'Record employee feedback and development plans.');
  addNumberedStep(6, 'Set follow-up actions and deadlines.');
  addNumberedStep(7, 'Both supervisor and employee can add comments.');
  addNumberedStep(8, 'Save and generate PDF for records.');

  addSectionHeader('7.6 Spot Checks', 2);
  addWrappedText('Performing random quality spot checks:');
  addNumberedStep(1, 'Access Compliance > Spot Checks.');
  addNumberedStep(2, 'Click "Add Spot Check".');
  addNumberedStep(3, 'Select employee being observed.');
  addNumberedStep(4, 'Complete spot check questionnaire.');
  addNumberedStep(5, 'Record observations and findings.');
  addNumberedStep(6, 'Note any areas for improvement.');
  addNumberedStep(7, 'Upload photos or evidence if applicable.');
  addNumberedStep(8, 'Mark as completed and save.');
  
  addScreenshot('compliance-spot-check.png', 'Figure 7.3: Spot check form with observation fields and file upload');

  addSectionHeader('7.7 Annual Appraisals', 2);
  addWrappedText('Conducting yearly performance reviews:');
  addNumberedStep(1, 'Navigate to Compliance > Annual Appraisals.');
  addNumberedStep(2, 'Create new appraisal period for the year.');
  addNumberedStep(3, 'Select employee for appraisal.');
  addNumberedStep(4, 'Complete comprehensive appraisal form including:');
  addBulletPoint('Performance objectives and achievements', 10);
  addBulletPoint('Skills and competency assessment', 10);
  addBulletPoint('Training and development needs', 10);
  addBulletPoint('Career progression goals', 10);
  addBulletPoint('Overall performance rating', 10);
  addNumberedStep(5, 'Employee and manager both provide input.');
  addNumberedStep(6, 'Generate appraisal PDF for employee records.');

  addSectionHeader('7.8 Care Worker Statements', 2);
  addWrappedText('Employee self-assessment statements:');
  addNumberedStep(1, 'Employees access via Employee Portal.');
  addNumberedStep(2, 'Complete self-reflection questionnaire.');
  addNumberedStep(3, 'Describe duties, challenges, and achievements.');
  addNumberedStep(4, 'Submit statement to manager for review.');
  addNumberedStep(5, 'Manager reviews and provides feedback.');
  addNumberedStep(6, 'Statement is marked as reviewed and archived.');

  // Section 8: Document Signing
  doc.addPage();
  yPosition = 20;
  addSectionHeader('8. Document Signing', 1);
  
  addWrappedText('The Document Signing module enables digital signature workflows for contracts, agreements, and forms.');
  
  addSectionHeader('8.1 Creating Signing Templates', 2);
  addNumberedStep(1, 'Navigate to Document Signing > Templates.');
  addNumberedStep(2, 'Click "Create Template".');
  addNumberedStep(3, 'Upload a PDF document to use as template.');
  addNumberedStep(4, 'Give the template a descriptive name.');
  addNumberedStep(5, 'Use the Field Designer to add signature fields:');
  addBulletPoint('Drag and drop signature boxes', 10);
  addBulletPoint('Add date fields', 10);
  addBulletPoint('Add text input fields', 10);
  addBulletPoint('Position fields precisely on the document', 10);
  addNumberedStep(6, 'Save the template for reuse.');

  addSectionHeader('8.2 Sending Signing Requests', 2);
  addNumberedStep(1, 'Click "Create Signing Request".');
  addNumberedStep(2, 'Select a template or upload a new document.');
  addNumberedStep(3, 'Choose the employee who needs to sign.');
  addNumberedStep(4, 'Add a message explaining what needs to be signed.');
  addNumberedStep(5, 'Set an optional deadline for completion.');
  addNumberedStep(6, 'Send the request - employee receives notification.');

  addSectionHeader('8.3 Signing Documents (Employee)', 2);
  addWrappedText('Employees sign documents through the Employee Portal:');
  addNumberedStep(1, 'Receive notification of pending signature.');
  addNumberedStep(2, 'Access Document Signing from employee menu.');
  addNumberedStep(3, 'Review the document carefully.');
  addNumberedStep(4, 'Click on signature field to sign.');
  addNumberedStep(5, 'Draw signature using mouse or touch.');
  addNumberedStep(6, 'Fill in any required date or text fields.');
  addNumberedStep(7, 'Review completed document.');
  addNumberedStep(8, 'Submit signed document.');

  addSectionHeader('8.4 Tracking Signing Status', 2);
  addWrappedText('Monitor document signing progress:');
  addBulletPoint('Pending - Waiting for employee signature');
  addBulletPoint('In Progress - Employee has opened but not completed');
  addBulletPoint('Completed - Document fully signed');
  addBulletPoint('Expired - Deadline passed without completion');
  
  addSectionHeader('8.5 Completed Documents', 2);
  addNumberedStep(1, 'Access completed documents archive.');
  addNumberedStep(2, 'View all signed documents with timestamps.');
  addNumberedStep(3, 'Download signed PDFs for records.');
  addNumberedStep(4, 'Verify signature authenticity and completion.');

  // Section 9: Job Applications
  doc.addPage();
  yPosition = 20;
  addSectionHeader('9. Job Applications', 1);
  
  addSectionHeader('9.1 Application Portal Overview', 2);
  addWrappedText('The job application portal allows candidates to apply online through a multi-step form:');
  addBulletPoint('Personal Information - Basic details and contact info');
  addBulletPoint('Emergency Contact - Emergency contact details');
  addBulletPoint('Employment History - Previous work experience');
  addBulletPoint('Skills & Experience - Qualifications and competencies');
  addBulletPoint('Availability - Working hours and shift preferences');
  addBulletPoint('References - Professional reference contacts');
  addBulletPoint('Declarations - Legal declarations and consent');
  addBulletPoint('Terms & Policies - Agreement to policies');

  addSectionHeader('9.2 Viewing Applications', 2);
  addNumberedStep(1, 'Access Job Applications from sidebar.');
  addNumberedStep(2, 'View list of all submitted applications.');
  addNumberedStep(3, 'Filter by application status:');
  addBulletPoint('New - Just submitted', 10);
  addBulletPoint('In Review - Being processed', 10);
  addBulletPoint('Interview Scheduled - Moving forward', 10);
  addBulletPoint('Accepted - Offered position', 10);
  addBulletPoint('Rejected - Not proceeding', 10);
  addNumberedStep(4, 'Search by applicant name or email.');
  addNumberedStep(5, 'Sort by submission date.');

  addSectionHeader('9.3 Reviewing Applications', 2);
  addNumberedStep(1, 'Click on an application to view details.');
  addNumberedStep(2, 'Review all sections of the application.');
  addNumberedStep(3, 'Check completeness and accuracy.');
  addNumberedStep(4, 'View uploaded documents and attachments.');
  addNumberedStep(5, 'Download application PDF (requires permission).');
  addNumberedStep(6, 'Add internal notes or comments.');

  addSectionHeader('9.4 Reference Management', 2);
  addWrappedText('Process reference requests for applicants:');
  
  addWrappedText('Sending Reference Requests:');
  addNumberedStep(1, 'Open application details.');
  addNumberedStep(2, 'Navigate to References section.');
  addNumberedStep(3, 'Click "Send Reference Request" (requires permission).');
  addNumberedStep(4, 'Email is automatically sent to reference contact.');
  addNumberedStep(5, 'Track reference request status.');

  addWrappedText('Managing Received References:');
  addNumberedStep(1, 'View when references are submitted.');
  addNumberedStep(2, 'Download reference PDF (requires permission).');
  addNumberedStep(3, 'Review reference feedback and ratings.');
  addNumberedStep(4, 'Compare multiple references for same applicant.');

  addWrappedText('Manual Reference Entry:');
  addNumberedStep(1, 'For phone references or paper references.');
  addNumberedStep(2, 'Click "Add Manual Reference" (requires permission).');
  addNumberedStep(3, 'Enter reference information manually.');
  addNumberedStep(4, 'Generate PDF for records.');

  addSectionHeader('9.5 Interview Scheduling', 2);
  addNumberedStep(1, 'Select application to schedule interview.');
  addNumberedStep(2, 'Choose interview date and time.');
  addNumberedStep(3, 'Add interview location or video link.');
  addNumberedStep(4, 'Send interview invitation to applicant.');
  addNumberedStep(5, 'Update application status to "Interview Scheduled".');

  addSectionHeader('9.6 Application Status Updates', 2);
  addNumberedStep(1, 'Click "Update Status" button (requires "edit" permission).');
  addNumberedStep(2, 'Select new status from dropdown.');
  addNumberedStep(3, 'Add notes explaining the status change.');
  addNumberedStep(4, 'Save the update.');
  addNumberedStep(5, 'Applicant receives notification of status change.');

  addSectionHeader('9.7 Converting to Employee', 2);
  addWrappedText('When hiring an applicant:');
  addNumberedStep(1, 'Update application status to "Accepted".');
  addNumberedStep(2, 'Click "Convert to Employee".');
  addNumberedStep(3, 'Verify information transfer.');
  addNumberedStep(4, 'Add employee-specific details (branch, code, etc.).');
  addNumberedStep(5, 'Create employee record from application data.');
  addNumberedStep(6, 'Archive the application.');

  // Section 10: Reports & Analytics
  doc.addPage();
  yPosition = 20;
  addSectionHeader('10. Reports & Analytics', 1);
  
  addSectionHeader('10.1 Report Types', 2);
  addWrappedText('Generate various reports for analysis and compliance:');
  addBulletPoint('Employee Reports - Complete staff listing and details');
  addBulletPoint('Leave Reports - Leave usage and balance analysis');
  addBulletPoint('Document Reports - Document status and expiry tracking');
  addBulletPoint('Compliance Reports - Compliance completion rates');
  addBulletPoint('Branch Reports - Branch-specific analytics');
  addBulletPoint('Custom Reports - Configurable report parameters');

  addSectionHeader('10.2 Generating Reports', 2);
  addNumberedStep(1, 'Navigate to Reports page (requires "view" permission).');
  addNumberedStep(2, 'Select report type from available options.');
  addNumberedStep(3, 'Set date range for the report.');
  addNumberedStep(4, 'Apply filters (branch, status, employee, etc.).');
  addNumberedStep(5, 'Click "Generate Report" (requires "generate" permission).');
  addNumberedStep(6, 'Review report data on screen.');
  addNumberedStep(7, 'Export if needed (requires "export" permission).');

  addSectionHeader('10.3 Employee Reports', 2);
  addWrappedText('Comprehensive employee data reports include:');
  addBulletPoint('Complete employee list with all details');
  addBulletPoint('Employee count by branch');
  addBulletPoint('Employee type distribution (Regular/Temporary)');
  addBulletPoint('Working hours summary');
  addBulletPoint('Contact information directory');
  addBulletPoint('Employment start dates');

  addSectionHeader('10.4 Leave Reports', 2);
  addWrappedText('Analyze leave patterns and usage:');
  addBulletPoint('Total leaves by status (Approved/Pending/Rejected)');
  addBulletPoint('Leave usage by employee');
  addBulletPoint('Leave type breakdown');
  addBulletPoint('Remaining leave balances');
  addBulletPoint('Leave trends over time');
  addBulletPoint('Branch-wise leave analysis');

  addSectionHeader('10.5 Document Expiry Reports', 2);
  addWrappedText('Track document expiry and renewal needs:');
  addBulletPoint('Documents expiring within 30 days');
  addBulletPoint('Expired documents requiring immediate action');
  addBulletPoint('Valid documents by type');
  addBulletPoint('Employee document completeness');
  addBulletPoint('Renewal forecast for next quarter');

  addSectionHeader('10.6 Compliance Reports', 2);
  addWrappedText('Monitor compliance completion and trends:');
  addBulletPoint('Compliance completion rates by period');
  addBulletPoint('Outstanding compliance items');
  addBulletPoint('Employee compliance history');
  addBulletPoint('Compliance type completion comparison');
  addBulletPoint('Branch compliance performance');

  addSectionHeader('10.7 Export Options', 2);
  addWrappedText('Export reports in multiple formats:');
  addNumberedStep(1, 'Generate the desired report.');
  addNumberedStep(2, 'Click "Export" button (requires "export" permission).');
  addNumberedStep(3, 'Choose export format:');
  addBulletPoint('CSV - For spreadsheet import', 10);
  addBulletPoint('Excel - With formatting and sheets', 10);
  addBulletPoint('PDF - For distribution and printing', 10);
  addNumberedStep(4, 'File downloads automatically to your device.');
  addNumberedStep(5, 'Open in appropriate application.');

  // Section 11: Settings & Configuration
  doc.addPage();
  yPosition = 20;
  addSectionHeader('11. Settings & Configuration', 1);
  
  addInfoBox('Admin Access Required', 'Most settings require Admin role or specific "edit" permissions. Contact your administrator if you cannot access settings.', [230, 126, 34]);
  
  addScreenshot('settings-navigation.png', 'Figure 11.1: Settings page with navigation showing all configuration options');

  addSectionHeader('11.1 Company Settings', 2);
  addNumberedStep(1, 'Navigate to Settings > Company Settings.');
  addNumberedStep(2, 'Update company name.');
  addNumberedStep(3, 'Upload company logo.');
  addNumberedStep(4, 'Set company tagline or description.');
  addNumberedStep(5, 'Enter contact information.');
  addNumberedStep(6, 'Configure branding colors (if applicable).');
  addNumberedStep(7, 'Save changes.');

  addSectionHeader('11.2 Branch Management', 2);
  addWrappedText('Manage organization branches/locations:');
  
  addWrappedText('Adding Branches:');
  addNumberedStep(1, 'Go to Settings > Branch Settings.');
  addNumberedStep(2, 'Click "Add Branch".');
  addNumberedStep(3, 'Enter branch name.');
  addNumberedStep(4, 'Enter branch location/address.');
  addNumberedStep(5, 'Add contact information.');
  addNumberedStep(6, 'Save the new branch.');

  addScreenshot('settings-branch-management.png', 'Figure 11.2: Branch management interface with add/edit capabilities');

  addWrappedText('Editing Branches:');
  addNumberedStep(1, 'Find branch in list.');
  addNumberedStep(2, 'Click "Edit".');
  addNumberedStep(3, 'Modify details as needed.');
  addNumberedStep(4, 'Save changes.');

  addWrappedText('Deleting Branches:');
  addInfoBox('Warning', 'Deleting a branch will affect all associated employees, leaves, and records. Ensure branch is no longer needed before deletion.', [231, 76, 60]);

  addSectionHeader('11.3 Leave Type Settings', 2);
  addWrappedText('Configure types of leave available:');
  addNumberedStep(1, 'Navigate to Settings > Leave Settings.');
  addNumberedStep(2, 'View existing leave types (Annual, Sick, etc.).');
  addNumberedStep(3, 'Click "Add Leave Type" to create new type.');
  addNumberedStep(4, 'Set leave type name.');
  addNumberedStep(5, 'Configure default allowance days.');
  addNumberedStep(6, 'Set leave rules (paid/unpaid, requires approval, etc.).');
  addNumberedStep(7, 'Choose color for visual identification.');
  addNumberedStep(8, 'Save leave type.');

  addSectionHeader('11.4 Document Type Settings', 2);
  addWrappedText('Customize tracked document types:');
  addNumberedStep(1, 'Access Settings > Document Settings.');
  addNumberedStep(2, 'Review default document types.');
  addNumberedStep(3, 'Add custom document types as needed.');
  addNumberedStep(4, 'Set renewal frequency (Annual, Biennial, etc.).');
  addNumberedStep(5, 'Configure required fields for each type.');
  addNumberedStep(6, 'Set expiry warning thresholds.');

  addSectionHeader('11.5 Compliance Type Settings', 2);
  addWrappedText('Configure compliance tracking requirements:');
  addNumberedStep(1, 'Go to Settings > Compliance Settings.');
  addNumberedStep(2, 'View existing compliance types.');
  addNumberedStep(3, 'Click "Add Compliance Type".');
  addNumberedStep(4, 'Name the compliance type.');
  addNumberedStep(5, 'Set frequency (Weekly, Monthly, Quarterly, Annual).');
  addNumberedStep(6, 'Choose if applies to Employees or Clients.');
  addNumberedStep(7, 'Configure questionnaire or form fields.');
  addNumberedStep(8, 'Save compliance type.');

  addSectionHeader('11.6 Job Position Settings', 2);
  addNumberedStep(1, 'Navigate to Settings > Job Position Settings.');
  addNumberedStep(2, 'Add job titles/positions used in organization.');
  addNumberedStep(3, 'Organize by department if needed.');
  addNumberedStep(4, 'Set job descriptions (optional).');
  addNumberedStep(5, 'Save positions for use in employee records.');

  addSectionHeader('11.7 Application Form Settings', 2);
  addWrappedText('Customize the job application form:');
  addNumberedStep(1, 'Access Settings > Application Settings.');
  addNumberedStep(2, 'Configure which steps are included.');
  addNumberedStep(3, 'Set field visibility (required/optional/hidden).');
  addNumberedStep(4, 'Customize shift preferences options.');
  addNumberedStep(5, 'Configure skills matrix items.');
  addNumberedStep(6, 'Set custom questions for each section.');
  addNumberedStep(7, 'Preview application form.');
  addNumberedStep(8, 'Save configuration.');

  addSectionHeader('11.8 Email Settings', 2);
  addWrappedText('Configure automated email notifications:');
  addBulletPoint('Leave approval/rejection notifications');
  addBulletPoint('Document expiry reminders');
  addBulletPoint('Compliance due date alerts');
  addBulletPoint('Reference request emails');
  addBulletPoint('Document signing notifications');
  addBulletPoint('Application status updates');

  // Section 12: User Management
  doc.addPage();
  yPosition = 20;
  addSectionHeader('12. User Management', 1);
  
  addInfoBox('Admin Only Feature', 'User Management is typically only accessible to Admin users. This section manages who can access the admin portal and what they can do.', [52, 152, 219]);

  addSectionHeader('12.1 Understanding User Roles', 2);
  
  addWrappedText('Admin Role:');
  addBulletPoint('Complete system access');
  addBulletPoint('Can manage all modules without restrictions');
  addBulletPoint('Can create, edit, and delete users');
  addBulletPoint('Can configure system settings');
  addBulletPoint('Access to all branches automatically');
  addBulletPoint('Cannot be restricted by permissions');

  addWrappedText('Manager Role:');
  addBulletPoint('Limited administrative access');
  addBulletPoint('Can manage employees and operations');
  addBulletPoint('Can approve leaves and process applications');
  addBulletPoint('Can generate reports');
  addBulletPoint('Subject to branch restrictions');
  addBulletPoint('May have limited settings access');

  addWrappedText('User Role:');
  addBulletPoint('Standard access level');
  addBulletPoint('Permissions are fully customizable');
  addBulletPoint('Can only access specifically granted pages');
  addBulletPoint('Can only perform specifically granted actions');
  addBulletPoint('Restricted to assigned branches only');
  addBulletPoint('Ideal for data entry staff or specialized roles');

  addSectionHeader('12.2 Creating Users', 2);
  addNumberedStep(1, 'Navigate to User Management (Admin only).');
  addNumberedStep(2, 'Click "Add User" or "Create User".');
  addNumberedStep(3, 'Enter user\'s full name.');
  addNumberedStep(4, 'Enter unique email address.');
  addNumberedStep(5, 'Select user role (Admin/Manager/User).');
  addNumberedStep(6, 'Set temporary password or use system default.');
  addNumberedStep(7, 'Save to create the user account.');

  addSectionHeader('12.3 Managing Permissions', 2);
  addWrappedText('For Manager and User roles, configure granular permissions:');
  
  addWrappedText('Page Access Permissions:');
  addNumberedStep(1, 'Open user permissions dialog.');
  addNumberedStep(2, 'Select which pages the user can access:');
  addBulletPoint('Dashboard', 10);
  addBulletPoint('Employees', 10);
  addBulletPoint('Clients', 10);
  addBulletPoint('Leaves', 10);
  addBulletPoint('Documents', 10);
  addBulletPoint('Document Signing', 10);
  addBulletPoint('Compliance', 10);
  addBulletPoint('Reports', 10);
  addBulletPoint('Job Applications', 10);
  addBulletPoint('Settings', 10);

  addWrappedText('Action Permissions (per module):');
  addBulletPoint('View - Can see records');
  addBulletPoint('Create - Can add new records');
  addBulletPoint('Edit - Can modify existing records');
  addBulletPoint('Delete - Can remove records');
  addBulletPoint('Approve - Can approve requests (leaves)');
  addBulletPoint('Upload - Can upload files');
  addBulletPoint('Export - Can export data');
  addBulletPoint('Generate - Can generate reports');

  addSectionHeader('12.4 Branch Restrictions', 2);
  addWrappedText('Limit user access to specific branches:');
  addNumberedStep(1, 'Open user permissions dialog.');
  addNumberedStep(2, 'Navigate to Branch Access section.');
  addNumberedStep(3, 'Select branches this user can access.');
  addNumberedStep(4, 'User will only see data from selected branches.');
  addNumberedStep(5, 'Leave empty to allow access to all branches.');

  addInfoBox('Best Practice', 'Assign branch restrictions based on user\'s physical location or area of responsibility. For example, a branch manager should only access their own branch.', [52, 152, 219]);

  addSectionHeader('12.5 Permission Examples', 2);
  
  addWrappedText('Example 1: Data Entry Clerk');
  addBulletPoint('Role: User');
  addBulletPoint('Page Access: Employees, Documents');
  addBulletPoint('Employees: View, Create, Edit (no Delete)');
  addBulletPoint('Documents: View, Create, Upload (no Edit or Delete)');
  addBulletPoint('Branch: Single branch restriction');

  addWrappedText('Example 2: HR Coordinator');
  addBulletPoint('Role: Manager');
  addBulletPoint('Page Access: Employees, Leaves, Documents, Reports');
  addBulletPoint('Employees: View, Create, Edit, Delete');
  addBulletPoint('Leaves: View, Create, Edit, Approve');
  addBulletPoint('Documents: Full access');
  addBulletPoint('Reports: View, Generate, Export');
  addBulletPoint('Branch: Multiple branch access');

  addWrappedText('Example 3: Compliance Officer');
  addBulletPoint('Role: User');
  addBulletPoint('Page Access: Employees (view only), Compliance, Reports');
  addBulletPoint('Compliance: Full access to all compliance types');
  addBulletPoint('Reports: View, Generate (compliance reports only)');
  addBulletPoint('Branch: All branches');

  addSectionHeader('12.6 Editing User Permissions', 2);
  addNumberedStep(1, 'Find user in User Management list.');
  addNumberedStep(2, 'Click "Edit Permissions" button.');
  addNumberedStep(3, 'Modify page access as needed.');
  addNumberedStep(4, 'Adjust action permissions for each module.');
  addNumberedStep(5, 'Update branch restrictions.');
  addNumberedStep(6, 'Save changes.');
  addNumberedStep(7, 'User\'s access updates immediately.');

  addSectionHeader('12.7 Resetting User Passwords', 2);
  addNumberedStep(1, 'Locate user in User Management.');
  addNumberedStep(2, 'Click "Reset Password".');
  addNumberedStep(3, 'Choose to set custom password or use default.');
  addNumberedStep(4, 'Confirm password reset.');
  addNumberedStep(5, 'Inform user of new password securely.');
  addNumberedStep(6, 'User should change password on next login.');

  addSectionHeader('12.8 Deleting Users', 2);
  addNumberedStep(1, 'Find user to remove.');
  addNumberedStep(2, 'Click "Delete User".');
  addNumberedStep(3, 'Confirm deletion in dialog.');
  addNumberedStep(4, 'User account is permanently removed.');
  addNumberedStep(5, 'User can no longer access the system.');

  addInfoBox('Warning', 'Deleting a user is permanent. Consider deactivating users instead of deleting if you might need to restore access later.', [231, 76, 60]);

  // Section 13: Employee Portal
  doc.addPage();
  yPosition = 20;
  addSectionHeader('13. Employee Portal', 1);
  
  addWrappedText('The Employee Portal provides self-service access for employees to manage their own information.');
  
  addSectionHeader('13.1 Employee Login', 2);
  addNumberedStep(1, 'Navigate to the Employee Portal login page.');
  addNumberedStep(2, 'Enter your employee email address.');
  addNumberedStep(3, 'Enter your password (default: 123456 for new accounts).');
  addNumberedStep(4, 'Click "Login" to access your portal.');
  addNumberedStep(5, 'You will be prompted to change password on first login.');

  addInfoBox('Forgot Password', 'If you forget your password, contact your HR administrator to reset it. Employees cannot self-reset passwords.', [52, 152, 219]);

  addSectionHeader('13.2 Employee Dashboard', 2);
  addWrappedText('After login, employees see their personalized dashboard:');
  addBulletPoint('Personal information summary');
  addBulletPoint('Current leave balance');
  addBulletPoint('Pending leave requests status');
  addBulletPoint('Upcoming leaves');
  addBulletPoint('Compliance status overview');
  addBulletPoint('Pending actions (signatures, statements, etc.)');
  addBulletPoint('Recent notifications');

  addSectionHeader('13.3 Requesting Leave', 2);
  addNumberedStep(1, 'Click "Request Leave" button.');
  addNumberedStep(2, 'Select leave type (Annual, Sick, etc.).');
  addNumberedStep(3, 'Choose start date from calendar.');
  addNumberedStep(4, 'Choose end date from calendar.');
  addNumberedStep(5, 'View calculated number of days.');
  addNumberedStep(6, 'Check remaining balance before submitting.');
  addNumberedStep(7, 'Add reason or notes for the request.');
  addNumberedStep(8, 'Submit request for manager approval.');
  addNumberedStep(9, 'Receive notification when approved/rejected.');

  addSectionHeader('13.4 Viewing Leave History', 2);
  addNumberedStep(1, 'Access "My Leaves" section.');
  addNumberedStep(2, 'View all leave requests and their status.');
  addNumberedStep(3, 'See approved leaves marked in green.');
  addNumberedStep(4, 'See pending requests marked in yellow.');
  addNumberedStep(5, 'See rejected requests marked in red.');
  addNumberedStep(6, 'View rejection reasons if applicable.');
  addNumberedStep(7, 'Track total leave days used.');

  addSectionHeader('13.5 Viewing Documents', 2);
  addNumberedStep(1, 'Navigate to "My Documents" section.');
  addNumberedStep(2, 'View all documents associated with your profile.');
  addNumberedStep(3, 'Check document expiry status.');
  addNumberedStep(4, 'See which documents are expiring soon.');
  addNumberedStep(5, 'Note which documents need renewal.');
  addNumberedStep(6, 'Contact HR for document updates or renewals.');

  addSectionHeader('13.6 Completing Care Worker Statements', 2);
  addNumberedStep(1, 'Access "Care Worker Statements" from menu.');
  addNumberedStep(2, 'View pending statement requests.');
  addNumberedStep(3, 'Click "Complete Statement".');
  addNumberedStep(4, 'Fill in the self-assessment questionnaire.');
  addNumberedStep(5, 'Describe your work duties and responsibilities.');
  addNumberedStep(6, 'Note challenges faced and how you addressed them.');
  addNumberedStep(7, 'List achievements and skills developed.');
  addNumberedStep(8, 'Submit statement for manager review.');

  addSectionHeader('13.7 Digital Document Signing', 2);
  addNumberedStep(1, 'Receive notification of document requiring signature.');
  addNumberedStep(2, 'Access "Document Signing" from employee menu.');
  addNumberedStep(3, 'View pending documents to sign.');
  addNumberedStep(4, 'Open document and review carefully.');
  addNumberedStep(5, 'Click on signature field.');
  addNumberedStep(6, 'Sign using mouse or touch screen.');
  addNumberedStep(7, 'Fill any required date or text fields.');
  addNumberedStep(8, 'Review and submit signed document.');

  addSectionHeader('13.8 Changing Password', 2);
  addNumberedStep(1, 'Click profile icon or "Settings".');
  addNumberedStep(2, 'Select "Change Password".');
  addNumberedStep(3, 'Enter current password.');
  addNumberedStep(4, 'Enter new password.');
  addNumberedStep(5, 'Confirm new password.');
  addNumberedStep(6, 'Submit password change.');
  addNumberedStep(7, 'Use new password for future logins.');

  addInfoBox('Password Requirements', 'Passwords should be strong and unique. Include uppercase, lowercase, numbers, and special characters. Minimum 8 characters recommended.', [52, 152, 219]);

  addSectionHeader('13.9 Viewing Compliance Status', 2);
  addNumberedStep(1, 'Access "My Compliance" section.');
  addNumberedStep(2, 'View compliance requirements applicable to you.');
  addNumberedStep(3, 'See completed compliance records.');
  addNumberedStep(4, 'Check pending compliance items.');
  addNumberedStep(5, 'View upcoming supervision or appraisal dates.');

  // Section 14: Best Practices
  doc.addPage();
  yPosition = 20;
  addSectionHeader('14. Best Practices', 1);
  
  addSectionHeader('14.1 Data Entry Standards', 2);
  addBulletPoint('Always enter complete and accurate information');
  addBulletPoint('Use consistent formatting for names (e.g., First Last)');
  addBulletPoint('Verify email addresses before saving');
  addBulletPoint('Double-check dates, especially expiry dates');
  addBulletPoint('Add notes or comments for context');
  addBulletPoint('Review entries before saving');

  addSectionHeader('14.2 Document Expiry Management', 2);
  addWrappedText('Recommended workflow for managing document expiries:');
  addNumberedStep(1, 'Check Document Health widget daily.');
  addNumberedStep(2, 'Review "Expiring Soon" documents weekly.');
  addNumberedStep(3, 'Contact employees 60 days before expiry.');
  addNumberedStep(4, 'Set reminders for critical documents (Right to Work, DBS).');
  addNumberedStep(5, 'Keep renewal process documentation.');
  addNumberedStep(6, 'Update documents immediately upon receipt.');
  addNumberedStep(7, 'Generate monthly expiry reports for planning.');

  addSectionHeader('14.3 Compliance Tracking', 2);
  addBulletPoint('Create compliance periods at start of each quarter');
  addBulletPoint('Assign all relevant employees to periods');
  addBulletPoint('Set realistic completion deadlines');
  addBulletPoint('Monitor completion rates weekly');
  addBulletPoint('Follow up on overdue compliance items');
  addBulletPoint('Keep evidence and documentation');
  addBulletPoint('Generate PDFs of completed records');
  addBulletPoint('Archive completed periods for audits');

  addSectionHeader('14.4 Leave Approval Workflow', 2);
  addWrappedText('Establish consistent leave approval procedures:');
  addNumberedStep(1, 'Review all pending leave requests daily.');
  addNumberedStep(2, 'Check employee leave balance before approving.');
  addNumberedStep(3, 'Consider operational coverage needs.');
  addNumberedStep(4, 'Communicate decisions within 48 hours.');
  addNumberedStep(5, 'Provide clear reasons for rejections.');
  addNumberedStep(6, 'Encourage early leave request submissions.');
  addNumberedStep(7, 'Maintain fairness in approval decisions.');

  addSectionHeader('14.5 User Permission Strategy', 2);
  addWrappedText('Guidelines for assigning user permissions:');
  addBulletPoint('Follow principle of least privilege');
  addBulletPoint('Grant only necessary permissions for job role');
  addBulletPoint('Review permissions quarterly');
  addBulletPoint('Remove access immediately when role changes');
  addBulletPoint('Document permission decisions');
  addBulletPoint('Use branch restrictions appropriately');
  addBulletPoint('Limit "delete" permissions carefully');
  addBulletPoint('Consider creating role templates');

  addSectionHeader('14.6 Regular System Maintenance', 2);
  addWrappedText('Recommended periodic maintenance tasks:');
  
  addWrappedText('Daily:');
  addBulletPoint('Review pending actions and requests', 5);
  addBulletPoint('Check dashboard metrics', 5);
  addBulletPoint('Process new job applications', 5);
  
  addWrappedText('Weekly:');
  addBulletPoint('Review expiring documents', 5);
  addBulletPoint('Check compliance completion rates', 5);
  addBulletPoint('Process pending signatures', 5);
  
  addWrappedText('Monthly:');
  addBulletPoint('Generate comprehensive reports', 5);
  addBulletPoint('Review user access and permissions', 5);
  addBulletPoint('Archive completed compliance periods', 5);
  addBulletPoint('Back up critical data', 5);
  
  addWrappedText('Quarterly:');
  addBulletPoint('Full system audit', 5);
  addBulletPoint('Review and update settings', 5);
  addBulletPoint('User training refreshers', 5);

  addSectionHeader('14.7 Data Quality', 2);
  addBulletPoint('Validate data entry with spot checks');
  addBulletPoint('Cross-reference with source documents');
  addBulletPoint('Implement peer review for critical data');
  addBulletPoint('Use import templates correctly');
  addBulletPoint('Test bulk imports with small samples first');
  addBulletPoint('Regular data cleanup and deduplication');

  // Section 15: Troubleshooting
  doc.addPage();
  yPosition = 20;
  addSectionHeader('15. Troubleshooting', 1);
  
  addSectionHeader('15.1 Login Issues', 2);
  
  addWrappedText('Problem: Cannot login to Admin Portal');
  addBulletPoint('Solution: Verify you are using admin login page, not employee portal');
  addBulletPoint('Solution: Check email and password are correct');
  addBulletPoint('Solution: Ensure caps lock is off');
  addBulletPoint('Solution: Contact administrator for password reset');

  addWrappedText('Problem: Cannot login to Employee Portal');
  addBulletPoint('Solution: Use email registered in employee record');
  addBulletPoint('Solution: Try default password: 123456');
  addBulletPoint('Solution: Contact HR if password was changed');

  addSectionHeader('15.2 Permission Errors', 2);
  
  addWrappedText('Problem: "Permission Denied" or "Access Restricted" message');
  addBulletPoint('Solution: Contact system administrator');
  addBulletPoint('Solution: Request specific permissions needed for your role');
  addBulletPoint('Solution: Verify you are logged in as correct user');

  addWrappedText('Problem: Cannot create/edit/delete records');
  addBulletPoint('Solution: Check if you have specific action permission (create/edit/delete)');
  addBulletPoint('Solution: Page access alone doesn\'t grant action permissions');
  addBulletPoint('Solution: Administrator needs to grant granular permissions');

  addWrappedText('Problem: Cannot see certain branches');
  addBulletPoint('Solution: Branch access may be restricted for your user');
  addBulletPoint('Solution: Contact administrator to add branch access');
  addBulletPoint('Solution: Admin users automatically see all branches');

  addSectionHeader('15.3 Data Entry Errors', 2);
  
  addWrappedText('Problem: "Email already exists" error');
  addBulletPoint('Solution: Each employee must have unique email');
  addBulletPoint('Solution: Check if employee already exists in system');
  addBulletPoint('Solution: Use different email address or update existing employee');

  addWrappedText('Problem: Cannot save employee/client record');
  addBulletPoint('Solution: Check all required fields are filled (marked with *)');
  addBulletPoint('Solution: Verify email format is valid');
  addBulletPoint('Solution: Ensure employee code is unique');
  addBulletPoint('Solution: Check branch is selected');

  addWrappedText('Problem: Dates not saving correctly');
  addBulletPoint('Solution: Use date picker instead of manual entry');
  addBulletPoint('Solution: Ensure end date is after start date');
  addBulletPoint('Solution: Check date format matches system requirements');

  addSectionHeader('15.4 Import/Export Issues', 2);
  
  addWrappedText('Problem: Import file rejected or fails');
  addBulletPoint('Solution: Use official template file');
  addBulletPoint('Solution: Ensure all required columns are present');
  addBulletPoint('Solution: Check data types match expectations (dates, numbers)');
  addBulletPoint('Solution: Remove empty rows at end of file');
  addBulletPoint('Solution: Save as CSV or XLSX format');

  addWrappedText('Problem: Some records fail to import');
  addBulletPoint('Solution: Review error messages for specific rows');
  addBulletPoint('Solution: Check for duplicate emails or employee codes');
  addBulletPoint('Solution: Verify required fields have values');
  addBulletPoint('Solution: Correct errors and re-import failed rows');

  addSectionHeader('15.5 Document and Compliance Issues', 2);
  
  addWrappedText('Problem: Document status not updating');
  addBulletPoint('Solution: Check expiry date is entered correctly');
  addBulletPoint('Solution: Status auto-calculates based on expiry date');
  addBulletPoint('Solution: Refresh page to see updated status');

  addWrappedText('Problem: Compliance not showing as complete');
  addBulletPoint('Solution: Verify status is set to "Completed" or "Compliant"');
  addBulletPoint('Solution: Check all required fields are filled');
  addBulletPoint('Solution: Ensure within correct compliance period dates');
  addBulletPoint('Solution: Verify employee is assigned to the period');

  addSectionHeader('15.6 Leave Request Issues', 2);
  
  addWrappedText('Problem: Cannot create leave request');
  addBulletPoint('Solution: Verify employee has sufficient leave balance');
  addBulletPoint('Solution: Check dates don\'t overlap with existing approved leave');
  addBulletPoint('Solution: Ensure start date is not in the past');
  addBulletPoint('Solution: Confirm you have "create" permission for leaves');

  addWrappedText('Problem: Leave balance incorrect');
  addBulletPoint('Solution: Check employee leave allowance in profile');
  addBulletPoint('Solution: Review all approved leaves deducting from balance');
  addBulletPoint('Solution: Verify working hours for pro-rata calculations');
  addBulletPoint('Solution: Contact administrator to recalculate balance');

  addSectionHeader('15.7 Report Generation Issues', 2);
  
  addWrappedText('Problem: Report shows no data');
  addBulletPoint('Solution: Check date range includes relevant records');
  addBulletPoint('Solution: Verify branch filter includes correct branches');
  addBulletPoint('Solution: Ensure you have access to selected branches');
  addBulletPoint('Solution: Check if records exist for selected criteria');

  addWrappedText('Problem: Cannot export report');
  addBulletPoint('Solution: Verify you have "export" permission');
  addBulletPoint('Solution: Check browser allows downloads');
  addBulletPoint('Solution: Try different export format');
  addBulletPoint('Solution: Generate report first, then export');

  addSectionHeader('15.8 General Troubleshooting Steps', 2);
  addWrappedText('When experiencing any issue:');
  addNumberedStep(1, 'Refresh the page (F5 or Ctrl+R).');
  addNumberedStep(2, 'Clear browser cache and cookies.');
  addNumberedStep(3, 'Try different web browser.');
  addNumberedStep(4, 'Check internet connection.');
  addNumberedStep(5, 'Log out and log back in.');
  addNumberedStep(6, 'Check with other users if issue is widespread.');
  addNumberedStep(7, 'Contact system administrator with:');
  addBulletPoint('Exact error message', 10);
  addBulletPoint('What you were trying to do', 10);
  addBulletPoint('Steps to reproduce the issue', 10);
  addBulletPoint('Screenshot if possible', 10);

  // Section 16: Quick Reference Guide
  doc.addPage();
  yPosition = 20;
  addSectionHeader('16. Quick Reference Guide', 1);
  
  addSectionHeader('16.1 Common Actions', 2);
  addWrappedText('Quick guide to frequently performed tasks:');
  
  addInfoBox('Add Employee', 'Employees > Add Employee > Fill form > Save', [52, 152, 219]);
  addInfoBox('Reset Employee Password', 'Employees > Select employee > Reset Password', [52, 152, 219]);
  addInfoBox('Approve Leave', 'Leaves > Find request > Approve button > Confirm', [52, 152, 219]);
  addInfoBox('Add Document', 'Documents > Add Document > Select employee and type > Enter details > Save', [52, 152, 219]);
  addInfoBox('Create Compliance Period', 'Compliance > Select type > Add Period > Set dates and assign employees > Save', [52, 152, 219]);
  addInfoBox('Generate Report', 'Reports > Select type > Set filters > Generate > Export if needed', [52, 152, 219]);

  addSectionHeader('16.2 Status Badge Reference', 2);
  addWrappedText('Understanding status indicators throughout the system:');
  
  addWrappedText('Leave Status:');
  addBulletPoint('Yellow badge - Pending approval');
  addBulletPoint('Green badge - Approved');
  addBulletPoint('Red badge - Rejected');
  
  addWrappedText('Document Status:');
  addBulletPoint('Green - Valid (30+ days until expiry)');
  addBulletPoint('Orange - Expiring Soon (within 30 days)');
  addBulletPoint('Red - Expired');
  
  addWrappedText('Compliance Status:');
  addBulletPoint('Green - Completed/Compliant');
  addBulletPoint('Orange - In Progress');
  addBulletPoint('Red - Not Started/Overdue');
  
  addWrappedText('Application Status:');
  addBulletPoint('Blue - New');
  addBulletPoint('Yellow - In Review');
  addBulletPoint('Purple - Interview Scheduled');
  addBulletPoint('Green - Accepted');
  addBulletPoint('Red - Rejected');

  addSectionHeader('16.3 Default Values', 2);
  addBulletPoint('Default Employee Password: 123456');
  addBulletPoint('Default Admin Password: Set during first setup');
  addBulletPoint('Document Expiry Warning: 30 days');
  addBulletPoint('Leave Request Status: Pending (requires approval)');

  addSectionHeader('16.4 Field Validations', 2);
  addWrappedText('Common field requirements:');
  addBulletPoint('Email: Must be valid format and unique per employee');
  addBulletPoint('Employee Code: Required and must be unique');
  addBulletPoint('Dates: End date must be after start date');
  addBulletPoint('Branch: Required for employees and clients');
  addBulletPoint('Phone: Should include country code for international');

  addSectionHeader('16.5 Permission Matrix Summary', 2);
  addWrappedText('Quick reference for common permission patterns:');
  
  checkNewPage(80);
  doc.setFontSize(10);
  doc.text('Module', margin + 5, yPosition);
  doc.text('View', margin + 50, yPosition);
  doc.text('Create', margin + 75, yPosition);
  doc.text('Edit', margin + 100, yPosition);
  doc.text('Delete', margin + 125, yPosition);
  doc.text('Special', margin + 150, yPosition);
  yPosition += 8;
  
  doc.line(margin, yPosition, margin + maxWidth, yPosition);
  yPosition += 5;
  
  const permissionData = [
    ['Employees', '✓', '✓', '✓', '✓', 'Bulk Ops'],
    ['Clients', '✓', '✓', '✓', '✓', 'Bulk Ops'],
    ['Leaves', '✓', '✓', '✓', '✓', 'Approve'],
    ['Documents', '✓', '✓', '✓', '✓', 'Upload'],
    ['Doc Signing', '✓', '✓', '✓', '✓', 'Sign'],
    ['Compliance', '✓', '✓', '✓', '✓', '-'],
    ['Reports', '✓', '-', '-', '-', 'Generate, Export'],
    ['Job Apps', '✓', '-', '✓', '✓', 'Download PDF'],
    ['Settings', '✓', '✓', '-', '-', '-'],
    ['User Mgmt', '✓', '✓', '✓', '✓', 'Admin Only']
  ];
  
  permissionData.forEach(row => {
    checkNewPage();
    doc.text(row[0], margin + 5, yPosition);
    doc.text(row[1], margin + 50, yPosition);
    doc.text(row[2], margin + 75, yPosition);
    doc.text(row[3], margin + 100, yPosition);
    doc.text(row[4], margin + 125, yPosition);
    doc.text(row[5], margin + 150, yPosition);
    yPosition += 6;
  });
  
  yPosition += 10;

  addSectionHeader('16.6 Contact Information', 2);
  addWrappedText('For technical support or questions about this guide:');
  addBulletPoint('Contact your system administrator');
  addBulletPoint('Refer to in-app help documentation');
  addBulletPoint('Check system announcements for updates');

  // Final page
  doc.addPage();
  yPosition = pageHeight / 2 - 40;
  
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, yPosition - 10, maxWidth, 60, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Thank You', pageWidth / 2, yPosition + 10, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('For using the HR Management System', pageWidth / 2, yPosition + 25, { align: 'center' });
  doc.text('This guide is regularly updated', pageWidth / 2, yPosition + 35, { align: 'center' });

  addPageNumber();

  return doc;
};
