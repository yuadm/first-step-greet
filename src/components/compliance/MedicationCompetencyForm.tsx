import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronDown, ChevronRight, Upload, Check, Shield, Users, Heart, FileText, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CompetencyItem {
  id: string;
  performanceCriteria: string;
  examples: string;
  competent: "yes" | "not-yet" | "";
  comments: string;
}

interface MedicationCompetencyData {
  // Basic info
  employeeId?: string;
  employeeName: string;
  
  // Compliance actions
  procedureAcknowledged: boolean;
  certificateUploaded: boolean;
  certificateFile?: File;
  checklistCompleted: boolean;
  
  // Competency checklist
  competencyItems: CompetencyItem[];
  
  // Employee acknowledgement
  acknowledgementConfirmed: boolean;
  signature: string;
  signatureDate: string;
  
  // Status
  status: "draft" | "completed";
}

interface MedicationCompetencyFormProps {
  complianceTypeId: string;
  employeeId?: string;
  employeeName?: string;
  periodIdentifier: string;
  onComplete: () => void;
}

const competencyFramework: Omit<CompetencyItem, 'competent' | 'comments'>[] = [
  {
    id: 'infection-control-precautions',
    performanceCriteria: 'Routinely applies standard precautions for infection control and any other relevant health and safety measures',
    examples: 'Washes hands before assisting with medicines. Wears gloves when helping with creams'
  },
  {
    id: 'check-mar-records',
    performanceCriteria: 'Checks all medication administration records are available, up to date, legible and understood.',
    examples: 'Direct observation / discussion'
  },
  {
    id: 'report-discrepancies',
    performanceCriteria: 'Reports any discrepancies, ambiguities, or omissions to the line manager.',
    examples: 'Specific incidents / possible questions / discussion'
  },
  {
    id: 'read-mar-accurately',
    performanceCriteria: 'Reads the medication administration record accurately, referring any illegible directions to the line manager before it is administered.',
    examples: 'Specific incidents / possible questions / discussion. Further information can be found in the medication Information leaflet.'
  },
  {
    id: 'check-recent-medication',
    performanceCriteria: 'Checks that the individual has not taken any medication recently, and is aware of the appropriate timing of doses',
    examples: 'Checks the administration record, confirms with the individual.'
  },
  {
    id: 'obtain-consent-support',
    performanceCriteria: 'Obtains the individual\'s consent and offers information, support and reassurance throughout, in a manner which encourages their co-operation, and which is appropriate to their needs and concerns.',
    examples: 'Direct observation / discussion with individual'
  },
  {
    id: 'six-rights-check',
    performanceCriteria: 'Checks the identity of the individual who is to receive the medication before it is administered, and selects, checks, and prepares correctly the medication according to the medication administration record. (The six rights) • The right person • The right medicine • The right dose • The right time • The right route • The right to refuse',
    examples: 'Confidently and accurately: 1. Checks the individual\'s name matches that on the pack and on the administration record. 2. Selects the medication, checking that the name on the pack matches that on the administration record. 3. Selects the correct dose, according to the pack and the administration record. 4. Selects the correct timing of the dose according to that on the pack and on the administration record 5. Selects the correct route of administration. 6. Is aware of the person\'s right to refuse to take medication.'
  },
  {
    id: 'encourage-self-management',
    performanceCriteria: 'Assists the individual to be as self-managing as possible. Refers any problems or queries to the line manager',
    examples: 'Direct observation / discussion with individual'
  },
  {
    id: 'preserve-privacy-dignity',
    performanceCriteria: 'Ensure the persons privacy and dignity is preserved at all times.',
    examples: 'Direct observation / discussion with individual'
  },
  {
    id: 'select-route-prepare',
    performanceCriteria: 'Selects the route for the administration of medication according to the care plan and the drug and prepares the individual appropriately.',
    examples: 'Offers a full glass of water with tablets and capsules. Ensures individual is sitting upright for oral medicines. Notes any special instructions, e.g. do not crush, allow to dissolve under the tongue etc.'
  },
  {
    id: 'safely-assist-medication',
    performanceCriteria: 'Safely assists with the medication. • Following the written instructions and in line with legislation and local policies • In a way which minimizes pain, discomfort and trauma to the individual',
    examples: 'Direct observation / discussion with individual.'
  },
  {
    id: 'report-immediate-problems',
    performanceCriteria: 'Reports any immediate problems appropriately',
    examples: 'May include refusal, inability to take medication etc.'
  },
  {
    id: 'confirm-medication-taken',
    performanceCriteria: 'Checks and confirms that the individual actually takes the medication',
    examples: 'Direct observation'
  },
  {
    id: 'monitor-adverse-effects',
    performanceCriteria: 'Monitors the individual\'s condition throughout, recognises any obvious adverse effects and takes the appropriate action without delay',
    examples: 'Adverse effects may include swelling, skin rash, fainting / giddiness, constipation, drowsiness. Checks medication information leaflet.'
  },
  {
    id: 'accurate-documentation',
    performanceCriteria: 'Clearly and accurately enters relevant information in the correct records.',
    examples: 'Accurately documents assistance given, doses refused or missed for other reasons'
  },
  {
    id: 'maintain-medication-security',
    performanceCriteria: 'Maintains security of medication throughout the process and returns it to the correct place for storage',
    examples: 'Awareness of other people in the household, grandchildren, visitors etc. Attention to instructions to store in a fridge, etc.'
  },
  {
    id: 'monitor-rotate-stocks',
    performanceCriteria: 'Monitors and rotates stocks of medication, paying attention to appropriate storage conditions, and reports any discrepancies in stocks immediately to the relevant person (line manager)',
    examples: 'Ensures one pack of a medicine is used before starting the next.'
  },
  {
    id: 'dispose-expired-medication',
    performanceCriteria: 'Disposes of out of date and part-used medication in accordance with legal and local requirements, with the permission of the client',
    examples: 'Direct observation / discussion'
  },
  {
    id: 'return-records-confidentiality',
    performanceCriteria: 'Returns medication administration records to the agreed place for storage and always maintains the confidentiality of information relating to the individual',
    examples: 'Direct observation'
  }
];

export function MedicationCompetencyForm({
  complianceTypeId,
  employeeId,
  employeeName,
  periodIdentifier,
  onComplete
}: MedicationCompetencyFormProps) {
  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const [formData, setFormData] = useState<MedicationCompetencyData>({
    employeeId,
    employeeName: employeeName || "",
    procedureAcknowledged: false,
    certificateUploaded: false,
    checklistCompleted: false,
    competencyItems: competencyFramework.map(item => ({
      ...item,
      competent: "",
      comments: ""
    })),
    acknowledgementConfirmed: false,
    signature: "",
    signatureDate: format(new Date(), "yyyy-MM-dd"),
    status: "draft"
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleCompetencyChange = (id: string, field: 'competent' | 'comments', value: string) => {
    setFormData(prev => ({
      ...prev,
      competencyItems: prev.competencyItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
    
    // Clear any errors for this field
    if (formErrors[`${id}_${field}`]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${id}_${field}`];
        return newErrors;
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, JPEG, or PNG file",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        certificateFile: file,
        certificateUploaded: true
      }));
      
      toast({
        title: "Certificate uploaded",
        description: `File "${file.name}" has been selected for upload`,
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate compliance actions
    if (!formData.procedureAcknowledged) {
      errors.procedureAcknowledged = "You must acknowledge reading the procedure";
    }
    
    if (!formData.certificateUploaded) {
      errors.certificateUploaded = "Training certificate upload is required";
    }

    // Validate competency checklist
    formData.competencyItems.forEach(item => {
      if (!item.competent) {
        errors[`${item.id}_competent`] = "Competency assessment required";
      }
      if (!item.comments.trim()) {
        errors[`${item.id}_comments`] = "Comments required for all items";
      }
    });

    // Validate acknowledgement
    if (!formData.acknowledgementConfirmed) {
      errors.acknowledgementConfirmed = "Final acknowledgement is required";
    }
    
    if (!formData.signature.trim()) {
      errors.signature = "Signature is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkCompletionStatus = () => {
    const allCompetent = formData.competencyItems.every(item => item.competent !== "");
    const allCommentsProvided = formData.competencyItems.every(item => item.comments.trim() !== "");
    
    const checklistCompleted = allCompetent && allCommentsProvided;
    
    if (checklistCompleted !== formData.checklistCompleted) {
      setFormData(prev => ({ ...prev, checklistCompleted }));
    }
  };

  useEffect(() => {
    checkCompletionStatus();
  }, [formData.competencyItems]);

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Upload certificate file if provided
      let certificateUrl = null;
      if (formData.certificateFile) {
        const fileExt = formData.certificateFile.name.split('.').pop();
        const fileName = `${employeeId || 'temp'}-medication-cert-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('compliance-documents')
          .upload(fileName, formData.certificateFile);
        
        if (uploadError) throw uploadError;
        certificateUrl = uploadData.path;
      }

      // Create compliance record
      const { error: recordError } = await supabase
        .from('compliance_period_records')
        .insert({
          employee_id: employeeId,
          compliance_type_id: complianceTypeId,
          period_identifier: periodIdentifier,
          completion_date: format(new Date(), 'yyyy-MM-dd'),
          completion_method: 'medication_competency',
          status: 'completed',
          notes: JSON.stringify({
            competencyItems: formData.competencyItems,
            acknowledgement: {
              confirmed: formData.acknowledgementConfirmed,
              signature: formData.signature,
              date: formData.signatureDate
            },
            certificateUrl
          })
        });

      if (recordError) throw recordError;

      toast({
        title: "Medication competency completed",
        description: "Your medication competency assessment has been submitted successfully",
      });

      onComplete();
    } catch (error) {
      console.error('Error submitting medication competency:', error);
      toast({
        title: "Error",
        description: "Failed to submit medication competency. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const completedCount = formData.competencyItems.filter(item => item.competent && item.comments.trim()).length;
  const totalCount = formData.competencyItems.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <Card className="card-premium">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Heart className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Medication Assessment and Competency Procedure
          </CardTitle>
          <CardDescription className="text-lg">
            Complete your medication administration competency assessment
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Progress Indicator */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Competency Checklist Progress</span>
              <span className="font-medium">{completedCount}/{totalCount} items completed</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 1. Overview Section */}
      <Card>
        <Collapsible open={overviewExpanded} onOpenChange={setOverviewExpanded}>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  Procedure Overview
                </CardTitle>
                {overviewExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                <p className="text-foreground leading-relaxed">
                  All Care/Support staff must complete training in the Administration of Medication as part of their induction. 
                  Training includes delivered sessions and a competency assessment. Staff who successfully complete the training 
                  will receive a certificate of competence.
                </p>
                <p className="text-foreground leading-relaxed mt-3">
                  If there are significant changes to the medication administration process, staff will be required to 
                  undertake refresher training.
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 2. Key Requirements Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            Key Requirements for Staff
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            {
              title: "Infection Control",
              items: [
                "Wash hands before assisting with medicines",
                "Wear gloves when applying creams or handling medication where needed"
              ]
            },
            {
              title: "Medication Administration Records (MAR)",
              items: [
                "Ensure records are up to date, accurate, and legible",
                "Report any errors, discrepancies, or unclear instructions to your line manager"
              ]
            },
            {
              title: "The Six Rights of Medication",
              items: [
                "The right person",
                "The right medicine", 
                "The right dose",
                "The right time",
                "The right route (oral, topical, inhaled, etc.)",
                "The right to refuse"
              ]
            },
            {
              title: "Respect and Consent",
              items: [
                "Obtain the individual's consent before giving medication",
                "Ensure privacy and dignity are maintained at all times"
              ]
            },
            {
              title: "Safe Assistance",
              items: [
                "Support service users to self-manage whenever possible",
                "Follow instructions exactly as written in care plans and MAR sheets",
                "Accurately document assistance, refusals, and any issues"
              ]
            },
            {
              title: "Medication Storage and Disposal",
              items: [
                "Keep medication secure and stored correctly (e.g., fridge if required)",
                "Rotate stock so older medication is used first",
                "Dispose of expired or part-used medication safely, with client permission"
              ]
            }
          ].map((section, index) => (
            <div key={index} className="space-y-3">
              <h4 className="font-semibold text-lg text-primary">{section.title}</h4>
              <ul className="space-y-2">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 3. Competency Assessment Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            Competency Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50/50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
            <p className="text-foreground leading-relaxed">
              Assessments will be carried out by approved assessors. Competence will be judged through direct observation, 
              discussion, and record checks. Staff not yet competent will receive additional training and reassessment.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Responsibilities of Staff Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Responsibilities of Staff
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50/50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200/50 dark:border-red-800/50">
            <p className="text-foreground font-semibold mb-3">Health and Social Care staff must:</p>
            <ul className="space-y-2">
              {[
                "Only carry out tasks within their training and competence",
                "Not put themselves or service users at risk",
                "Report concerns immediately to their line manager"
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 5. Compliance Action Required Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            Compliance Action Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Acknowledge Procedure */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="acknowledge-procedure"
              checked={formData.procedureAcknowledged}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, procedureAcknowledged: !!checked }))
              }
              className="mt-1"
            />
            <div className="space-y-1">
              <Label 
                htmlFor="acknowledge-procedure"
                className={`text-base font-medium cursor-pointer ${formErrors.procedureAcknowledged ? 'text-red-500' : ''}`}
              >
                Acknowledge they have read and understood this procedure
              </Label>
              {formErrors.procedureAcknowledged && (
                <p className="text-red-500 text-sm">{formErrors.procedureAcknowledged}</p>
              )}
            </div>
          </div>

          {/* Upload Certificate */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Upload Medication Training Certificate</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-3">
                Upload your medication training certificate (PDF, JPEG, PNG - Max 5MB)
              </p>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="max-w-xs mx-auto"
              />
              {formData.certificateUploaded && (
                <div className="mt-3 flex items-center justify-center gap-2 text-green-600">
                  <Check className="h-4 w-4" />
                  <span className="text-sm">Certificate uploaded successfully</span>
                </div>
              )}
            </div>
            {formErrors.certificateUploaded && (
              <p className="text-red-500 text-sm">{formErrors.certificateUploaded}</p>
            )}
          </div>

          {/* Competency Checklist Status */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="checklist-completed"
              checked={formData.checklistCompleted}
              disabled={true}
              className="mt-1"
            />
            <div className="space-y-1">
              <Label 
                htmlFor="checklist-completed"
                className="text-base font-medium cursor-default"
              >
                Complete the digital competency checklist (see section below)
              </Label>
              <p className="text-sm text-muted-foreground">
                {formData.checklistCompleted 
                  ? "✓ Competency checklist completed" 
                  : `${completedCount}/${totalCount} items completed`
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6. Digital Competency Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            Digital Competency Checklist
          </CardTitle>
          <CardDescription>
            Complete the competency assessment for each performance criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Performance Criteria</TableHead>
                  <TableHead className="w-[35%]">Examples / Evidence</TableHead>
                  <TableHead className="w-[15%]">Competent</TableHead>
                  <TableHead className="w-[20%]">Comments / Further Training Needs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.competencyItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.performanceCriteria}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.examples}</TableCell>
                    <TableCell>
                      <Select
                        value={item.competent}
                        onValueChange={(value) => handleCompetencyChange(item.id, 'competent', value)}
                      >
                        <SelectTrigger className={formErrors[`${item.id}_competent`] ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="not-yet">Not Yet</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors[`${item.id}_competent`] && (
                        <p className="text-red-500 text-xs mt-1">{formErrors[`${item.id}_competent`]}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Textarea
                        placeholder="Add comments or training needs..."
                        value={item.comments}
                        onChange={(e) => handleCompetencyChange(item.id, 'comments', e.target.value)}
                        className={`min-h-[80px] ${formErrors[`${item.id}_comments`] ? "border-red-500" : ""}`}
                      />
                      {formErrors[`${item.id}_comments`] && (
                        <p className="text-red-500 text-xs mt-1">{formErrors[`${item.id}_comments`]}</p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 7. Employee Acknowledgement Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Check className="h-5 w-5 text-primary" />
            Employee Acknowledgement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Final Confirmation */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="final-acknowledgement"
              checked={formData.acknowledgementConfirmed}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, acknowledgementConfirmed: !!checked }))
              }
              className="mt-1"
            />
            <div className="space-y-1">
              <Label 
                htmlFor="final-acknowledgement"
                className={`text-base font-medium cursor-pointer ${formErrors.acknowledgementConfirmed ? 'text-red-500' : ''}`}
              >
                I confirm that I have read, understood, and agree to comply with the Medication Assessment and Competency Procedure.
              </Label>
              {formErrors.acknowledgementConfirmed && (
                <p className="text-red-500 text-sm">{formErrors.acknowledgementConfirmed}</p>
              )}
            </div>
          </div>

          {/* Signature */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Signature (typed or drawn)</Label>
            <Input
              placeholder="Type your full name as signature"
              value={formData.signature}
              onChange={(e) => setFormData(prev => ({ ...prev, signature: e.target.value }))}
              className={formErrors.signature ? "border-red-500" : ""}
            />
            {formErrors.signature && (
              <p className="text-red-500 text-sm">{formErrors.signature}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Date</Label>
            <Input
              type="date"
              value={formData.signatureDate}
              onChange={(e) => setFormData(prev => ({ ...prev, signatureDate: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      {Object.keys(formErrors).length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please complete all required fields before submitting the form.
          </AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={onComplete}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-gradient-primary hover:opacity-90"
        >
          <Check className="mr-2 h-4 w-4" />
          {isLoading ? "Submitting..." : "Submit Competency Assessment"}
        </Button>
      </div>
    </div>
  );
}