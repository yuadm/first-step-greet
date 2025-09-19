import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ArrowRight, CheckCircle, Shield, Calendar, User, MapPin, FileText, Users, Award, AlertTriangle, ScrollText, Menu, X } from 'lucide-react';
import { CompanyProvider, useCompany } from '@/contexts/CompanyContext';
import { JobApplicationData, PersonalInfo, Availability, EmergencyContact, EmploymentHistory, References, SkillsExperience, Declaration, TermsPolicy } from './types';
import { PersonalInfoStep } from './steps/PersonalInfoStep';
import { AvailabilityStep } from './steps/AvailabilityStep';
import { EmergencyContactStep } from './steps/EmergencyContactStep';
import { EmploymentHistoryStep } from './steps/EmploymentHistoryStep';
import { ReferencesStep } from './steps/ReferencesStep';
import { SkillsExperienceStep } from './steps/SkillsExperienceStep';
import { DeclarationStep } from './steps/DeclarationStep';
import { TermsPolicyStep } from './steps/TermsPolicyStep';
import { generateJobApplicationPdf } from '@/lib/job-application-pdf';
import { validateStepEnhanced } from './ValidationLogicEnhanced';
import { ReviewSummaryEnhanced } from './ReviewSummaryEnhanced';

const initialFormData: JobApplicationData = {
  personalInfo: {
    title: '',
    fullName: '',
    email: '',
    confirmEmail: '',
    telephone: '',
    dateOfBirth: '',
    streetAddress: '',
    streetAddress2: '',
    town: '',
    borough: '',
    postcode: '',
    englishProficiency: '',
    otherLanguages: [],
    positionAppliedFor: '',
    personalCareWillingness: '',
    hasDBS: '',
    hasCarAndLicense: '',
    nationalInsuranceNumber: '',
  },
  availability: {
    timeSlots: {},
    hoursPerWeek: '',
    hasRightToWork: '',
  },
  emergencyContact: {
    fullName: '',
    relationship: '',
    contactNumber: '',
    howDidYouHear: '',
  },
  employmentHistory: {
    previouslyEmployed: '',
  },
  references: {
    reference1: {
      name: '', company: '', jobTitle: '', email: '', address: '', address2: '', town: '', contactNumber: '', postcode: ''
    },
    reference2: {
      name: '', company: '', jobTitle: '', email: '', address: '', address2: '', town: '', contactNumber: '', postcode: ''
    }
  },
  skillsExperience: { skills: {} },
  declaration: {
    socialServiceEnquiry: '', convictedOfOffence: '', safeguardingInvestigation: '', 
    criminalConvictions: '', healthConditions: '', cautionsReprimands: ''
  },
  termsPolicy: { consentToTerms: false, signature: '', fullName: '', date: '' }
};

const steps = [
  { id: 1, title: 'Personal Info', icon: User, shortTitle: 'Personal', description: 'Basic information about yourself' },
  { id: 2, title: 'Availability', icon: Calendar, shortTitle: 'Schedule', description: 'Your availability and work preferences' },
  { id: 3, title: 'Emergency Contact', icon: MapPin, shortTitle: 'Contact', description: 'Emergency contact information' },
  { id: 4, title: 'Employment History', icon: FileText, shortTitle: 'History', description: 'Previous work experience' },
  { id: 5, title: 'References', icon: Users, shortTitle: 'References', description: 'Professional references' },
  { id: 6, title: 'Skills & Experience', icon: Award, shortTitle: 'Skills', description: 'Your skills and competencies' },
  { id: 7, title: 'Declaration', icon: AlertTriangle, shortTitle: 'Declaration', description: 'Important declarations' },
  { id: 8, title: 'Terms & Policy', icon: ScrollText, shortTitle: 'Terms', description: 'Agreement and signature' },
  { id: 9, title: 'Review & Submit', icon: CheckCircle, shortTitle: 'Review', description: 'Review and submit your application' },
];

function JobApplicationRedesignedContent() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<JobApplicationData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [honeypotField, setHoneypotField] = useState('');
  const [startTime] = useState(Date.now());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const { companySettings } = useCompany();
  const { toast } = useToast();

  const DRAFT_KEY = 'job_application_draft_v2';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.formData) setFormData(saved.formData);
        if (saved?.currentStep) setCurrentStep(saved.currentStep);
        if (saved?.completedSteps) setCompletedSteps(new Set(saved.completedSteps));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ 
        formData, 
        currentStep,
        completedSteps: Array.from(completedSteps)
      }));
    } catch {}
  }, [formData, currentStep, completedSteps]);

  // Check step completion
  useEffect(() => {
    const newCompletedSteps = new Set(completedSteps);
    for (let i = 1; i <= 8; i++) {
      if (validateStepEnhanced(i, formData)) {
        newCompletedSteps.add(i);
      } else {
        newCompletedSteps.delete(i);
      }
    }
    setCompletedSteps(newCompletedSteps);
  }, [formData]);

  const totalSteps = steps.length;

  const updatePersonalInfo = (field: keyof PersonalInfo, value: string | string[]) => {
    setFormData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, [field]: value } }));
  };

  const updateAvailability = (field: keyof Availability, value: string | Record<string, string[]>) => {
    setFormData(prev => ({ ...prev, availability: { ...prev.availability, [field]: value } }));
  };

  const updateEmergencyContact = (field: keyof EmergencyContact, value: string) => {
    setFormData(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, [field]: value } }));
  };

  const updateEmploymentHistory = (field: keyof EmploymentHistory, value: any) => {
    setFormData(prev => ({ ...prev, employmentHistory: { ...prev.employmentHistory, [field]: value } }));
  };

  const updateReferences = (field: keyof References, value: any) => {
    setFormData(prev => ({ ...prev, references: { ...prev.references, [field]: value } }));
  };

  const updateSkillsExperience = (field: keyof SkillsExperience, value: any) => {
    setFormData(prev => ({ ...prev, skillsExperience: { ...prev.skillsExperience, [field]: value } }));
  };

  const updateDeclaration = (field: keyof Declaration, value: string) => {
    setFormData(prev => ({ ...prev, declaration: { ...prev.declaration, [field]: value } }));
  };

  const updateTermsPolicy = (field: keyof TermsPolicy, value: string | boolean) => {
    setFormData(prev => ({ ...prev, termsPolicy: { ...prev.termsPolicy, [field]: value } }));
  };

  const jumpToStep = (stepId: number) => {
    setCurrentStep(stepId);
    setIsSidebarOpen(false);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Anti-abuse checks
      if (honeypotField.trim() !== '') {
        console.warn('Bot detected: honeypot field filled');
        toast({
          title: "Submission Failed",
          description: "Please try again later.",
          variant: "destructive",
        });
        return;
      }

      const timeTaken = Date.now() - startTime;
      if (timeTaken < 30000) {
        console.warn('Bot detected: submission too fast');
        toast({
          title: "Submission Failed", 
          description: "Please take your time to complete the application.",
          variant: "destructive",
        });
        return;
      }

      const { data: existingApplications, error: checkError } = await supabase
        .from('job_applications')
        .select('id')
        .filter('personal_info->>email', 'eq', formData.personalInfo.email)
        .limit(3);

      if (checkError) {
        console.error('Error checking duplicates:', checkError);
      } else if (existingApplications && existingApplications.length >= 2) {
        toast({
          title: "Application Limit Reached",
          description: "This email address has already been used for the maximum number of applications (2). Please contact us directly if you need assistance.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('job_applications')
        .insert([{
          personal_info: formData.personalInfo,
          availability: formData.availability,
          emergency_contact: formData.emergencyContact,
          employment_history: formData.employmentHistory,
          reference_info: formData.references,
          skills_experience: formData.skillsExperience,
          declarations: formData.declaration,
          consent: formData.termsPolicy,
          status: 'new'
        }] as any);

      if (error) throw error;

      setIsSubmitted(true);
      localStorage.removeItem(DRAFT_KEY);
      toast({
        title: "Application Submitted",
        description: "Your job application has been submitted successfully. We'll be in touch soon!",
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
        <Card className="w-full max-w-md mx-auto shadow-xl">
          <CardHeader className="text-center pb-6">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-700">Application Submitted!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6 p-6">
            <p className="text-muted-foreground">
              Thank you for your interest in joining our team. We have received your application and will review it shortly.
            </p>
            <Button onClick={() => {
              setFormData(initialFormData);
              setCurrentStep(1);
              setIsSubmitted(false);
              window.location.href = '/';
            }} className="w-full">
              Return to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep data={formData.personalInfo} updateData={updatePersonalInfo} />;
      case 2:
        return <AvailabilityStep data={formData.availability} updateData={updateAvailability} />;
      case 3:
        return <EmergencyContactStep data={formData.emergencyContact} updateData={updateEmergencyContact} />;
      case 4:
        return <EmploymentHistoryStep data={formData.employmentHistory} updateData={updateEmploymentHistory} />;
      case 5:
        return <ReferencesStep data={formData.references} employmentHistory={formData.employmentHistory} updateData={updateReferences} />;
      case 6:
        return <SkillsExperienceStep data={formData.skillsExperience} updateData={updateSkillsExperience} />;
      case 7:
        return <DeclarationStep data={formData.declaration} updateData={updateDeclaration} />;
      case 8:
        return <TermsPolicyStep data={formData.termsPolicy} updateData={updateTermsPolicy} />;
      case 9:
        return <ReviewSummaryEnhanced data={formData} onEdit={jumpToStep} />;
      default:
        return null;
    }
  };

  const currentStepData = steps.find(step => step.id === currentStep);
  const canProceed = currentStep === 9 ? Array.from(completedSteps).length >= 8 : validateStepEnhanced(currentStep, formData);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {companySettings.logo ? (
              <img
                src={companySettings.logo}
                alt={companySettings.name}
                className="h-8 w-8 object-contain"
              />
            ) : (
              <Shield className="h-8 w-8 text-primary" />
            )}
            <div>
              <div className="font-semibold text-lg">{companySettings.name}</div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-30 w-80 bg-background border-r transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Desktop Header */}
          <div className="hidden lg:block p-6 border-b">
            <div className="flex items-center gap-3 mb-4">
              {companySettings.logo ? (
                <img
                  src={companySettings.logo}
                  alt={companySettings.name}
                  className="h-10 w-10 object-contain"
                />
              ) : (
                <Shield className="h-10 w-10 text-primary" />
              )}
              <div>
                <div className="font-bold text-xl">{companySettings.name}</div>
                <p className="text-sm text-muted-foreground">{companySettings.tagline}</p>
              </div>
            </div>
            <h1 className="text-2xl font-bold">Job Application</h1>
          </div>

          {/* Progress */}
          <div className="p-6">
            <div className="mb-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Progress</span>
                <span>{completedSteps.size}/8 Complete</span>
              </div>
              <div className="w-full bg-secondary/20 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedSteps.size / 8) * 100}%` }}
                />
              </div>
            </div>

            {/* Step Navigation */}
            <div className="space-y-2">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => jumpToStep(step.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                    currentStep === step.id
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : completedSteps.has(step.id) || step.id === 9
                        ? 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30'
                        : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${
                      currentStep === step.id
                        ? 'bg-primary-foreground/20'
                        : completedSteps.has(step.id)
                          ? 'bg-green-500/20'
                          : 'bg-muted'
                    }`}>
                      {completedSteps.has(step.id) && step.id !== 9 ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <step.icon className={`h-4 w-4 ${
                          currentStep === step.id 
                            ? 'text-primary-foreground' 
                            : 'text-muted-foreground'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{step.shortTitle}</div>
                      <div className={`text-xs truncate ${
                        currentStep === step.id 
                          ? 'text-primary-foreground/70' 
                          : 'text-muted-foreground'
                      }`}>
                        {step.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          <div className="max-w-4xl mx-auto p-4 lg:p-8">
            {/* Step Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  {currentStepData && <currentStepData.icon className="h-6 w-6 text-primary" />}
                </div>
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold">{currentStepData?.title}</h2>
                  <p className="text-muted-foreground">{currentStepData?.description}</p>
                </div>
              </div>
              
              {/* Breadcrumb */}
              <div className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </div>
            </div>

            {/* Form Content */}
            <Card className="shadow-lg">
              <CardContent className="p-6 lg:p-8">
                {renderStep()}
                
                {/* Invisible honeypot field */}
                <div style={{ position: 'absolute', left: '-9999px', visibility: 'hidden' }} aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    name="website"
                    type="text"
                    value={honeypotField}
                    onChange={(e) => setHoneypotField(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>
                
                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="sm:w-auto"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  
                  <div className="flex gap-3">
                    {currentStep === totalSteps ? (
                      <Button
                        onClick={handleSubmit}
                        disabled={!canProceed || isSubmitting}
                        className="flex-1 sm:flex-none"
                        size="lg"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Application'}
                        <CheckCircle className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={nextStep}
                        disabled={!canProceed}
                        className="flex-1 sm:flex-none"
                        size="lg"
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export function JobApplicationRedesigned() {
  return (
    <CompanyProvider>
      <JobApplicationRedesignedContent />
    </CompanyProvider>
  );
}