import { JobApplicationData, Declaration } from './types';

export const validateStep = (currentStep: number, formData: JobApplicationData): boolean => {
  switch (currentStep) {
    case 1: {
      // Personal Info: All required except Street Address Second Line and languages
      const pi = formData.personalInfo;
      return !!(pi.title && pi.fullName && pi.email && pi.confirmEmail && 
               pi.email === pi.confirmEmail && pi.telephone && pi.dateOfBirth && 
               pi.streetAddress && pi.town && pi.borough && pi.postcode && 
               pi.englishProficiency && pi.positionAppliedFor && 
               pi.personalCareWillingness && pi.hasDBS && pi.hasCarAndLicense && 
               pi.nationalInsuranceNumber);
    }
    case 2: {
      return !!(formData.availability.hoursPerWeek && formData.availability.hasRightToWork);
    }
    case 3: {
      return !!(formData.emergencyContact.fullName && formData.emergencyContact.relationship && 
               formData.emergencyContact.contactNumber && formData.emergencyContact.howDidYouHear);
    }
    case 4: {
      // Employment History: If previously employed = yes, must complete Most Recent Employer and all Previous Employers
      if (formData.employmentHistory.previouslyEmployed === 'yes') {
        const re = formData.employmentHistory.recentEmployer;
        const recentEmployerValid = !!(re && re.company && re.name && re.email && re.position && 
                 re.address && re.town && re.postcode && re.telephone && 
                 re.from && re.to && re.reasonForLeaving);
        
        if (!recentEmployerValid) return false;
        
        // Validate all additional previous employers if they exist
        const prevEmployers = formData.employmentHistory.previousEmployers || [];
        const allPreviousEmployersValid = prevEmployers.every(emp => 
          emp.company && emp.name && emp.email && emp.position && 
          emp.address && emp.town && emp.postcode && emp.telephone && 
          emp.from && emp.to && emp.reasonForLeaving
        );
        
        return allPreviousEmployersValid;
      }
      return formData.employmentHistory.previouslyEmployed === 'no';
    }
    case 5: {
      // References validation - check required fields for both references
      const ref1 = formData.references.reference1;
      const ref2 = formData.references.reference2;
      
      const isRef1Valid = !!(ref1.name && ref1.company && ref1.jobTitle && ref1.email && 
                            ref1.address && ref1.town && ref1.contactNumber && ref1.postcode);
      const isRef2Valid = !!(ref2.name && ref2.company && ref2.jobTitle && ref2.email && 
                            ref2.address && ref2.town && ref2.contactNumber && ref2.postcode);
      
      return isRef1Valid && isRef2Valid;
    }
    case 6: {
      // Skills & Experience step - always allow to proceed as it's optional
      return true;
    }
    case 7: {
      // Declaration step validation
      const declaration = formData.declaration;
      const requiredFields = [
        'socialServiceEnquiry', 'convictedOfOffence', 'safeguardingInvestigation',
        'criminalConvictions', 'healthConditions', 'cautionsReprimands'
      ];
      
      // Check if all required fields are answered
      const allAnswered = requiredFields.every(field => declaration[field as keyof Declaration]);
      
      if (!allAnswered) return false;
      
      // Check if any "yes" answers have required details
      const needsDetails = [
        { field: 'socialServiceEnquiry', detail: 'socialServiceDetails' },
        { field: 'convictedOfOffence', detail: 'convictedDetails' },
        { field: 'safeguardingInvestigation', detail: 'safeguardingDetails' },
        { field: 'criminalConvictions', detail: 'criminalDetails' },
        { field: 'healthConditions', detail: 'healthDetails' },
        { field: 'cautionsReprimands', detail: 'cautionsDetails' }
      ];
      
      return needsDetails.every(({ field, detail }) => {
        if (declaration[field as keyof Declaration] === 'yes') {
          return !!declaration[detail as keyof Declaration]?.trim();
        }
        return true;
      });
    }
    case 8: {
      return !!(formData.termsPolicy.consentToTerms && formData.termsPolicy.signature && formData.termsPolicy.date);
    }
    default:
      return true;
  }
};