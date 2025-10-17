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
  const margin = 20;
  const lineHeight = 6;
  let yPosition = 20;

  // Define professional colors (HSL values)
  const primaryColor = { r: 59, g: 130, b: 246 }; // Blue
  const accentColor = { r: 99, g: 102, b: 241 }; // Indigo
  const textGray = { r: 75, g: 85, b: 99 };
  const lightGray = { r: 243, g: 244, b: 246 };

  // Set font
  pdf.setFont('helvetica', 'normal');

  // Add modern header bar
  pdf.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  pdf.rect(0, 0, pageWidth, 15, 'F');
  
  // Add decorative accent line
  pdf.setFillColor(accentColor.r, accentColor.g, accentColor.b);
  pdf.rect(0, 15, pageWidth, 2, 'F');

  // Helper function to ensure space on page
  const ensureSpace = (needed: number) => {
    if (yPosition + needed > pageHeight - 20) {
      pdf.addPage();
      // Add header to new page
      pdf.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
      pdf.rect(0, 0, pageWidth, 15, 'F');
      pdf.setFillColor(accentColor.r, accentColor.g, accentColor.b);
      pdf.rect(0, 15, pageWidth, 2, 'F');
      yPosition = 25;
    }
  };

  // Helper function for section headers
  const addSectionHeader = (title: string) => {
    ensureSpace(15);
    pdf.setFillColor(lightGray.r, lightGray.g, lightGray.b);
    pdf.rect(margin - 5, yPosition - 3, pageWidth - 2 * (margin - 5), 10, 'F');
    pdf.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(title, margin, yPosition + 4);
    pdf.setTextColor(0, 0, 0);
    yPosition += 12;
  };

  yPosition = 30;
  
  // Add company logo if available
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
      const logoX = margin;
      
      const format = companySettings.logo.toLowerCase().includes('.png') ? 'PNG' : 'JPEG';
      pdf.addImage(companySettings.logo, format, logoX, yPosition, logoWidth, logoHeight);
      yPosition = Math.max(yPosition + logoHeight + 5, yPosition + 15);
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
    }
  }

  // Add company name
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textGray.r, textGray.g, textGray.b);
  pdf.text(companySettings.name, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Helper function to add text with word wrap
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 11): number => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * lineHeight);
  };

  // Title with decorative background
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  const referenceType = reference.reference_type === 'employer' ? 'Employment Reference' : 'Character Reference';
  pdf.text(referenceType, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;
  
  pdf.setTextColor(0, 0, 0);

  // Applicant Information Card
  addSectionHeader('APPLICANT INFORMATION');
  pdf.setFontSize(10);
  
  const infoStartY = yPosition;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Name:', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(applicantName, margin + 35, yPosition);
  yPosition += 7;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Date of Birth:', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(applicantDOB, margin + 35, yPosition);
  yPosition += 7;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Postcode:', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(applicantPostcode, margin + 35, yPosition);
  yPosition += 10;

  // Referee Information
  addSectionHeader('REFEREE INFORMATION');
  pdf.setFontSize(10);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Name:', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(reference.form_data.refereeFullName || 'Not provided', margin + 35, yPosition);
  yPosition += 7;
  
  if (reference.form_data.refereeJobTitle) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Job Title:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(reference.form_data.refereeJobTitle, margin + 35, yPosition);
    yPosition += 7;
  }
  yPosition += 5;

  // Reference specific content
  if (reference.reference_type === 'employer') {
    addSectionHeader('EMPLOYMENT DETAILS');
    pdf.setFontSize(10);
    
    // Employment Status
    pdf.setFont('helvetica', 'bold');
    pdf.text('Employment Status:', margin, yPosition);
    yPosition += 6;
    pdf.setFont('helvetica', 'normal');
    const currentBox = reference.form_data.employmentStatus === 'current' ? '☑' : '☐';
    const previousBox = reference.form_data.employmentStatus === 'previous' ? '☑' : '☐';
    const neitherBox = reference.form_data.employmentStatus === 'neither' ? '☑' : '☐';
    pdf.text(`${currentBox} Current    ${previousBox} Previous    ${neitherBox} Neither`, margin + 5, yPosition);
    yPosition += 8;

    // Relationship Description
    ensureSpace(25);
    pdf.setFont('helvetica', 'bold');
    pdf.text('What is your relationship to this person (e.g. "I am her/his manager")?', margin, yPosition);
    yPosition += lineHeight;
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(`${reference.form_data.relationshipDescription || 'Not provided'}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 2;

    // Job Title
    ensureSpace(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Please state the person\'s job title:', margin, yPosition);
    yPosition += lineHeight;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${reference.form_data.jobTitle || 'Not provided'}`, margin, yPosition);
    yPosition += lineHeight + 2;

    // Employment Dates
    ensureSpace(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Employment Period:', margin, yPosition);
    yPosition += lineHeight;
    pdf.setFont('helvetica', 'normal');
    const startDate = reference.form_data.startDate ? new Date(reference.form_data.startDate).toLocaleDateString() : 'Not provided';
    const endDate = reference.form_data.endDate ? new Date(reference.form_data.endDate).toLocaleDateString() : 'Not provided';
    pdf.text(`From ${startDate} to ${endDate}`, margin, yPosition);
    yPosition += lineHeight + 2;

    // Attendance
    ensureSpace(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('How would you describe their recent attendance record?', margin, yPosition);
    yPosition += lineHeight;
    pdf.setFont('helvetica', 'normal');
    const goodBox = reference.form_data.attendance === 'good' ? '[X]' : '[ ]';
    const averageBox = reference.form_data.attendance === 'average' ? '[X]' : '[ ]';
    const poorBox = reference.form_data.attendance === 'poor' ? '[X]' : '[ ]';
    pdf.text(`${goodBox} Good    ${averageBox} Average    ${poorBox} Poor`, margin, yPosition);
    yPosition += lineHeight + 2;

    // Leaving Reason
    ensureSpace(30);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Why did the person leave your employment (if they are still employed, please write \'still employed\')?', margin, yPosition);
    yPosition += lineHeight;
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(`${reference.form_data.leavingReason || 'Not provided'}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 2;
  } else {
    // Character reference specific content
    addSectionHeader('CHARACTER REFERENCE DETAILS');
    pdf.setFontSize(10);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Known from outside employment/education:', margin, yPosition);
    yPosition += 6;
    pdf.setFont('helvetica', 'normal');
    const outsideYesBox = reference.form_data.employmentStatus === 'yes' ? '☑' : '☐';
    const outsideNoBox = reference.form_data.employmentStatus === 'no' ? '☐' : '☐';
    pdf.text(`${outsideYesBox} Yes    ${outsideNoBox} No`, margin + 5, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Relationship Description:', margin, yPosition);
    yPosition += 6;
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(`${reference.form_data.relationshipDescription || 'Not provided'}`, margin + 5, yPosition, pageWidth - 2 * margin - 5, 10);
    yPosition += 8;
  }

  // Character qualities
  addSectionHeader('CHARACTER ASSESSMENT');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Please indicate which of the following describes this person:', margin, yPosition);
  yPosition += 8;

  const qualities = [
    { key: 'honestTrustworthy', label: 'Honest and trustworthy' },
    { key: 'communicatesEffectively', label: 'Communicates effectively' },
    { key: 'effectiveTeamMember', label: 'An effective team member' },
    { key: 'respectfulConfidentiality', label: 'Respectful of confidentiality' },
    { key: 'reliablePunctual', label: 'Reliable and punctual' },
    { key: 'suitablePosition', label: 'Suitable for the position applied for' },
    { key: 'kindCompassionate', label: 'Kind and compassionate' },
    { key: 'worksIndependently', label: 'Able to work well without close supervision' },
  ];

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  // Display qualities in 2 columns with better styling
  const columnWidth = (pageWidth - 2 * margin) / 2;
  for (let i = 0; i < qualities.length; i += 2) {
    ensureSpace(7);
    
    // Left column quality
    const leftQuality = qualities[i];
    const leftChecked = reference.form_data[leftQuality.key as keyof ReferenceData];
    const leftCheckbox = leftChecked ? '☑' : '☐';
    pdf.text(leftCheckbox, margin + 5, yPosition);
    pdf.text(leftQuality.label, margin + 12, yPosition);
    
    // Right column quality (if exists)
    if (i + 1 < qualities.length) {
      const rightQuality = qualities[i + 1];
      const rightChecked = reference.form_data[rightQuality.key as keyof ReferenceData];
      const rightCheckbox = rightChecked ? '☑' : '☐';
      const rightStartX = margin + columnWidth;
      pdf.text(rightCheckbox, rightStartX, yPosition);
      pdf.text(rightQuality.label, rightStartX + 7, yPosition);
    }
    
    yPosition += 6;
  }
  
  pdf.setFontSize(10);

  // Qualities not ticked reason
  ensureSpace(30);
  yPosition += 3;
  pdf.setFont('helvetica', 'bold');
  pdf.text('If you did not tick one or more of the above, please tell us why here:', margin, yPosition);
  yPosition += lineHeight;
  pdf.setFont('helvetica', 'normal');
  yPosition = addWrappedText(`${reference.form_data.qualitiesNotTickedReason || 'Not provided'}`, margin, yPosition, pageWidth - 2 * margin);
  yPosition += 5;

  // Criminal background questions
  addSectionHeader('CRIMINAL BACKGROUND CHECK');
  pdf.setFontSize(10);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Question 1:', margin, yPosition);
  yPosition += 6;
  pdf.setFont('helvetica', 'normal');
  yPosition = addWrappedText('Are you aware of any convictions, cautions, reprimands or final warnings that the person may have received that are not \'protected\' as defined by the Rehabilitation of Offenders Act 1974?', margin + 5, yPosition, pageWidth - 2 * margin - 5, 9);
  yPosition += 3;
  const convictionsYesBox = reference.form_data.convictionsKnown === 'yes' ? '☑' : '☐';
  const convictionsNoBox = reference.form_data.convictionsKnown === 'no' ? '☑' : '☐';
  const convictionsAnswer = reference.form_data.convictionsKnown ? `${convictionsYesBox} Yes    ${convictionsNoBox} No` : 'Not answered';
  pdf.text(convictionsAnswer, margin + 5, yPosition);
  yPosition += 10;

  ensureSpace(40);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Question 2:', margin, yPosition);
  yPosition += 6;
  pdf.setFont('helvetica', 'normal');
  yPosition = addWrappedText('To your knowledge, is this person currently the subject of any criminal proceedings or police investigation?', margin + 5, yPosition, pageWidth - 2 * margin - 5, 9);
  yPosition += 3;
  const proceedingsYesBox = reference.form_data.criminalProceedingsKnown === 'yes' ? '☑' : '☐';
  const proceedingsNoBox = reference.form_data.criminalProceedingsKnown === 'no' ? '☑' : '☐';
  const proceedingsAnswer = reference.form_data.criminalProceedingsKnown ? `${proceedingsYesBox} Yes    ${proceedingsNoBox} No` : 'Not answered';
  pdf.text(proceedingsAnswer, margin + 5, yPosition);
  yPosition += 10;

  // Criminal details if provided
  if (reference.form_data.convictionsKnown === 'yes' || reference.form_data.criminalProceedingsKnown === 'yes' || reference.form_data.criminalDetails) {
    ensureSpace(40);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Details provided:', margin, yPosition);
    yPosition += lineHeight;
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(`${reference.form_data.criminalDetails || 'Not provided'}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 10;
  }

  // Additional Comments
  addSectionHeader('ADDITIONAL COMMENTS');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  yPosition = addWrappedText(`${reference.form_data.additionalComments || 'Not provided'}`, margin + 5, yPosition, pageWidth - 2 * margin - 5, 9);
  yPosition += 10;

  // Declaration
  addSectionHeader('DECLARATION');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const declarationText = 'I certify that, to the best of my knowledge, the information I have given is true and complete. I understand that any deliberate omission, falsification or misrepresentation may lead to refusal of appointment or dismissal.';
  yPosition = addWrappedText(declarationText, margin + 5, yPosition, pageWidth - 2 * margin - 5, 9);
  yPosition += 10;

  // Completion Information
  addSectionHeader('COMPLETION INFORMATION');
  pdf.setFontSize(10);
  
  const infoItems = [
    { label: 'Completed By:', value: reference.form_data.refereeFullName || 'Not provided' },
    { label: 'Job Title:', value: reference.form_data.refereeJobTitle || 'Not provided' },
    { label: 'Created On:', value: new Date(reference.created_at).toLocaleDateString('en-GB') },
    { label: 'Sent On:', value: new Date(reference.sent_at).toLocaleDateString('en-GB') },
    { label: 'Completed On:', value: new Date(reference.completed_at).toLocaleDateString('en-GB') }
  ];

  infoItems.forEach(item => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(item.label, margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(item.value, margin + 45, yPosition);
    yPosition += 6;
  });
  
  yPosition += 5;
  
  // Add footer
  pdf.setFontSize(8);
  pdf.setTextColor(textGray.r, textGray.g, textGray.b);
  pdf.text(`Reference ID: ${reference.id}`, margin, pageHeight - 10);
  pdf.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - margin - 40, pageHeight - 10);

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
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 6;
  let yPosition = 20;

  // Define professional colors
  const primaryColor = { r: 59, g: 130, b: 246 };
  const accentColor = { r: 99, g: 102, b: 241 };
  const textGray = { r: 75, g: 85, b: 99 };
  const lightGray = { r: 243, g: 244, b: 246 };

  // Set font
  pdf.setFont('helvetica', 'normal');

  // Add modern header bar
  pdf.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  pdf.rect(0, 0, pageWidth, 15, 'F');
  
  // Add decorative accent line
  pdf.setFillColor(accentColor.r, accentColor.g, accentColor.b);
  pdf.rect(0, 15, pageWidth, 2, 'F');

  // Helper function for section headers
  const addSectionHeader = (title: string) => {
    ensureSpace(15);
    pdf.setFillColor(lightGray.r, lightGray.g, lightGray.b);
    pdf.rect(margin - 5, yPosition - 3, pageWidth - 2 * (margin - 5), 10, 'F');
    pdf.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(title, margin, yPosition + 4);
    pdf.setTextColor(0, 0, 0);
    yPosition += 12;
  };

  yPosition = 30;
  
  // Add company logo if available
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
      const logoX = margin;
      
      const format = companySettings.logo.toLowerCase().includes('.png') ? 'PNG' : 'JPEG';
      pdf.addImage(companySettings.logo, format, logoX, yPosition, logoWidth, logoHeight);
      yPosition = Math.max(yPosition + logoHeight + 5, yPosition + 15);
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
    }
  }

  // Add company name
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textGray.r, textGray.g, textGray.b);
  pdf.text(companySettings.name, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Helper function to add text with word wrap
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 11): number => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * lineHeight);
  };

  // Helper function to ensure space on page
  const ensureSpace = (needed: number) => {
    if (yPosition + needed > pageHeight - 20) {
      pdf.addPage();
      // Add header to new page
      pdf.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
      pdf.rect(0, 0, pageWidth, 15, 'F');
      pdf.setFillColor(accentColor.r, accentColor.g, accentColor.b);
      pdf.rect(0, 15, pageWidth, 2, 'F');
      yPosition = 25;
    }
  };

  // Title with decorative background
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  const referenceTitle = data.referenceType === 'employer' ? 'Employment Reference' : 'Character Reference';
  pdf.text(referenceTitle, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;
  
  pdf.setTextColor(0, 0, 0);

  // Applicant Information Card
  addSectionHeader('APPLICANT INFORMATION');
  pdf.setFontSize(10);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Name:', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.applicantName, margin + 35, yPosition);
  yPosition += 7;
  
  if (data.applicantDOB) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Date of Birth:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(data.applicantDOB, margin + 35, yPosition);
    yPosition += 7;
  }
  
  if (data.applicantPostcode) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Postcode:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(data.applicantPostcode, margin + 35, yPosition);
    yPosition += 7;
  }
  yPosition += 5;

  // Referee Information
  addSectionHeader('REFEREE INFORMATION');
  pdf.setFontSize(10);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Name:', margin, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.referee.name || '', margin + 35, yPosition);
  yPosition += 7;
  
  if (data.referee.jobTitle) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Job Title:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(data.referee.jobTitle, margin + 35, yPosition);
    yPosition += 7;
  }
  yPosition += 5;

  // Reference specific content
  if (data.referenceType === 'employer') {
    addSectionHeader('EMPLOYMENT DETAILS');
    pdf.setFontSize(10);
    
    // Employment Status
    pdf.setFont('helvetica', 'bold');
    pdf.text('Employment Status:', margin, yPosition);
    yPosition += 6;
    pdf.setFont('helvetica', 'normal');
    const currentCheck = data.employmentStatus === 'current' ? '☑' : '☐';
    const previousCheck = data.employmentStatus === 'previous' ? '☑' : '☐';
    const neitherCheck = data.employmentStatus === 'neither' ? '☑' : '☐';
    pdf.text(`${currentCheck} Current    ${previousCheck} Previous    ${neitherCheck} Neither`, margin + 5, yPosition);
    yPosition += 8;

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
    addSectionHeader('CHARACTER REFERENCE DETAILS');
    pdf.setFontSize(10);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Known from outside employment/education:', margin, yPosition);
    yPosition += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.text('☑ Yes    ☐ No', margin + 5, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Relationship Description:', margin, yPosition);
    yPosition += 6;
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText('', margin + 5, yPosition, pageWidth - 2 * margin - 5, 10);
    yPosition += 8;
  }

  // Character qualities
  addSectionHeader('CHARACTER ASSESSMENT');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Please indicate which of the following describes this person:', margin, yPosition);
  yPosition += 8;

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
  pdf.setFontSize(9);
  
  // Display qualities in 2 columns with better styling
  const columnWidth = (pageWidth - 2 * margin) / 2;
  for (let i = 0; i < qualities.length; i += 2) {
    ensureSpace(7);
    
    // Left column quality - preselected
    pdf.text('☑', margin + 5, yPosition);
    pdf.text(qualities[i], margin + 12, yPosition);
    
    // Right column quality (if exists) - preselected
    if (i + 1 < qualities.length) {
      const rightStartX = margin + columnWidth;
      pdf.text('☑', rightStartX, yPosition);
      pdf.text(qualities[i + 1], rightStartX + 7, yPosition);
    }
    
    yPosition += 6;
  }
  
  pdf.setFontSize(10);

  // Qualities not ticked reason
  ensureSpace(30);
  yPosition += 3;
  pdf.setFont('helvetica', 'bold');
  pdf.text('If you did not tick one or more of the above, please tell us why here:', margin, yPosition);
  yPosition += lineHeight;
  pdf.setFont('helvetica', 'normal');
  yPosition = addWrappedText('Not provided', margin, yPosition, pageWidth - 2 * margin);
  yPosition += 5;

  // Criminal background questions
  addSectionHeader('CRIMINAL BACKGROUND CHECK');
  pdf.setFontSize(10);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Question 1:', margin, yPosition);
  yPosition += 6;
  pdf.setFont('helvetica', 'normal');
  yPosition = addWrappedText('Are you aware of any convictions, cautions, reprimands or final warnings that the person may have received that are not \'protected\' as defined by the Rehabilitation of Offenders Act 1974?', margin + 5, yPosition, pageWidth - 2 * margin - 5, 9);
  yPosition += 3;
  pdf.text('☐ Yes    ☑ No', margin + 5, yPosition);
  yPosition += 10;

  ensureSpace(40);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Question 2:', margin, yPosition);
  yPosition += 6;
  pdf.setFont('helvetica', 'normal');
  yPosition = addWrappedText('To your knowledge, is this person currently the subject of any criminal proceedings or police investigation?', margin + 5, yPosition, pageWidth - 2 * margin - 5, 9);
  yPosition += 3;
  pdf.text('☐ Yes    ☑ No', margin + 5, yPosition);
  yPosition += 10;

  // Additional Comments
  addSectionHeader('ADDITIONAL COMMENTS');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  yPosition = addWrappedText('Not provided', margin + 5, yPosition, pageWidth - 2 * margin - 5, 9);
  yPosition += 10;

  // Declaration
  addSectionHeader('DECLARATION');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const declarationText = 'I certify that, to the best of my knowledge, the information I have given is true and complete. I understand that any deliberate omission, falsification or misrepresentation may lead to refusal of appointment or dismissal.';
  yPosition = addWrappedText(declarationText, margin + 5, yPosition, pageWidth - 2 * margin - 5, 9);
  yPosition += 10;

  // Completion Information
  addSectionHeader('COMPLETION INFORMATION');
  pdf.setFontSize(10);
  
  const createdKey = `{R${data.referenceNumber || 1}_Created}`;
  const signatureKey = `{R${data.referenceNumber || 1}_Signed}`;
  
  const infoItems = [
    { label: 'Completed By:', value: data.referee.name || 'Not provided' },
    { label: 'Job Title:', value: data.referee.jobTitle || 'Not provided' },
    { label: 'Created On:', value: createdKey },
    { label: 'Sent On:', value: signatureKey },
    { label: 'Completed On:', value: signatureKey }
  ];

  infoItems.forEach(item => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(item.label, margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(item.value, margin + 45, yPosition);
    yPosition += 6;
  });
  
  yPosition += 5;
  
  // Add footer
  pdf.setFontSize(8);
  pdf.setTextColor(textGray.r, textGray.g, textGray.b);
  pdf.text(`Reference Type: ${data.referenceType}`, margin, pageHeight - 10);
  pdf.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - margin - 40, pageHeight - 10);

  return pdf;
};