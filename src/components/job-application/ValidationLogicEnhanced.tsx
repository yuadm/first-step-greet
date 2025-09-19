import { JobApplicationData, Declaration } from './types';

// Enhanced validation with proper date validation and field checking
export const validateStepEnhanced = (currentStep: number, formData: JobApplicationData): boolean => {
  switch (currentStep) {
    case 1: {
      // Personal Info: Enhanced validation with date checking
      const pi = formData.personalInfo;
      
      // Basic required field validation
      const basicValidation = !!(
        pi.title && 
        pi.fullName && 
        pi.email && 
        pi.confirmEmail && 
        pi.telephone && 
        pi.dateOfBirth && 
        pi.streetAddress && 
        pi.town && 
        pi.borough && 
        pi.postcode && 
        pi.englishProficiency && 
        pi.positionAppliedFor && 
        pi.personalCareWillingness && 
        pi.hasDBS && 
        pi.hasCarAndLicense && 
        pi.nationalInsuranceNumber
      );

      if (!basicValidation) return false;

      // Email match validation
      if (pi.email !== pi.confirmEmail) return false;

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(pi.email)) return false;

      // Date of birth validation (must be valid date and over 16 years old)
      if (pi.dateOfBirth) {
        const birthDate = new Date(pi.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (isNaN(birthDate.getTime())) return false; // Invalid date
        if (age < 16 || (age === 16 && monthDiff < 0)) return false; // Under 16
        if (birthDate > today) return false; // Future date
      }

      // Phone number validation (basic UK format)
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(pi.telephone)) return false;

      // Postcode validation (basic UK format)
      const postcodeRegex = /^[A-Z]{1,2}[0-9R][0-9A-Z]?\s?[0-9][A-Z]{2}$/i;
      if (!postcodeRegex.test(pi.postcode.replace(/\s/g, ''))) return false;

      return true;
    }
    
    case 2: {
      // Availability validation
      const availability = formData.availability;
      return !!(availability.hoursPerWeek && availability.hasRightToWork);
    }
    
    case 3: {
      // Emergency Contact validation
      const ec = formData.emergencyContact;
      const basicValidation = !!(
        ec.fullName && 
        ec.relationship && 
        ec.contactNumber && 
        ec.howDidYouHear
      );

      if (!basicValidation) return false;

      // Phone number validation
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(ec.contactNumber)) return false;

      return true;
    }
    
    case 4: {
      // Employment History validation
      if (formData.employmentHistory.previouslyEmployed === 'yes') {
        const re = formData.employmentHistory.recentEmployer;
        if (!re) return false;

        const basicValidation = !!(
          re.company && 
          re.name && 
          re.email && 
          re.position && 
          re.address && 
          re.town && 
          re.postcode && 
          re.telephone && 
          re.from && 
          re.to && 
          re.reasonForLeaving
        );

        if (!basicValidation) return false;

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(re.email)) return false;

        // Date validation (from should be before to)
        const fromDate = new Date(re.from);
        const toDate = new Date(re.to);
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return false;
        if (fromDate >= toDate) return false;

        return true;
      }
      return formData.employmentHistory.previouslyEmployed === 'no';
    }
    
    case 5: {
      // References validation
      const refs = formData.references;
      
      // Both references must have at least name, email, and contact number
      const ref1Valid = !!(
        refs.reference1.name && 
        refs.reference1.email && 
        refs.reference1.contactNumber &&
        refs.reference1.company &&
        refs.reference1.jobTitle
      );
      
      const ref2Valid = !!(
        refs.reference2.name && 
        refs.reference2.email && 
        refs.reference2.contactNumber &&
        refs.reference2.company &&
        refs.reference2.jobTitle
      );

      if (!ref1Valid || !ref2Valid) return false;

      // Email validation for both references
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(refs.reference1.email) || !emailRegex.test(refs.reference2.email)) {
        return false;
      }

      // Phone validation for both references
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(refs.reference1.contactNumber) || !phoneRegex.test(refs.reference2.contactNumber)) {
        return false;
      }

      return true;
    }
    
    case 6: {
      // Skills & Experience: At least one skill must be rated (not None)
      const skills = formData.skillsExperience.skills;
      return Object.keys(skills).some(skillName => 
        skills[skillName] && skills[skillName] !== 'None' && skills[skillName].trim() !== ''
      );
    }
    
    case 7: {
      // Declaration step validation (enhanced)
      const declaration = formData.declaration;
      const requiredFields = [
        'socialServiceEnquiry', 
        'convictedOfOffence', 
        'safeguardingInvestigation',
        'criminalConvictions', 
        'healthConditions', 
        'cautionsReprimands'
      ];
      
      // Check if all required fields are answered
      const allAnswered = requiredFields.every(field => 
        declaration[field as keyof Declaration] && 
        ['yes', 'no'].includes(declaration[field as keyof Declaration] as string)
      );
      
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
          const detailValue = declaration[detail as keyof Declaration];
          return !!(detailValue && typeof detailValue === 'string' && detailValue.trim());
        }
        return true;
      });
    }
    
    case 8: {
      // Terms & Policy validation (enhanced)
      const terms = formData.termsPolicy;
      
      // Check consent
      if (!terms.consentToTerms) return false;
      
      // Check signature
      if (!terms.signature || terms.signature.trim() === '') return false;
      
      // Check full name
      if (!terms.fullName || terms.fullName.trim() === '') return false;
      
      // Check date (should be today or recent)
      if (!terms.date) return false;
      
      const signDate = new Date(terms.date);
      if (isNaN(signDate.getTime())) return false;
      
      // Date should not be in the future
      const today = new Date();
      if (signDate > today) return false;
      
      return true;
    }
    
    default:
      return true;
  }
};