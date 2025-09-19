import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, User, Calendar, MapPin, FileText, Users, Award, AlertTriangle, ScrollText, CheckCircle } from 'lucide-react';
import type { JobApplicationData } from './types';
import { getTimeSlotMappings, mapTimeSlotIds } from '@/utils/timeSlotUtils';

interface Props {
  data: JobApplicationData;
  onEdit: (stepId: number) => void;
}

export function ReviewSummaryEnhanced({ data, onEdit }: Props) {
  const [timeSlotMappings, setTimeSlotMappings] = useState<Record<string, string>>({});

  useEffect(() => {
    getTimeSlotMappings().then(setTimeSlotMappings);
  }, []);

  const pi = data.personalInfo || ({} as any);
  const av = data.availability || ({} as any);
  const ec = data.emergencyContact || ({} as any);
  const eh = data.employmentHistory || ({} as any);
  const refs: any[] = Object.values<any>(data.references || {});
  const skills = data.skillsExperience?.skills || {};
  const dec = data.declaration || ({} as any);
  const tp = data.termsPolicy || ({} as any);

  // Helper function to format date from YYYY-MM-DD to DD/MM/YYYY
  const formatDateToDDMMYYYY = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Not provided';
    
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString; // Return original if conversion fails
    }
  };

  // Map time slots to readable labels
  const mappedTimeSlots = av.timeSlots ? mapTimeSlotIds(av.timeSlots, timeSlotMappings) : {};

  const sections = [
    {
      id: 1,
      title: 'Personal Information',
      icon: User,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Title" value={pi.title} />
          <Field label="Full Name" value={pi.fullName} />
          <Field label="Email" value={pi.email} />
          <Field label="Telephone" value={pi.telephone} />
          <Field label="Date of Birth" value={formatDateToDDMMYYYY(pi.dateOfBirth)} />
          <Field label="Address" value={`${pi.streetAddress}${pi.streetAddress2 ? ', ' + pi.streetAddress2 : ''}`} />
          <Field label="Town" value={pi.town} />
          <Field label="Borough" value={pi.borough} />
          <Field label="Postcode" value={pi.postcode} />
          <Field label="English Proficiency" value={pi.englishProficiency} />
          <Field label="Other Languages" value={(pi.otherLanguages || []).join(', ') || 'None'} />
          <Field label="Position Applied For" value={pi.positionAppliedFor} />
          <Field label="Personal Care" value={pi.personalCareWillingness} />
          <Field label="DBS Check" value={pi.hasDBS} />
          <Field label="Car & License" value={pi.hasCarAndLicense} />
          <Field label="NI Number" value={pi.nationalInsuranceNumber} />
        </div>
      )
    },
    {
      id: 2,
      title: 'Availability',
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Hours per Week" value={av.hoursPerWeek} />
            <Field label="Right to Work (UK)" value={av.hasRightToWork} />
          </div>
          {Object.keys(mappedTimeSlots).length > 0 && (
            <div>
              <div className="text-sm font-medium mb-3">Selected Time Slots</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(mappedTimeSlots).map(([slotLabel, days]) => (
                  <div key={slotLabel} className="text-sm p-3 bg-muted/30 rounded-lg">
                    <span className="font-medium text-primary">{slotLabel}:</span>
                    <div className="text-muted-foreground">
                      {(Array.isArray(days) ? days : [days]).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 3,
      title: 'Emergency Contact',
      icon: MapPin,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" value={ec.fullName} />
          <Field label="Relationship" value={ec.relationship} />
          <Field label="Contact Number" value={ec.contactNumber} />
          <Field label="How did you hear about us?" value={ec.howDidYouHear} />
        </div>
      )
    },
    {
      id: 4,
      title: 'Employment History',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <Field label="Previously Employed" value={eh.previouslyEmployed} />
          {eh.previouslyEmployed === 'yes' && eh.recentEmployer && (
            <div className="p-4 bg-muted/20 rounded-lg">
              <div className="text-sm font-semibold mb-3 text-primary">Most Recent Employer</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="Company" value={eh.recentEmployer.company} />
                <Field label="Contact Name" value={eh.recentEmployer.name} />
                <Field label="Email" value={eh.recentEmployer.email} />
                <Field label="Position Held" value={eh.recentEmployer.position} />
                <Field label="From" value={formatDateToDDMMYYYY(eh.recentEmployer.from)} />
                <Field label="To" value={formatDateToDDMMYYYY(eh.recentEmployer.to)} />
                <Field label="Reason for Leaving" value={eh.recentEmployer.reasonForLeaving} />
              </div>
              {eh.recentEmployer.keyTasks && (
                <div className="mt-3">
                  <div className="text-sm font-medium mb-1">Key Tasks</div>
                  <p className="text-sm text-muted-foreground bg-background/50 p-3 rounded border">
                    {eh.recentEmployer.keyTasks}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      id: 5,
      title: 'References',
      icon: Users,
      content: (
        <div className="space-y-4">
          {refs.filter(r => r && (r.name || r.company || r.email)).length === 0 ? (
            <p className="text-muted-foreground">No references provided.</p>
          ) : (
            refs
              .filter(r => r && (r.name || r.company || r.email))
              .map((ref, idx) => (
                <div key={idx} className="p-4 bg-muted/20 rounded-lg">
                  <div className="text-sm font-semibold mb-3 text-primary">Reference {idx + 1}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <Field label="Name" value={ref.name} />
                    <Field label="Company" value={ref.company} />
                    <Field label="Job Title" value={ref.jobTitle} />
                    <Field label="Email" value={ref.email} />
                    <Field label="Contact Number" value={ref.contactNumber} />
                    <Field label="Address" value={`${ref.address}${ref.address2 ? ', ' + ref.address2 : ''}`} />
                    <Field label="Town" value={ref.town} />
                    <Field label="Postcode" value={ref.postcode} />
                  </div>
                </div>
              ))
          )}
        </div>
      )
    },
    {
      id: 6,
      title: 'Skills & Experience',
      icon: Award,
      content: (
        <div>
          {Object.keys(skills).length === 0 ? (
            <p className="text-muted-foreground">No skills rated.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(skills)
                .filter(([, level]) => level && level !== 'None')
                .map(([skillName, level]) => (
                  <div key={skillName} className="p-3 bg-muted/20 rounded-lg">
                    <div className="font-medium text-sm">{skillName}</div>
                    <div className={`text-xs font-medium mt-1 ${
                      level === 'Good' ? 'text-green-600' : 
                      level === 'Basic' ? 'text-yellow-600' : 'text-muted-foreground'
                    }`}>
                      {level}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )
    },
    {
      id: 7,
      title: 'Declaration',
      icon: AlertTriangle,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Social Service Enquiry" value={dec.socialServiceEnquiry} />
            <Field label="Convicted of Offence" value={dec.convictedOfOffence} />
            <Field label="Safeguarding Investigation" value={dec.safeguardingInvestigation} />
            <Field label="Criminal Convictions" value={dec.criminalConvictions} />
            <Field label="Health Conditions" value={dec.healthConditions} />
            <Field label="Cautions / Reprimands" value={dec.cautionsReprimands} />
          </div>
          <div className="space-y-3">
            {dec.socialServiceDetails && <DetailField label="Social Service Details" value={dec.socialServiceDetails} />}
            {dec.convictedDetails && <DetailField label="Conviction Details" value={dec.convictedDetails} />}
            {dec.safeguardingDetails && <DetailField label="Safeguarding Details" value={dec.safeguardingDetails} />}
            {dec.criminalDetails && <DetailField label="Criminal Details" value={dec.criminalDetails} />}
            {dec.healthDetails && <DetailField label="Health Details" value={dec.healthDetails} />}
            {dec.cautionsDetails && <DetailField label="Caution Details" value={dec.cautionsDetails} />}
          </div>
        </div>
      )
    },
    {
      id: 8,
      title: 'Terms & Policy',
      icon: ScrollText,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field 
              label="Consent to Terms" 
              value={tp.consentToTerms ? 'Agreed' : 'Not Agreed'}
              className={tp.consentToTerms ? 'text-green-600' : 'text-red-600'}
            />
            <Field label="Signature" value={tp.signature} />
            <Field label="Full Name" value={tp.fullName} />
            <Field label="Date" value={formatDateToDDMMYYYY(tp.date)} />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="p-4 bg-primary/5 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Review Your Application</h2>
        <p className="text-muted-foreground">
          Please review all information carefully before submitting. You can edit any section by clicking the edit button.
        </p>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <Card key={section.id} className="shadow-sm border-l-4 border-l-primary/20">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(section.id)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {section.content}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ready to Submit?</h3>
          <p className="text-muted-foreground mb-4">
            Once you submit your application, you won't be able to make changes. 
            Please ensure all information is accurate and complete.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value, className }: { label: string; value?: string; className?: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
      <div className={`text-sm font-medium ${className || ''}`}>
        {value || 'Not provided'}
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="p-3 bg-muted/30 rounded-lg">
      <div className="text-sm font-medium mb-2">{label}</div>
      <p className="text-sm text-muted-foreground whitespace-pre-line">
        {value || 'No details provided'}
      </p>
    </div>
  );
}