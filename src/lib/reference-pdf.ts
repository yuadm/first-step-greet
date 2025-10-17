import jsPDF from 'jspdf';

interface ReferenceData {
  refereeFullName: string;
  refereeJobTitle?: string;
  
  // Employment reference specific
  employmentStatus?: string; // current, previous, or neither
  relationshipDescription?: string;
  jobTitle?: string;
  startDate?: string;
  endDate?: string;
  attendance?: string;
  leavingReason?: string;
  
  // Common checkbox qualities
  honestTrustworthy?: boolean;
  communicatesEffectively?: boolean;
  effectiveTeamMember?: boolean;
  respectfulConfidentiality?: boolean;
  reliablePunctual?: boolean;
  suitablePosition?: boolean;
  kindCompassionate?: boolean;
  worksIndependently?: boolean;
  
  // If any qualities not ticked
  qualitiesNotTickedReason?: string;
  
  // Criminal/legal questions
  convictionsKnown?: string;
  criminalProceedingsKnown?: string;
  criminalDetails?: string;
  
  // Final comments and signature
  additionalComments?: string;
  signatureDate?: string;
}

interface CompletedReference {
  id: string;
  reference_name: string;
  reference_type: string;
  form_data: ReferenceData;
  completed_at: string;
  created_at: string;
  sent_at: string;
  application_id: string;
}

interface CompanySettings {
  name: string;
  logo?: string;
}

export const generateReferencePDF = async (
  reference: CompletedReference,
  applicantName: string,
  applicantDOB: string,
  applicantPostcode: string,
  companySettings: CompanySettings = { name: 'Company Name' }
) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const lineHeight = 6;
  let yPosition = 20;

  // Define modern color palette
  const colors = {
    primary: [59, 130, 246], // Blue
    primaryLight: [219, 234, 254],
    text: [30, 41, 59],
    textLight: [100, 116, 139],
    border: [226, 232, 240],
    background: [248, 250, 252]
  };

  pdf.setFont('helvetica', 'normal');

  const ensureSpace = (needed: number) => {
    if (yPosition + needed > pageHeight - 20) {
      pdf.addPage();
      yPosition = 20;
    }
  };

  const addSectionBox = (title: string, emoji: string) => {
    ensureSpace(15);
    pdf.setFillColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
    pdf.rect(margin, yPosition - 2, pageWidth - 2 * margin, 10, 'F');
    pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${emoji} ${title}`, margin + 3, yPosition + 5);
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    yPosition += 12;
  };

  // Header section with company branding
  pdf.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
  pdf.rect(0, 0, pageWidth, 50, 'F');
  
  if (companySettings.logo) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = companySettings.logo!;
      });
      
      const maxWidth = 40;
      const maxHeight = 20;
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
      const logoWidth = img.width * scale;
      const logoHeight = img.height * scale;
      const logoX = (pageWidth / 2) - (logoWidth / 2);
      
      const format = companySettings.logo.toLowerCase().includes('.png') ? 'PNG' : 'JPEG';
      pdf.addImage(companySettings.logo, format, logoX, yPosition, logoWidth, logoHeight);
      yPosition += logoHeight + 5;
    } catch (error) {
      console.error('Error adding logo:', error);
    }
  }

  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(companySettings.name, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Title with underline
  pdf.setFontSize(16);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  const referenceType = reference.reference_type === 'employer' ? 'Employment Reference' : 'Character Reference';
  pdf.text(referenceType, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 2;
  pdf.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.setLineWidth(0.5);
  const titleWidth = pdf.getTextWidth(referenceType);
  pdf.line((pageWidth - titleWidth) / 2, yPosition, (pageWidth + titleWidth) / 2, yPosition);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  yPosition += 12;

  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10): number => {
    pdf.setFontSize(fontSize);
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * lineHeight);
  };

  const addLabelValue = (label: string, value: string, yPos: number, indent: number = margin) => {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    pdf.text(label, indent, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    const labelWidth = pdf.getTextWidth(label);
    pdf.text(value, indent + labelWidth + 2, yPos);
  };

  // Applicant Information Box
  addSectionBox('Reference For', '👤');
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 22, 2, 2, 'FD');
  
  const boxStartY = yPosition + 6;
  addLabelValue('Name:', applicantName, boxStartY, margin + 3);
  addLabelValue('Date of Birth:', applicantDOB, boxStartY + 7, margin + 3);
  addLabelValue('Postcode:', applicantPostcode, boxStartY + 14, margin + 3);
  yPosition += 28;

  // Referee Information Box
  addSectionBox('Your Information', '✍️');
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 15, 2, 2, 'FD');
  
  const refBoxStartY = yPosition + 6;
  addLabelValue('Referee Name:', reference.form_data.refereeFullName || 'Not provided', refBoxStartY, margin + 3);
  if (reference.form_data.refereeJobTitle) {
    addLabelValue('Job Title:', reference.form_data.refereeJobTitle, refBoxStartY + 7, margin + 3);
  }
  yPosition += 20;

  if (reference.reference_type === 'employer') {
    addSectionBox('Employment Details', '💼');
    
    // Employment Status
    ensureSpace(25);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    pdf.text('Are you this person\'s current or previous employer?', margin + 3, yPosition);
    yPosition += 7;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFillColor(255, 255, 255);
    const statusY = yPosition;
    ['current', 'previous', 'neither'].forEach((status, idx) => {
      const xPos = margin + 3 + (idx * 60);
      const isChecked = reference.form_data.employmentStatus === status;
      
      // Draw checkbox
      pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      pdf.rect(xPos, statusY - 3, 4, 4, isChecked ? 'FD' : 'D');
      if (isChecked) {
        pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        pdf.rect(xPos + 0.5, statusY - 2.5, 3, 3, 'F');
      }
      pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      pdf.text(status.charAt(0).toUpperCase() + status.slice(1), xPos + 6, statusY);
    });
    yPosition += 10;

    // Relationship & Job Title
    ensureSpace(30);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Relationship to person:', margin + 3, yPosition);
    yPosition += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
    pdf.roundedRect(margin + 3, yPosition - 4, pageWidth - 2 * margin - 6, 8, 1, 1, 'F');
    yPosition = addWrappedText(reference.form_data.relationshipDescription || 'Not provided', margin + 5, yPosition, pageWidth - 2 * margin - 10);
    yPosition += 8;

    addLabelValue('Job Title:', reference.form_data.jobTitle || 'Not provided', yPosition, margin + 3);
    yPosition += 10;

    // Employment Period
    ensureSpace(15);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Employment Period:', margin + 3, yPosition);
    yPosition += 6;
    const startDate = reference.form_data.startDate ? new Date(reference.form_data.startDate).toLocaleDateString() : 'Not provided';
    const endDate = reference.form_data.endDate ? new Date(reference.form_data.endDate).toLocaleDateString() : 'Not provided';
    pdf.setFont('helvetica', 'normal');
    pdf.text(`From ${startDate} to ${endDate}`, margin + 3, yPosition);
    yPosition += 10;

    // Attendance
    ensureSpace(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Recent attendance record:', margin + 3, yPosition);
    yPosition += 7;
    
    pdf.setFont('helvetica', 'normal');
    const attY = yPosition;
    ['good', 'average', 'poor'].forEach((att, idx) => {
      const xPos = margin + 3 + (idx * 55);
      const isChecked = reference.form_data.attendance === att;
      
      pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      pdf.rect(xPos, attY - 3, 4, 4, isChecked ? 'FD' : 'D');
      if (isChecked) {
        pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        pdf.rect(xPos + 0.5, attY - 2.5, 3, 3, 'F');
      }
      pdf.text(att.charAt(0).toUpperCase() + att.slice(1), xPos + 6, attY);
    });
    yPosition += 10;

    // Leaving Reason
    ensureSpace(30);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Reason for leaving:', margin + 3, yPosition);
    yPosition += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
    pdf.roundedRect(margin + 3, yPosition - 4, pageWidth - 2 * margin - 6, 12, 1, 1, 'F');
    yPosition = addWrappedText(reference.form_data.leavingReason || 'Not provided', margin + 5, yPosition, pageWidth - 2 * margin - 10);
    yPosition += 10;
  } else {
    addSectionBox('Character Reference Details', '💬');
    
    ensureSpace(40);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Relationship description:', margin + 3, yPosition);
    yPosition += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
    pdf.roundedRect(margin + 3, yPosition - 4, pageWidth - 2 * margin - 6, 15, 1, 1, 'F');
    yPosition = addWrappedText(reference.form_data.relationshipDescription || 'Not provided', margin + 5, yPosition, pageWidth - 2 * margin - 10);
    yPosition += 10;
  }

  // Character Qualities
  addSectionBox('Character Assessment', '⭐');
  ensureSpace(60);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('Which of the following describes this person?', margin + 3, yPosition);
  yPosition += 8;

  const qualities = [
    { key: 'honestTrustworthy', label: 'Honest and trustworthy' },
    { key: 'communicatesEffectively', label: 'Communicates effectively' },
    { key: 'effectiveTeamMember', label: 'An effective team member' },
    { key: 'respectfulConfidentiality', label: 'Respectful of confidentiality' },
    { key: 'reliablePunctual', label: 'Reliable and punctual' },
    { key: 'suitablePosition', label: 'Suitable for the position applied for' },
    { key: 'kindCompassionate', label: 'Kind and compassionate' },
    { key: 'worksIndependently', label: 'Works well independently' },
  ];

  pdf.setFont('helvetica', 'normal');
  const columnWidth = (pageWidth - 2 * margin - 6) / 2;
  
  for (let i = 0; i < qualities.length; i += 2) {
    ensureSpace(8);
    
    // Left column
    const leftQuality = qualities[i];
    const leftChecked = reference.form_data[leftQuality.key as keyof ReferenceData];
    const leftX = margin + 3;
    
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    pdf.rect(leftX, yPosition - 3, 4, 4, leftChecked ? 'FD' : 'D');
    if (leftChecked) {
      pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.rect(leftX + 0.5, yPosition - 2.5, 3, 3, 'F');
    }
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    pdf.text(leftQuality.label, leftX + 6, yPosition);
    
    // Right column
    if (i + 1 < qualities.length) {
      const rightQuality = qualities[i + 1];
      const rightChecked = reference.form_data[rightQuality.key as keyof ReferenceData];
      const rightX = margin + 3 + columnWidth;
      
      pdf.rect(rightX, yPosition - 3, 4, 4, rightChecked ? 'FD' : 'D');
      if (rightChecked) {
        pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        pdf.rect(rightX + 0.5, yPosition - 2.5, 3, 3, 'F');
      }
      pdf.text(rightQuality.label, rightX + 6, yPosition);
    }
    
    yPosition += 7;
  }

  // Qualities explanation
  if (reference.form_data.qualitiesNotTickedReason) {
    ensureSpace(25);
    yPosition += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Explanation for qualities not selected:', margin + 3, yPosition);
    yPosition += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
    pdf.roundedRect(margin + 3, yPosition - 4, pageWidth - 2 * margin - 6, 10, 1, 1, 'F');
    yPosition = addWrappedText(reference.form_data.qualitiesNotTickedReason, margin + 5, yPosition, pageWidth - 2 * margin - 10);
    yPosition += 8;
  } else {
    yPosition += 8;
  }

  // Criminal Background Section
  addSectionBox('Criminal Background Check', '🔒');
  ensureSpace(100);
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  yPosition = addWrappedText('The position involves working with vulnerable people. Are you aware of any convictions, cautions, reprimands or final warnings that the person may have received that are not \'protected\' as defined by the Rehabilitation of Offenders Act 1974 (Exceptions) Order 1975 (as amended in 2013)?', margin + 3, yPosition, pageWidth - 2 * margin - 6, 9);
  yPosition += 5;
  
  const convY = yPosition;
  ['yes', 'no'].forEach((opt, idx) => {
    const xPos = margin + 3 + (idx * 40);
    const isChecked = reference.form_data.convictionsKnown === opt;
    
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    pdf.rect(xPos, convY - 3, 4, 4, isChecked ? 'FD' : 'D');
    if (isChecked) {
      pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.rect(xPos + 0.5, convY - 2.5, 3, 3, 'F');
    }
    pdf.setFontSize(10);
    pdf.text(opt.toUpperCase(), xPos + 6, convY);
  });
  yPosition += 12;

  ensureSpace(50);
  pdf.setFontSize(9);
  yPosition = addWrappedText('To your knowledge, is this person currently the subject of any criminal proceedings or police investigation?', margin + 3, yPosition, pageWidth - 2 * margin - 6, 9);
  yPosition += 5;
  
  const procY = yPosition;
  ['yes', 'no'].forEach((opt, idx) => {
    const xPos = margin + 3 + (idx * 40);
    const isChecked = reference.form_data.criminalProceedingsKnown === opt;
    
    pdf.rect(xPos, procY - 3, 4, 4, isChecked ? 'FD' : 'D');
    if (isChecked) {
      pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.rect(xPos + 0.5, procY - 2.5, 3, 3, 'F');
    }
    pdf.setFontSize(10);
    pdf.text(opt.toUpperCase(), xPos + 6, procY);
  });
  yPosition += 12;

  if (reference.form_data.criminalDetails) {
    ensureSpace(30);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Details:', margin + 3, yPosition);
    yPosition += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
    pdf.roundedRect(margin + 3, yPosition - 4, pageWidth - 2 * margin - 6, 12, 1, 1, 'F');
    yPosition = addWrappedText(reference.form_data.criminalDetails, margin + 5, yPosition, pageWidth - 2 * margin - 10);
    yPosition += 10;
  }

  // Additional Comments
  if (reference.form_data.additionalComments) {
    addSectionBox('Additional Comments', '💬');
    ensureSpace(30);
    pdf.setFont('helvetica', 'normal');
    pdf.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
    pdf.roundedRect(margin + 3, yPosition - 4, pageWidth - 2 * margin - 6, 15, 1, 1, 'F');
    yPosition = addWrappedText(reference.form_data.additionalComments, margin + 5, yPosition, pageWidth - 2 * margin - 10);
    yPosition += 12;
  }

  // Declaration
  addSectionBox('Declaration', '✓');
  ensureSpace(35);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  const declarationText = 'I certify that, to the best of my knowledge, the information I have given is true and complete. I understand that any deliberate omission, falsification or misrepresentation may lead to refusal of appointment or dismissal.';
  pdf.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
  pdf.roundedRect(margin + 3, yPosition - 4, pageWidth - 2 * margin - 6, 18, 1, 1, 'F');
  yPosition = addWrappedText(declarationText, margin + 5, yPosition, pageWidth - 2 * margin - 10, 9);
  yPosition += 12;

  // Submission Information
  addSectionBox('Submission Details', '📅');
  ensureSpace(40);
  
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 28, 2, 2, 'FD');
  
  const infoY = yPosition + 6;
  addLabelValue('Referee:', reference.form_data.refereeFullName || 'Not provided', infoY, margin + 3);
  addLabelValue('Job Title:', reference.form_data.refereeJobTitle || 'Not provided', infoY + 7, margin + 3);
  addLabelValue('Created:', new Date(reference.created_at).toLocaleDateString(), infoY + 14, margin + 3);
  addLabelValue('Completed:', new Date(reference.completed_at).toLocaleDateString(), infoY + 21, margin + 3);
  yPosition += 35;

  return pdf;
};

export interface ManualReferenceInput {
  applicantName: string;
  applicantPosition?: string;
  referenceType: 'employer' | 'character';
  applicantDOB?: string;
  applicantPostcode?: string;
  employmentFrom?: string;
  employmentTo?: string;
  reasonForLeaving?: string;
  employmentStatus?: 'current' | 'previous' | 'neither';
  referenceNumber?: number;
  referee: {
    name?: string;
    company?: string;
    jobTitle?: string;
    email?: string;
    phone?: string;
    address?: string;
    town?: string;
    postcode?: string;
  };
}

export const generateManualReferencePDF = async (
  data: ManualReferenceInput,
  companySettings: CompanySettings = { name: 'Company Name' }
) => {
  const pdf = new jsPDF();
  
  // Use same modern styling as generateReferencePDF
  const colors = {
    primary: [59, 130, 246],
    primaryLight: [219, 234, 254],
    text: [30, 41, 59],
    textLight: [100, 116, 139],
    border: [226, 232, 240],
    background: [248, 250, 252]
  };
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15; // Content margin inside border
  const lineHeight = 7;
  let yPosition = 25; // Start closer to border

  // Set font to support Unicode characters
  pdf.setFont('helvetica', 'normal');

  // Add page border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Add company logo if available
  if (companySettings.logo) {
    try {
      // Create a temporary image to get dimensions
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = companySettings.logo!;
      });
      
      // Calculate scaling to maintain aspect ratio
      const maxWidth = 50;
      const maxHeight = 25;
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
      const logoWidth = img.width * scale;
      const logoHeight = img.height * scale;
      const logoX = (pageWidth / 2) - (logoWidth / 2);
      
      // Determine image type and add to PDF
      const format = companySettings.logo.toLowerCase().includes('.png') ? 'PNG' : 'JPEG';
      pdf.addImage(companySettings.logo, format, logoX, yPosition - 5, logoWidth, logoHeight);
      yPosition += logoHeight + 10;
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
      // If logo fails, just add some spacing
      yPosition += 5;
    }
  }

  // Add company name
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(companySettings.name, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 12;

  // Helper function to add text with word wrap
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 11): number => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * lineHeight);
  };

  // Helper function to ensure space on page
  const ensureSpace = (needed: number) => {
    if (yPosition + needed > pageHeight - 25) { // Account for border
      pdf.addPage();
      // Add border to new page
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);
      yPosition = 25; // Start closer to border on new page
    }
  };

  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  const referenceTitle = data.referenceType === 'employer' ? 'Employment reference for' : 'Character reference for';
  pdf.text(referenceTitle, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 12;

  // Basic Information - Horizontal Layout
  pdf.setFontSize(12);
  
  // Name
  pdf.setFont('helvetica', 'bold');
  pdf.text('Name:', margin, yPosition);
  const nameLabelWidth = pdf.getTextWidth('Name:');
  pdf.setFont('helvetica', 'normal');
  pdf.text(` ${data.applicantName}`, margin + nameLabelWidth, yPosition);
  const nameWidth = pdf.getTextWidth(`Name: ${data.applicantName}`);
  
  // Date of Birth
  pdf.setFont('helvetica', 'bold');
  pdf.text('Date of Birth:', margin + nameWidth + 20, yPosition);
  const dobLabelWidth = pdf.getTextWidth('Date of Birth:');
  pdf.setFont('helvetica', 'normal');
  pdf.text(` ${data.applicantDOB || ''}`, margin + nameWidth + 20 + dobLabelWidth, yPosition);
  const dobWidth = pdf.getTextWidth(`Date of Birth: ${data.applicantDOB || ''}`);
  
  // Postcode
  pdf.setFont('helvetica', 'bold');
  pdf.text('Postcode:', margin + nameWidth + dobWidth + 40, yPosition);
  const postcodeLabelWidth = pdf.getTextWidth('Postcode:');
  pdf.setFont('helvetica', 'normal');
  pdf.text(` ${data.applicantPostcode || ''}`, margin + nameWidth + dobWidth + 40 + postcodeLabelWidth, yPosition);
  yPosition += 15;

  // Referee Information
  pdf.setFont('helvetica', 'bold');
  pdf.text('Referee Name:', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.referee.name || '', margin + 70, yPosition);
  
  if (data.referee.jobTitle) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Job Title:', margin + 200, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(data.referee.jobTitle, margin + 250, yPosition);
  }
  yPosition += 15;

  // Reference specific content
  ensureSpace(60);
  if (data.referenceType === 'employer') {
    // Employment Status with proper checkboxes
    pdf.setFont('helvetica', 'bold');
    pdf.text('Are you this person\'s current or previous employer?', margin, yPosition);
    yPosition += lineHeight;
    pdf.setFont('helvetica', 'normal');
    
    const currentCheck = data.employmentStatus === 'current' ? '[X]' : '[ ]';
    const previousCheck = data.employmentStatus === 'previous' ? '[X]' : '[ ]';
    const neitherCheck = data.employmentStatus === 'neither' ? '[X]' : '[ ]';
    pdf.text(`${currentCheck} Current    ${previousCheck} Previous    ${neitherCheck} Neither`, margin, yPosition);
    yPosition += lineHeight + 2;

    // Relationship Description - prefill with Referee Job Title
    ensureSpace(25);
    pdf.setFont('helvetica', 'bold');
    pdf.text('What is your relationship to this person (e.g. "I am her/his manager")?', margin, yPosition);
    yPosition += lineHeight;
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(`${data.referee.jobTitle || ''}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 2;

    // Job Title
    ensureSpace(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Please state the person\'s job title:', margin, yPosition);
    yPosition += lineHeight;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${data.applicantPosition || ''}`, margin, yPosition);
    yPosition += lineHeight + 2;

    // Employment Dates
    ensureSpace(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Employment Period:', margin, yPosition);
    yPosition += lineHeight;
    pdf.setFont('helvetica', 'normal');
    const startDate = data.employmentFrom || '';
    const endDate = data.employmentTo || '';
    pdf.text(`From ${startDate} to ${endDate}`, margin, yPosition);
    yPosition += lineHeight + 2;

    // Attendance - leave unchecked
    ensureSpace(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('How would you describe their recent attendance record?', margin, yPosition);
    yPosition += lineHeight;
    pdf.setFont('helvetica', 'normal');
    pdf.text('[X] Good    [ ] Average    [ ] Poor', margin, yPosition);
    yPosition += lineHeight + 2;

    // Leaving Reason
    ensureSpace(30);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Why did the person leave your employment (if they are still employed, please write \'still employed\')?', margin, yPosition);
    yPosition += lineHeight;
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(`${data.reasonForLeaving || ''}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 2;
  } else {
    // Character reference specific content
    ensureSpace(40);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Do you know this person from outside employment or education?', margin, yPosition);
    yPosition += lineHeight;
    pdf.setFont('helvetica', 'normal');
    pdf.text('[X] Yes    [ ] No', margin, yPosition);
    yPosition += lineHeight + 5;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Please describe your relationship with this person, including how long you have known them:', margin, yPosition);
    yPosition += lineHeight;
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText('', margin, yPosition, pageWidth - 2 * margin);
    yPosition += 5;
  }

  // Character qualities - Horizontal layout in 2 columns
  ensureSpace(60);
  pdf.setFont('helvetica', 'bold');
  pdf.text('In your opinion, which of the following describes this person (tick each that is true)?', margin, yPosition);
  yPosition += lineHeight + 3;

  const qualities = [
    'Honest and trustworthy',
    'Communicates effectively',
    'An effective team member',
    'Respectful of confidentiality',
    'Reliable and punctual',
    'Suitable for the position applied for',
    'Kind and compassionate',
    'Able to work well without close supervision',
  ];

  pdf.setFont('helvetica', 'normal');
  
  // Display qualities in 2 columns - leave unchecked by default
  const columnWidth = (pageWidth - 2 * margin) / 2;
  for (let i = 0; i < qualities.length; i += 2) {
    ensureSpace(8);
    
    // Left column quality - preselected
    pdf.text('[X]', margin, yPosition);
    pdf.text(qualities[i], margin + 15, yPosition);
    
    // Right column quality (if exists) - preselected
    if (i + 1 < qualities.length) {
      const rightStartX = margin + columnWidth;
      pdf.text('[X]', rightStartX, yPosition);
      pdf.text(qualities[i + 1], rightStartX + 15, yPosition);
    }
    
    yPosition += lineHeight;
  }

  // Qualities not ticked reason
  ensureSpace(30);
  yPosition += 3;
  pdf.setFont('helvetica', 'bold');
  pdf.text('If you did not tick one or more of the above, please tell us why here:', margin, yPosition);
  yPosition += lineHeight;
  pdf.setFont('helvetica', 'normal');
  yPosition = addWrappedText('Not provided', margin, yPosition, pageWidth - 2 * margin);
  yPosition += 5;

  // Criminal background questions - CRITICAL SECTION
  ensureSpace(100);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('CRIMINAL BACKGROUND CHECK', margin, yPosition);
  yPosition += lineHeight + 3;
  
  pdf.setFontSize(11);
  yPosition = addWrappedText('The position this person has applied for involves working with vulnerable people. Are you aware of any convictions, cautions, reprimands or final warnings that the person may have received that are not \'protected\' as defined by the Rehabilitation of Offenders Act 1974 (Exceptions) Order 1975 (as amended in 2013 by SI 210 1198)?', margin, yPosition, pageWidth - 2 * margin, 11);
  yPosition += 3;
  pdf.setFont('helvetica', 'normal');
  pdf.text('[ ] Yes    [X] No', margin, yPosition);
  yPosition += lineHeight + 8;

  ensureSpace(50);
  pdf.setFont('helvetica', 'bold');
  yPosition = addWrappedText('To your knowledge, is this person currently the subject of any criminal proceedings (for example, charged or summoned but not yet dealt with) or any police investigation?', margin, yPosition, pageWidth - 2 * margin, 11);
  yPosition += 3;
  pdf.setFont('helvetica', 'normal');
  pdf.text('[ ] Yes    [X] No', margin, yPosition);
  yPosition += lineHeight + 8;

  // Additional Comments
  ensureSpace(40);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Any additional comments you would like to make about this person:', margin, yPosition);
  yPosition += lineHeight;
  pdf.setFont('helvetica', 'normal');
  yPosition = addWrappedText('Not provided', margin, yPosition, pageWidth - 2 * margin);
  yPosition += 10;

  // Declaration and Date
  ensureSpace(30);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DECLARATION', margin, yPosition);
  yPosition += lineHeight + 3;
  pdf.setFont('helvetica', 'normal');
  const declarationText = 'I certify that, to the best of my knowledge, the information I have given is true and complete. I understand that any deliberate omission, falsification or misrepresentation may lead to refusal of appointment or dismissal.';
  yPosition = addWrappedText(declarationText, margin, yPosition, pageWidth - 2 * margin);
  yPosition += 8;

  // Referee Information
  ensureSpace(70);
  pdf.setFont('helvetica', 'bold');
  pdf.text('REFEREE INFORMATION', margin, yPosition);
  yPosition += lineHeight + 3;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Referee Name:', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.referee.name || '', margin + 110, yPosition);
  yPosition += lineHeight;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Referee Job Title:', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.referee.jobTitle || '', margin + 110, yPosition);
  yPosition += lineHeight;

  const createdKey = `{R${data.referenceNumber || 1}_Created}`;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Reference Created:', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(createdKey, margin + 110, yPosition);
  yPosition += lineHeight;

  const signatureKey = `{R${data.referenceNumber || 1}_Signed}`;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Reference Sent:', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(signatureKey, margin + 110, yPosition);
  yPosition += lineHeight;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Reference Completed:', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(signatureKey, margin + 110, yPosition);
  yPosition += lineHeight + 5;

  return pdf;
};