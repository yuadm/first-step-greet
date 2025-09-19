import { References, EmploymentHistory } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit3 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ReferencesStepProps {
  data: References;
  employmentHistory: EmploymentHistory;
  updateData: (field: keyof References, value: any) => void;
}

export function ReferencesStep({ data, employmentHistory, updateData }: ReferencesStepProps) {
  const [autoFilledFields, setAutoFilledFields] = useState<{
    reference1: boolean;
    reference2: boolean;
  }>({ reference1: false, reference2: false });

  const updateReference = (refNumber: 'reference1' | 'reference2', field: string, value: string) => {
    updateData(refNumber, { ...data[refNumber], [field]: value });
  };

  // Count employers to determine reference types
  const countEmployers = () => {
    let count = 0;
    
    // Count recent employer if present
    if (employmentHistory.recentEmployer?.company?.trim() || employmentHistory.recentEmployer?.name?.trim()) {
      count += 1;
    }
    
    // Count previous employers
    if (employmentHistory.previousEmployers?.length) {
      count += employmentHistory.previousEmployers.filter(emp => 
        emp.company?.trim() || emp.name?.trim()
      ).length;
    }
    
    return count;
  };

  const employerCount = countEmployers();
  
  // Determine reference types based on employer count
  const getReferenceType = (refNumber: 'reference1' | 'reference2') => {
    if (employerCount >= 2) {
      return 'Employer Reference';
    } else if (employerCount === 1) {
      return refNumber === 'reference1' ? 'Employer Reference' : 'Character Reference';
    } else {
      return 'Character Reference';
    }
  };

  const getHelperText = () => {
    if (employerCount >= 2) {
      return 'Please provide two professional references from previous employers. We\'ve pre-filled the details from your employment history.';
    } else if (employerCount === 1) {
      return 'Please provide one professional reference from your previous employer and one character reference. We\'ve pre-filled your employer reference.';
    } else {
      return 'Please provide two character references.';
    }
  };

  // Auto-fill references based on employment history
  useEffect(() => {
    if (!employmentHistory) return;

    const employers = [];
    
    // Add recent employer if exists
    if (employmentHistory.recentEmployer?.company?.trim()) {
      employers.push(employmentHistory.recentEmployer);
    }
    
    // Add previous employers if they exist
    if (employmentHistory.previousEmployers?.length) {
      employers.push(...employmentHistory.previousEmployers.filter(emp => 
        emp.company?.trim() || emp.name?.trim()
      ));
    }

    // Auto-fill reference 1 if we have at least 1 employer
    if (employers.length >= 1 && !autoFilledFields.reference1) {
      const employer = employers[0];
      updateData('reference1', {
        name: employer.name || '',
        company: employer.company || '',
        jobTitle: employer.position || '',
        email: employer.email || '',
        address: employer.address || '',
        address2: employer.address2 || '',
        town: employer.town || '',
        contactNumber: employer.telephone || '',
        postcode: employer.postcode || '',
      });
      setAutoFilledFields(prev => ({ ...prev, reference1: true }));
    }

    // Auto-fill reference 2 if we have at least 2 employers
    if (employers.length >= 2 && !autoFilledFields.reference2) {
      const employer = employers[1];
      updateData('reference2', {
        name: employer.name || '',
        company: employer.company || '',
        jobTitle: employer.position || '',
        email: employer.email || '',
        address: employer.address || '',
        address2: employer.address2 || '',
        town: employer.town || '',
        contactNumber: employer.telephone || '',
        postcode: employer.postcode || '',
      });
      setAutoFilledFields(prev => ({ ...prev, reference2: true }));
    }
  }, [employmentHistory, updateData, autoFilledFields]);

  const clearAutoFill = (refNumber: 'reference1' | 'reference2') => {
    updateData(refNumber, {
      name: '',
      company: '',
      jobTitle: '',
      email: '',
      address: '',
      address2: '',
      town: '',
      contactNumber: '',
      postcode: '',
    });
    setAutoFilledFields(prev => ({ ...prev, [refNumber]: false }));
  };

  const isEmployerReference = (refNumber: 'reference1' | 'reference2') => {
    return getReferenceType(refNumber) === 'Employer Reference';
  };

  const getCompanyName = (refNumber: 'reference1' | 'reference2') => {
    if (!employmentHistory) return '';
    
    const employers = [];
    if (employmentHistory.recentEmployer?.company?.trim()) {
      employers.push(employmentHistory.recentEmployer);
    }
    if (employmentHistory.previousEmployers?.length) {
      employers.push(...employmentHistory.previousEmployers.filter(emp => 
        emp.company?.trim() || emp.name?.trim()
      ));
    }
    
    if (refNumber === 'reference1' && employers[0]) {
      return employers[0].company || '';
    }
    if (refNumber === 'reference2' && employers[1]) {
      return employers[1].company || '';
    }
    return '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">References</h3>
        <p className="text-muted-foreground mb-6">
          {getHelperText()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getReferenceType('reference1')} 1
                {isEmployerReference('reference1') && autoFilledFields.reference1 && (
                  <Badge variant="secondary" className="text-xs">
                    Auto-filled
                  </Badge>
                )}
              </CardTitle>
              {isEmployerReference('reference1') && getCompanyName('reference1') && (
                <p className="text-sm text-muted-foreground mt-1">
                  From: {getCompanyName('reference1')}
                </p>
              )}
            </div>
            {isEmployerReference('reference1') && autoFilledFields.reference1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => clearAutoFill('reference1')}
                className="text-xs"
              >
                <Edit3 className="w-3 h-3 mr-1" />
                Use Different Person
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">** All fields are required</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <Label>Name *</Label>
              <Input
                value={data.reference1?.name || ''}
                onChange={(e) => updateReference('reference1', 'name', e.target.value)}
                placeholder="Name"
                required
              />
            </div>
            <div>
              <Label>Company *</Label>
              <Input
                value={data.reference1?.company || ''}
                onChange={(e) => updateReference('reference1', 'company', e.target.value)}
                placeholder="Company"
                required
              />
            </div>
            <div>
              <Label>Job Title *</Label>
              <Input
                value={data.reference1?.jobTitle || ''}
                onChange={(e) => updateReference('reference1', 'jobTitle', e.target.value)}
                placeholder="Job Title"
                required
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={data.reference1?.email || ''}
                onChange={(e) => updateReference('reference1', 'email', e.target.value)}
                placeholder="Email"
                required
              />
            </div>
            <div>
              <Label>Address *</Label>
              <Input
                value={data.reference1?.address || ''}
                onChange={(e) => updateReference('reference1', 'address', e.target.value)}
                placeholder="Address"
                required
              />
            </div>
            <div>
              <Label>Address2</Label>
              <Input
                value={data.reference1?.address2 || ''}
                onChange={(e) => updateReference('reference1', 'address2', e.target.value)}
                placeholder="Address2"
              />
            </div>
            <div>
              <Label>Town *</Label>
              <Input
                value={data.reference1?.town || ''}
                onChange={(e) => updateReference('reference1', 'town', e.target.value)}
                placeholder="Town"
                required
              />
            </div>
            <div>
              <Label>Contact Number *</Label>
              <Input
                type="tel"
                value={data.reference1?.contactNumber || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  updateReference('reference1', 'contactNumber', value);
                }}
                placeholder="Contact Number"
                required
              />
            </div>
            <div>
              <Label>Postcode *</Label>
              <Input
                value={data.reference1?.postcode || ''}
                onChange={(e) => updateReference('reference1', 'postcode', e.target.value)}
                placeholder="Postcode"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getReferenceType('reference2')} 2
                {isEmployerReference('reference2') && autoFilledFields.reference2 && (
                  <Badge variant="secondary" className="text-xs">
                    Auto-filled
                  </Badge>
                )}
              </CardTitle>
              {isEmployerReference('reference2') && getCompanyName('reference2') && (
                <p className="text-sm text-muted-foreground mt-1">
                  From: {getCompanyName('reference2')}
                </p>
              )}
            </div>
            {isEmployerReference('reference2') && autoFilledFields.reference2 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => clearAutoFill('reference2')}
                className="text-xs"
              >
                <Edit3 className="w-3 h-3 mr-1" />
                Use Different Person
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">** All fields are required</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <Label>Name *</Label>
              <Input
                value={data.reference2?.name || ''}
                onChange={(e) => updateReference('reference2', 'name', e.target.value)}
                placeholder="Name"
                required
              />
            </div>
            <div>
              <Label>Company *</Label>
              <Input
                value={data.reference2?.company || ''}
                onChange={(e) => updateReference('reference2', 'company', e.target.value)}
                placeholder="Company"
                required
              />
            </div>
            <div>
              <Label>Job Title *</Label>
              <Input
                value={data.reference2?.jobTitle || ''}
                onChange={(e) => updateReference('reference2', 'jobTitle', e.target.value)}
                placeholder="Job Title"
                required
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={data.reference2?.email || ''}
                onChange={(e) => updateReference('reference2', 'email', e.target.value)}
                placeholder="Email"
                required
              />
            </div>
            <div>
              <Label>Address *</Label>
              <Input
                value={data.reference2?.address || ''}
                onChange={(e) => updateReference('reference2', 'address', e.target.value)}
                placeholder="Address"
                required
              />
            </div>
            <div>
              <Label>Address2</Label>
              <Input
                value={data.reference2?.address2 || ''}
                onChange={(e) => updateReference('reference2', 'address2', e.target.value)}
                placeholder="Address2"
              />
            </div>
            <div>
              <Label>Town *</Label>
              <Input
                value={data.reference2?.town || ''}
                onChange={(e) => updateReference('reference2', 'town', e.target.value)}
                placeholder="Town"
                required
              />
            </div>
            <div>
              <Label>Contact Number *</Label>
              <Input
                type="tel"
                value={data.reference2?.contactNumber || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  updateReference('reference2', 'contactNumber', value);
                }}
                placeholder="Contact Number"
                required
              />
            </div>
            <div>
              <Label>Postcode *</Label>
              <Input
                value={data.reference2?.postcode || ''}
                onChange={(e) => updateReference('reference2', 'postcode', e.target.value)}
                placeholder="Postcode"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}