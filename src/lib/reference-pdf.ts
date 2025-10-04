import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const margin = 20;
  let yPosition = height - 30;
  const lineHeight = 14;
  
  // Helper to add new page if needed
  const ensureSpace = (needed: number) => {
    if (yPosition - needed < 30) {
      page = pdfDoc.addPage([595, 842]);
      yPosition = height - 30;
      // Add border to new page
      page.drawRectangle({
        x: 15,
        y: 15,
        width: width - 30,
        height: height - 30,
        borderColor: rgb(0.78, 0.78, 0.78),
        borderWidth: 0.3,
      });
    }
  };
  
  // Add border
  page.drawRectangle({
    x: 15,
    y: 15,
    width: width - 30,
    height: height - 30,
    borderColor: rgb(0.78, 0.78, 0.78),
    borderWidth: 0.3,
  });
  
  // Add company logo if available
  if (companySettings.logo) {
    try {
      const imageBytes = await fetch(companySettings.logo).then(res => res.arrayBuffer());
      const isJpg = companySettings.logo.toLowerCase().includes('.jpg') || companySettings.logo.toLowerCase().includes('.jpeg');
      const image = isJpg 
        ? await pdfDoc.embedJpg(imageBytes)
        : await pdfDoc.embedPng(imageBytes);
      
      const imageDims = image.scale(0.15);
      const imageX = (width - imageDims.width) / 2;
      
      page.drawImage(image, {
        x: imageX,
        y: yPosition - imageDims.height,
        width: imageDims.width,
        height: imageDims.height,
      });
      
      yPosition -= imageDims.height + 15;
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
      yPosition -= 5;
    }
  }
  
  // Company name
  page.drawText(companySettings.name, {
    x: width / 2 - (fontBold.widthOfTextAtSize(companySettings.name, 13) / 2),
    y: yPosition,
    size: 13,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= 20;
  
  // Header with emoji
  const referenceType = reference.reference_type === 'employer' ? '📝 Employment Reference' : '📝 Character Reference';
  page.drawText(referenceType, {
    x: width / 2 - (fontBold.widthOfTextAtSize(referenceType, 15) / 2),
    y: yPosition,
    size: 15,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= 20;
  
  // Applicant Information Section - Background box
  ensureSpace(30);
  page.drawRectangle({
    x: margin,
    y: yPosition - 20,
    width: width - 2 * margin,
    height: 25,
    color: rgb(0.96, 0.97, 0.98),
  });
  
  page.drawText('👤 Reference for:', {
    x: margin + 3,
    y: yPosition - 5,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= 13;
  
  const nameText = `Name: ${applicantName}`;
  const dobText = `DOB: ${applicantDOB}`;
  const postcodeText = `Postcode: ${applicantPostcode}`;
  
  page.drawText(nameText, {
    x: margin + 3,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(dobText, {
    x: margin + 150,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(postcodeText, {
    x: margin + 280,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  yPosition -= 25;
  
  // Referee Information Section
  ensureSpace(30);
  page.drawRectangle({
    x: margin,
    y: yPosition - 20,
    width: width - 2 * margin,
    height: 25,
    color: rgb(0.98, 0.96, 1),
  });
  
  page.drawText('✍️ Your Information:', {
    x: margin + 3,
    y: yPosition - 5,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= 13;
  
  const refereeName = `Name: ${reference.form_data.refereeFullName || ''}`;
  page.drawText(refereeName, {
    x: margin + 3,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  if (reference.form_data.refereeJobTitle) {
    const jobTitleText = `Job Title: ${reference.form_data.refereeJobTitle}`;
    page.drawText(jobTitleText, {
      x: margin + 250,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
  }
  yPosition -= 25;
  
  // Reference type specific content
  if (reference.reference_type === 'employer') {
    // Employment Status
    ensureSpace(30);
    page.drawRectangle({
      x: margin,
      y: yPosition - 18,
      width: width - 2 * margin,
      height: 23,
      color: rgb(0.96, 0.98, 1),
    });
    
    page.drawText('💼 Are you this person\'s current or previous employer?', {
      x: margin + 3,
      y: yPosition - 5,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPosition -= 14;
    
    const currentBox = reference.form_data.employmentStatus === 'current' ? '[X]' : '[ ]';
    const previousBox = reference.form_data.employmentStatus === 'previous' ? '[X]' : '[ ]';
    const neitherBox = reference.form_data.employmentStatus === 'neither' ? '[X]' : '[ ]';
    
    page.drawText(`${currentBox} Current    ${previousBox} Previous    ${neitherBox} Neither`, {
      x: margin + 3,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;
    
    // Relationship
    ensureSpace(30);
    page.drawText('What is your relationship to this person?', {
      x: margin,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
    
    page.drawText(reference.form_data.relationshipDescription || 'Not provided', {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
    
    // Job Title
    ensureSpace(25);
    page.drawText('Job title:', {
      x: margin,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
    
    page.drawText(reference.form_data.jobTitle || 'Not provided', {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
    
    // Employment Dates
    ensureSpace(25);
    page.drawText('Employment Period:', {
      x: margin,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
    
    const startDate = reference.form_data.startDate ? new Date(reference.form_data.startDate).toLocaleDateString() : 'Not provided';
    const endDate = reference.form_data.endDate ? new Date(reference.form_data.endDate).toLocaleDateString() : 'Not provided';
    
    page.drawText(`From ${startDate} to ${endDate}`, {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
    
    // Attendance
    ensureSpace(30);
    page.drawRectangle({
      x: margin,
      y: yPosition - 16,
      width: width - 2 * margin,
      height: 21,
      color: rgb(0.96, 0.98, 1),
    });
    
    page.drawText('How would you describe their recent attendance record?', {
      x: margin + 3,
      y: yPosition - 3,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPosition -= 12;
    
    const goodBox = reference.form_data.attendance === 'good' ? '[X]' : '[ ]';
    const averageBox = reference.form_data.attendance === 'average' ? '[X]' : '[ ]';
    const poorBox = reference.form_data.attendance === 'poor' ? '[X]' : '[ ]';
    
    page.drawText(`${goodBox} Good    ${averageBox} Average    ${poorBox} Poor`, {
      x: margin + 3,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;
    
    // Leaving Reason
    ensureSpace(40);
    page.drawText('Why did the person leave your employment?', {
      x: margin,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
    
    page.drawText(reference.form_data.leavingReason || 'Not provided', {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight + 5;
  } else {
    // Character reference
    ensureSpace(30);
    page.drawRectangle({
      x: margin,
      y: yPosition - 16,
      width: width - 2 * margin,
      height: 21,
      color: rgb(0.96, 0.98, 1),
    });
    
    page.drawText('🤝 Do you know this person from outside employment or education?', {
      x: margin + 3,
      y: yPosition - 3,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPosition -= 12;
    
    const outsideYesBox = reference.form_data.employmentStatus === 'yes' ? '[X]' : '[ ]';
    const outsideNoBox = reference.form_data.employmentStatus === 'no' ? '[X]' : '[ ]';
    
    page.drawText(`${outsideYesBox} Yes    ${outsideNoBox} No`, {
      x: margin + 3,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;
    
    // Relationship description
    ensureSpace(40);
    page.drawText('Please describe your relationship with this person:', {
      x: margin,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
    
    page.drawText(reference.form_data.relationshipDescription || 'Not provided', {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight + 5;
  }
  
  // Character qualities
  ensureSpace(80);
  page.drawRectangle({
    x: margin,
    y: yPosition - 65,
    width: width - 2 * margin,
    height: 70,
    color: rgb(0.96, 1, 0.98),
  });
  
  page.drawText('⭐ In your opinion, which of the following describes this person?', {
    x: margin + 3,
    y: yPosition - 5,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= 15;
  
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
  
  for (let i = 0; i < qualities.length; i += 2) {
    const leftQuality = qualities[i];
    const leftChecked = reference.form_data[leftQuality.key as keyof ReferenceData];
    const leftCheckbox = leftChecked ? '[X]' : '[ ]';
    
    page.drawText(`${leftCheckbox} ${leftQuality.label}`, {
      x: margin + 5,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    if (i + 1 < qualities.length) {
      const rightQuality = qualities[i + 1];
      const rightChecked = reference.form_data[rightQuality.key as keyof ReferenceData];
      const rightCheckbox = rightChecked ? '[X]' : '[ ]';
      
      page.drawText(`${rightCheckbox} ${rightQuality.label}`, {
        x: margin + 280,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
    
    yPosition -= 12;
  }
  yPosition -= 10;
  
  // Qualities not ticked reason
  ensureSpace(35);
  page.drawText('If you did not tick one or more of the above, please tell us why:', {
    x: margin,
    y: yPosition,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight;
  
  page.drawText(reference.form_data.qualitiesNotTickedReason || 'Not provided', {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight + 5;
  
  // Background check section
  ensureSpace(100);
  page.drawRectangle({
    x: margin,
    y: yPosition - 75,
    width: width - 2 * margin,
    height: 80,
    color: rgb(1, 0.98, 0.96),
  });
  
  page.drawText('⚠️ BACKGROUND CHECK QUESTIONS', {
    x: margin + 3,
    y: yPosition - 5,
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= 18;
  
  page.drawText('Are you aware of any convictions, cautions, reprimands or final warnings?', {
    x: margin + 3,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight;
  
  const convictionsYesBox = reference.form_data.convictionsKnown === 'yes' ? '[X]' : '[ ]';
  const convictionsNoBox = reference.form_data.convictionsKnown === 'no' ? '[X]' : '[ ]';
  
  page.drawText(`${convictionsYesBox} Yes    ${convictionsNoBox} No`, {
    x: margin + 3,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight + 3;
  
  page.drawText('Is this person currently subject to any criminal proceedings?', {
    x: margin + 3,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight;
  
  const proceedingsYesBox = reference.form_data.criminalProceedingsKnown === 'yes' ? '[X]' : '[ ]';
  const proceedingsNoBox = reference.form_data.criminalProceedingsKnown === 'no' ? '[X]' : '[ ]';
  
  page.drawText(`${proceedingsYesBox} Yes    ${proceedingsNoBox} No`, {
    x: margin + 3,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight + 10;
  
  if (reference.form_data.criminalDetails) {
    ensureSpace(25);
    page.drawText('Details:', {
      x: margin,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
    
    page.drawText(reference.form_data.criminalDetails, {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight + 5;
  }
  
  // Additional comments
  ensureSpace(35);
  page.drawText('Additional comments:', {
    x: margin,
    y: yPosition,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight;
  
  page.drawText(reference.form_data.additionalComments || 'Not provided', {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight + 10;
  
  // Declaration
  ensureSpace(40);
  page.drawText('DECLARATION', {
    x: margin,
    y: yPosition,
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight;
  
  page.drawText('I certify that, to the best of my knowledge, the information I have given is true and complete.', {
    x: margin,
    y: yPosition,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight + 10;
  
  // Referee Information
  ensureSpace(50);
  page.drawText('REFEREE INFORMATION', {
    x: margin,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight;
  
  page.drawText(`Referee Name: ${reference.form_data.refereeFullName || ''}`, {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight;
  
  page.drawText(`Job Title: ${reference.form_data.refereeJobTitle || ''}`, {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight;
  
  page.drawText(`Created: ${new Date(reference.created_at).toLocaleDateString()}`, {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight;
  
  page.drawText(`Completed: ${new Date(reference.completed_at).toLocaleDateString()}`, {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  return pdfDoc;
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
  // For manual reference, we'll use a simpler version that returns the PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const margin = 20;
  let yPosition = height - 30;
  
  // Add border
  page.drawRectangle({
    x: 15,
    y: 15,
    width: width - 30,
    height: height - 30,
    borderColor: rgb(0.78, 0.78, 0.78),
    borderWidth: 0.3,
  });
  
  // Company name
  page.drawText(companySettings.name, {
    x: width / 2 - (fontBold.widthOfTextAtSize(companySettings.name, 13) / 2),
    y: yPosition,
    size: 13,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= 20;
  
  // Title
  const referenceTitle = data.referenceType === 'employer' ? 'Employment Reference' : 'Character Reference';
  page.drawText(referenceTitle, {
    x: width / 2 - (fontBold.widthOfTextAtSize(referenceTitle, 15) / 2),
    y: yPosition,
    size: 15,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= 25;
  
  // Basic info
  page.drawText(`Name: ${data.applicantName}`, {
    x: margin,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  if (data.applicantDOB) {
    page.drawText(`DOB: ${data.applicantDOB}`, {
      x: margin + 200,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
  }
  
  if (data.applicantPostcode) {
    page.drawText(`Postcode: ${data.applicantPostcode}`, {
      x: margin + 350,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
  }
  yPosition -= 25;
  
  // Referee info
  if (data.referee.name) {
    page.drawText(`Referee Name: ${data.referee.name}`, {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
  }
  yPosition -= 15;
  
  if (data.referee.jobTitle) {
    page.drawText(`Job Title: ${data.referee.jobTitle}`, {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
  }
  yPosition -= 25;
  
  // Employment info for employer reference
  if (data.referenceType === 'employer') {
    page.drawText('Employment Status:', {
      x: margin,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPosition -= 12;
    
    const currentCheck = data.employmentStatus === 'current' ? '[X]' : '[ ]';
    const previousCheck = data.employmentStatus === 'previous' ? '[X]' : '[ ]';
    const neitherCheck = data.employmentStatus === 'neither' ? '[X]' : '[ ]';
    
    page.drawText(`${currentCheck} Current    ${previousCheck} Previous    ${neitherCheck} Neither`, {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;
    
    if (data.applicantPosition) {
      page.drawText(`Job Title: ${data.applicantPosition}`, {
        x: margin,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
    }
    
    if (data.employmentFrom || data.employmentTo) {
      page.drawText(`Period: ${data.employmentFrom || ''} to ${data.employmentTo || ''}`, {
        x: margin,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
    }
  }
  
  return pdfDoc;
};