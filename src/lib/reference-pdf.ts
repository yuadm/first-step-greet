import { PDFBuilder, defaultStyles, CompanySettings } from './pdf-styles';

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

export const generateReferencePDF = async (
  reference: CompletedReference,
  applicantName: string,
  applicantDOB: string,
  applicantPostcode: string,
  companySettings: CompanySettings = { name: 'Company Name' }
) => {
  const pdfBuilder = new PDFBuilder(defaultStyles);
  
  // Add company logo and header
  await pdfBuilder.addLogo(companySettings.logo || '', companySettings.name);
  
  // Add title
  const referenceType = reference.reference_type === 'employer' 
    ? 'Employment Reference Report' 
    : 'Character Reference Report';
  pdfBuilder.addTitle(referenceType);
  
  // Applicant Information Section
  pdfBuilder.addInfoSection('Applicant Information', [
    { label: 'Name', value: applicantName },
    { label: 'Date of Birth', value: applicantDOB },
    { label: 'Postcode', value: applicantPostcode }
  ]);
  
  // Referee Information Section
  pdfBuilder.addInfoSection('Referee Information', [
    { label: 'Name', value: reference.form_data.refereeFullName || 'Not provided' },
    { label: 'Job Title', value: reference.form_data.refereeJobTitle || 'Not provided' }
  ]);
  
  // Reference Type Specific Content
  if (reference.reference_type === 'employer') {
    // Employment Status
    const employmentOptions = [
      { label: 'Current Employer', checked: reference.form_data.employmentStatus === 'current' },
      { label: 'Previous Employer', checked: reference.form_data.employmentStatus === 'previous' },
      { label: 'Neither Current nor Previous', checked: reference.form_data.employmentStatus === 'neither' }
    ];
    pdfBuilder.addCheckboxGrid('Employment Status', employmentOptions);
    
    // Employment Details
    const employmentDetails = [
      { label: 'Relationship Description', value: reference.form_data.relationshipDescription || 'Not provided' },
      { label: 'Job Title', value: reference.form_data.jobTitle || 'Not provided' },
      { label: 'Start Date', value: reference.form_data.startDate ? new Date(reference.form_data.startDate).toLocaleDateString() : 'Not provided' },
      { label: 'End Date', value: reference.form_data.endDate ? new Date(reference.form_data.endDate).toLocaleDateString() : 'Not provided' }
    ];
    pdfBuilder.addInfoSection('Employment Details', employmentDetails);
    
    // Attendance Record
    const attendanceOptions = [
      { label: 'Good Attendance', checked: reference.form_data.attendance === 'good' },
      { label: 'Average Attendance', checked: reference.form_data.attendance === 'average' },
      { label: 'Poor Attendance', checked: reference.form_data.attendance === 'poor' }
    ];
    pdfBuilder.addCheckboxGrid('Attendance Record', attendanceOptions);
    
    // Leaving Reason
    pdfBuilder.addTextArea('Reason for Leaving Employment', reference.form_data.leavingReason || 'Not provided');
  } else {
    // Character reference specific content
    const characterOptions = [
      { label: 'Known from outside employment/education', checked: reference.form_data.employmentStatus === 'yes' },
      { label: 'Not known from outside employment/education', checked: reference.form_data.employmentStatus === 'no' }
    ];
    pdfBuilder.addCheckboxGrid('Relationship Type', characterOptions);
    
    pdfBuilder.addTextArea('Relationship Description', reference.form_data.relationshipDescription || 'Not provided');
  }
  
  // Character Qualities Assessment
  const qualities = [
    { label: 'Honest and trustworthy', checked: !!reference.form_data.honestTrustworthy },
    { label: 'Communicates effectively', checked: !!reference.form_data.communicatesEffectively },
    { label: 'Effective team member', checked: !!reference.form_data.effectiveTeamMember },
    { label: 'Respectful of confidentiality', checked: !!reference.form_data.respectfulConfidentiality },
    { label: 'Reliable and punctual', checked: !!reference.form_data.reliablePunctual },
    { label: 'Suitable for position applied for', checked: !!reference.form_data.suitablePosition },
    { label: 'Kind and compassionate', checked: !!reference.form_data.kindCompassionate },
    { label: 'Works well without close supervision', checked: !!reference.form_data.worksIndependently }
  ];
  pdfBuilder.addCheckboxGrid('Character Assessment - Which of the following describes this person?', qualities);
  
  // Explanation for unticked qualities
  pdfBuilder.addTextArea('Explanation for Any Unticked Qualities', reference.form_data.qualitiesNotTickedReason || 'Not provided');
  
  // Criminal Background Check Section
  pdfBuilder.addTitle('CRIMINAL BACKGROUND CHECK');
  pdfBuilder.addTextArea(
    'Are you aware of any convictions, cautions, reprimands or final warnings that the person may have received that are not "protected" as defined by the Rehabilitation of Offenders Act 1974?',
    ''
  );
  
  const convictionOptions = [
    { label: 'Yes - Aware of convictions/cautions', checked: reference.form_data.convictionsKnown === 'yes' },
    { label: 'No - Not aware of any convictions/cautions', checked: reference.form_data.convictionsKnown === 'no' }
  ];
  pdfBuilder.addCheckboxGrid('Conviction Status', convictionOptions);
  
  pdfBuilder.addTextArea(
    'To your knowledge, is this person currently the subject of any criminal proceedings or police investigation?',
    ''
  );
  
  const proceedingsOptions = [
    { label: 'Yes - Subject to criminal proceedings/investigation', checked: reference.form_data.criminalProceedingsKnown === 'yes' },
    { label: 'No - Not subject to proceedings/investigation', checked: reference.form_data.criminalProceedingsKnown === 'no' }
  ];
  pdfBuilder.addCheckboxGrid('Criminal Proceedings Status', proceedingsOptions);
  
  // Criminal details if provided
  if (reference.form_data.criminalDetails) {
    pdfBuilder.addTextArea('Criminal Background Details', reference.form_data.criminalDetails);
  }
  
  // Additional Comments
  pdfBuilder.addTextArea('Additional Comments', reference.form_data.additionalComments || 'No additional comments provided');
  
  // Declaration
  pdfBuilder.addDeclaration();
  
  // Footer with reference information
  const footerData = [
    { label: 'Reference Created', value: new Date(reference.created_at).toLocaleDateString() },
    { label: 'Reference Sent', value: new Date(reference.sent_at).toLocaleDateString() },
    { label: 'Reference Completed', value: new Date(reference.completed_at).toLocaleDateString() },
    { label: 'Reference ID', value: reference.id.substring(0, 8) }
  ];
  pdfBuilder.addFooter(footerData);
  
  return pdfBuilder.getPDF();
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
  const pdfBuilder = new PDFBuilder(defaultStyles);
  
  // Add company logo and header
  await pdfBuilder.addLogo(companySettings.logo || '', companySettings.name);
  
  // Add title
  const referenceType = data.referenceType === 'employer' 
    ? 'Employment Reference Form' 
    : 'Character Reference Form';
  pdfBuilder.addTitle(referenceType);
  
  // Applicant Information Section
  const applicantInfo = [
    { label: 'Name', value: data.applicantName },
    { label: 'Date of Birth', value: data.applicantDOB || '_______________' },
    { label: 'Postcode', value: data.applicantPostcode || '_______________' }
  ];
  if (data.applicantPosition) {
    applicantInfo.push({ label: 'Position Applied For', value: data.applicantPosition });
  }
  pdfBuilder.addInfoSection('Applicant Information', applicantInfo);
  
  // Referee Information Section
  const refereeInfo = [
    { label: 'Name', value: data.referee.name || '_______________' },
    { label: 'Job Title', value: data.referee.jobTitle || '_______________' },
    { label: 'Company', value: data.referee.company || '_______________' },
    { label: 'Email', value: data.referee.email || '_______________' },
    { label: 'Phone', value: data.referee.phone || '_______________' },
    { label: 'Address', value: data.referee.address || '_______________' }
  ];
  pdfBuilder.addInfoSection('Referee Information', refereeInfo);
  
  // Reference Type Specific Content
  if (data.referenceType === 'employer') {
    // Employment Status
    const employmentOptions = [
      { label: 'Current Employer', checked: data.employmentStatus === 'current' },
      { label: 'Previous Employer', checked: data.employmentStatus === 'previous' },
      { label: 'Neither Current nor Previous', checked: data.employmentStatus === 'neither' }
    ];
    pdfBuilder.addCheckboxGrid('Are you this person\'s current or previous employer?', employmentOptions);
    
    // Employment Details
    const employmentDetails = [
      { label: 'Relationship Description', value: data.referee.jobTitle || '_______________' },
      { label: 'Employee Job Title', value: data.applicantPosition || '_______________' },
      { label: 'Employment From', value: data.employmentFrom || '_______________' },
      { label: 'Employment To', value: data.employmentTo || '_______________' }
    ];
    pdfBuilder.addInfoSection('Employment Details', employmentDetails);
    
    // Attendance Record (pre-selected as Good for manual references)
    const attendanceOptions = [
      { label: 'Good Attendance', checked: true },
      { label: 'Average Attendance', checked: false },
      { label: 'Poor Attendance', checked: false }
    ];
    pdfBuilder.addCheckboxGrid('How would you describe their recent attendance record?', attendanceOptions);
    
    // Leaving Reason
    pdfBuilder.addTextArea(
      'Why did the person leave your employment (if still employed, write "still employed")?', 
      data.reasonForLeaving || '________________________________________________________________\n\n________________________________________________________________\n\n________________________________________________________________'
    );
  } else {
    // Character reference specific content
    const characterOptions = [
      { label: 'Yes - I know this person from outside employment/education', checked: true },
      { label: 'No - I do not know this person from outside employment/education', checked: false }
    ];
    pdfBuilder.addCheckboxGrid('Do you know this person from outside employment or education?', characterOptions);
    
    pdfBuilder.addTextArea(
      'Please describe your relationship with this person, including how long you have known them:', 
      '________________________________________________________________\n\n________________________________________________________________\n\n________________________________________________________________'
    );
  }
  
  // Character Qualities Assessment (all pre-selected for manual references)
  const qualities = [
    { label: 'Honest and trustworthy', checked: true },
    { label: 'Communicates effectively', checked: true },
    { label: 'Effective team member', checked: true },
    { label: 'Respectful of confidentiality', checked: true },
    { label: 'Reliable and punctual', checked: true },
    { label: 'Suitable for position applied for', checked: true },
    { label: 'Kind and compassionate', checked: true },
    { label: 'Works well without close supervision', checked: true }
  ];
  pdfBuilder.addCheckboxGrid('In your opinion, which of the following describes this person? (tick each that is true)', qualities);
  
  // Explanation for unticked qualities
  pdfBuilder.addTextArea(
    'If you did not tick one or more of the above, please tell us why here:', 
    '________________________________________________________________\n\n________________________________________________________________'
  );
  
  // Criminal Background Check Section
  pdfBuilder.addTitle('CRIMINAL BACKGROUND CHECK');
  pdfBuilder.addTextArea(
    'The position this person has applied for involves working with vulnerable people. Are you aware of any convictions, cautions, reprimands or final warnings that the person may have received that are not "protected" as defined by the Rehabilitation of Offenders Act 1974 (Exceptions) Order 1975 (as amended in 2013 by SI 210 1198)?',
    ''
  );
  
  const convictionOptions = [
    { label: 'Yes', checked: false },
    { label: 'No', checked: true }
  ];
  pdfBuilder.addCheckboxGrid('Conviction Status', convictionOptions);
  
  pdfBuilder.addTextArea(
    'To your knowledge, is this person currently the subject of any criminal proceedings (for example, charged or summoned but not yet dealt with) or any police investigation?',
    ''
  );
  
  const proceedingsOptions = [
    { label: 'Yes', checked: false },
    { label: 'No', checked: true }
  ];
  pdfBuilder.addCheckboxGrid('Criminal Proceedings Status', proceedingsOptions);
  
  // Additional Comments
  pdfBuilder.addTextArea(
    'Any additional comments you would like to make about this person:', 
    '________________________________________________________________\n\n________________________________________________________________\n\n________________________________________________________________'
  );
  
  // Declaration
  pdfBuilder.addDeclaration();
  
  // Footer with reference information
  const referenceId = `R${data.referenceNumber || 1}`;
  const footerData = [
    { label: 'Reference Number', value: referenceId },
    { label: 'Form Generated', value: new Date().toLocaleDateString() },
    { label: 'To be completed by', value: data.referee.name || 'Referee' },
    { label: 'Return to', value: companySettings.name }
  ];
  pdfBuilder.addFooter(footerData);
  
  return pdfBuilder.getPDF();
};