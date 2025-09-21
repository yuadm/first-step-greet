import { useState, useEffect, useMemo } from "react";
import { Calendar, Users, CheckCircle, AlertTriangle, Clock, Eye, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";
import { useCompliancePeriodEmployeeData } from "@/hooks/queries/useCompliancePeriodQueries";
import { ComplianceRecordViewDialog } from "./ComplianceRecordViewDialog";

interface Employee {
  id: string;
  name: string;
  branch: string;
}

interface ComplianceRecord {
  id: string;
  employee_id: string;
  period_identifier: string;
  completion_date: string;
  notes: string | null;
  form_data?: any | null;
  status: string;
  created_at: string;
  updated_at: string;
  completed_by: string | null;
  completion_method?: string;
}

interface EmployeeComplianceStatus {
  employee: Employee;
  record: ComplianceRecord | null;
  status: 'compliant' | 'overdue' | 'due' | 'pending';
}

interface CompliancePeriodEmployeeViewProps {
  complianceTypeId: string;
  complianceTypeName: string;
  periodIdentifier: string;
  frequency: string;
  trigger: React.ReactNode;
}

export function CompliancePeriodEmployeeView({ 
  complianceTypeId, 
  complianceTypeName, 
  periodIdentifier, 
  frequency,
  trigger 
}: CompliancePeriodEmployeeViewProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const { toast } = useToast();
  const { companySettings } = useCompany();

  // Fetch data using React Query
  const { data, isLoading, error } = useCompliancePeriodEmployeeData(complianceTypeId, periodIdentifier);
  
  const employees = data?.employees || [];
  const records = data?.records || [];

  // Calculate employee status using useMemo
  const employeeStatusList = useMemo(() => {
    if (!employees || !records) return [];
    
    return employees.map(employee => {
      // Find the record for this employee in this specific period
      const record = records.find(record => record.employee_id === employee.id);

      let status: 'compliant' | 'overdue' | 'due' | 'pending' = 'pending';

      if (record) {
        // A record is compliant if it has a completion_date or status is completed
        if (record.status === 'completed' || record.completion_date) {
          status = 'compliant';
        } else if (record.status === 'overdue') {
          status = 'overdue';
        } else {
          status = 'due';
        }
      } else {
        // Check if we're past the period (this would be overdue)
        const now = new Date();
        const isOverdue = isPeriodOverdue(periodIdentifier, frequency, now);
        status = isOverdue ? 'overdue' : 'due';
      }

      return {
        employee,
        record: record || null,
        status
      };
    });
  }, [employees, records, periodIdentifier, frequency]);

  const isPeriodOverdue = (periodIdentifier: string, frequency: string, currentDate: Date): boolean => {
    const now = currentDate;
    
    switch (frequency.toLowerCase()) {
      case 'annual': {
        const year = parseInt(periodIdentifier);
        const endOfYear = new Date(year, 11, 31); // December 31st
        return now > endOfYear;
      }
      case 'monthly': {
        const [year, month] = periodIdentifier.split('-').map(Number);
        const endOfMonth = new Date(year, month, 0); // Last day of the month
        return now > endOfMonth;
      }
      case 'quarterly': {
        const [year, quarterStr] = periodIdentifier.split('-');
        const quarter = parseInt(quarterStr.replace('Q', ''));
        const endMonth = quarter * 3; // Q1=3, Q2=6, Q3=9, Q4=12
        const endOfQuarter = new Date(parseInt(year), endMonth, 0); // Last day of quarter
        return now > endOfQuarter;
      }
      case 'bi-annual': {
        const [year, halfStr] = periodIdentifier.split('-');
        const half = parseInt(halfStr.replace('H', ''));
        const endMonth = half === 1 ? 6 : 12;
        const endOfHalf = new Date(parseInt(year), endMonth, 0);
        return now > endOfHalf;
      }
      default:
        return false;
    }
  };

  const getStatusBadge = (status: 'compliant' | 'overdue' | 'due' | 'pending') => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-success/10 text-success border-success/20">Compliant</Badge>;
      case 'overdue':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Overdue</Badge>;
      case 'due':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Due</Badge>;
      case 'pending':
        return <Badge className="bg-muted text-muted-foreground border-border">Pending</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-border">{status}</Badge>;
    }
  };

  const getStatusColor = (status: 'compliant' | 'overdue' | 'due' | 'pending') => {
    switch (status) {
      case 'compliant':
        return 'bg-success/5 border-success/20';
      case 'overdue':
        return 'bg-destructive/5 border-destructive/20';
      case 'due':
        return 'bg-warning/5 border-warning/20';
      default:
        return '';
    }
  };

  // Calculate stats for this period
  const filteredEmployeeStatusList = employeeStatusList.filter(item => {
    if (!searchTerm.trim()) return true;
    return item.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.employee.branch.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const compliantCount = filteredEmployeeStatusList.filter(item => item.status === 'compliant').length;
  const overdueCount = filteredEmployeeStatusList.filter(item => item.status === 'overdue').length;
  const dueCount = filteredEmployeeStatusList.filter(item => item.status === 'due').length;
  const pendingCount = 0; // Remove pending status as it's not part of the compliance status enum

  // Pagination calculations
  const totalItems = filteredEmployeeStatusList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployeeStatusList = filteredEmployeeStatusList.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // Show error if data fetching failed
  if (error) {
    console.error('Error loading data:', error);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {complianceTypeName} - {periodIdentifier}
          </DialogTitle>
          <DialogDescription>
            Employee compliance status for this specific period
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-muted rounded-xl"></div>
              ))}
            </div>
            <div className="h-64 bg-muted rounded-xl"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="card-premium border-success/20 bg-gradient-to-br from-success-soft to-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Compliant</p>
                      <p className="text-2xl font-bold text-success">{compliantCount}</p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-premium border-warning/20 bg-gradient-to-br from-warning-soft to-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Due</p>
                      <p className="text-2xl font-bold text-warning">{dueCount}</p>
                    </div>
                    <Clock className="w-6 h-6 text-warning" />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-premium border-destructive/20 bg-gradient-to-br from-destructive-soft to-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                      <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
                    </div>
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-premium border-muted/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-muted-foreground">{pendingCount}</p>
                    </div>
                    <Users className="w-6 h-6 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Employee Table */}
            <Card className="card-premium">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <Users className="w-6 h-6" />
                    Employee Status ({totalItems} of {employees.length} employees)
                  </CardTitle>
                  
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64 bg-background border-border/50 focus:border-primary/50"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Completion Date</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEmployeeStatusList.map((item) => (
                      <TableRow key={item.employee.id} className={getStatusColor(item.status)}>
                        <TableCell className="font-medium">
                          {item.employee.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.employee.branch}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item.status)}
                        </TableCell>
                        <TableCell>
                          {item.record ? (() => {
                            const date = new Date(item.record.completion_date);
                            return isNaN(date.getTime()) 
                              ? item.record.completion_date 
                              : date.toLocaleDateString();
                          })() : '-'}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={(() => {
                            if (!item.record?.notes) return '';
                            if (item.record?.completion_method === 'supervision') {
                              try {
                                const j = JSON.parse(item.record.notes);
                                const txt = (j?.freeTextNotes || '').toString().trim();
                                return txt || '';
                              } catch {
                                return '';
                              }
                            }
                            if (item.record?.completion_method === 'annual_appraisal') {
                              try {
                                const j = JSON.parse(item.record.notes);
                                const txt = (j?.freeTextNotes || '').toString().trim();
                                return txt || '';
                              } catch {
                                return '';
                              }
                            }
                            return item.record?.notes || '';
                          })()}>
                            {(() => {
                              if (!item.record?.notes) return '-';
                              if (item.record?.completion_method === 'supervision') {
                                try {
                                  const j = JSON.parse(item.record.notes);
                                  const txt = (j?.freeTextNotes || '').toString().trim();
                                  return txt || '-';
                                } catch {
                                  return '-';
                                }
                              }
                              if (item.record?.completion_method === 'annual_appraisal') {
                                try {
                                  const j = JSON.parse(item.record.notes);
                                  const txt = (j?.freeTextNotes || '').toString().trim();
                                  return txt || '-';
                                } catch {
                                  return '-';
                                }
                              }
                              return item.record?.notes || '-';
                            })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.record && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRecord(item.record);
                                  setSelectedEmployee(item.employee);
                                  setViewDialogOpen(true);
                                }}
                                className="h-6 w-6 p-0"
                                title="View Details"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                            {item.record?.completion_method === 'annual_appraisal' && item.record?.status === 'completed' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (item.record?.notes) {
                                      try {
                                        const parsedData = JSON.parse(item.record.notes);
                                        // Import the PDF generator
                                        import('@/lib/annual-appraisal-pdf').then(({ generateAnnualAppraisalPDF }) => {
                                          generateAnnualAppraisalPDF(parsedData, item.employee.name, {
                                            name: companySettings?.name || 'Company',
                                            logo: companySettings?.logo
                                          });
                                        });
                                      } catch (error) {
                                        console.error('Error generating PDF:', error);
                                      }
                                    }
                                  }}
                                  className="h-6 w-6 p-0"
                                  title="Download PDF"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (item.record?.notes) {
                                      try {
                                        const parsedData = JSON.parse(item.record.notes);
                                        // Import the PDF generator
                                        import('@/lib/annual-appraisal-pdf').then(({ generateAnnualAppraisalPDF }) => {
                                          generateAnnualAppraisalPDF(parsedData, item.employee.name, {
                                            name: companySettings?.name || 'Company',
                                            logo: companySettings?.logo
                                          });
                                        });
                                      } catch (error) {
                                        console.error('Error generating PDF:', error);
                                      }
                                    }
                                  }}
                                  className="h-6 w-6 p-0"
                                  title="Download PDF"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            {(item.record?.status === 'completed' && ((item.record?.completion_method === 'medication_competency') || (item.record?.completion_method === 'questionnaire' && item.record?.form_data && (item.record.form_data as any)?.competencyItems))) && ((item.record?.form_data) || item.record?.notes) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  try {
                                    const parsedData = item.record.form_data || (item.record?.notes ? JSON.parse(item.record.notes) : null);
                                    if (!parsedData) return;
                                    
                                    // Transform legacy data to new format
                                    const items = parsedData.competencyItems;
                                    const responses = Array.isArray(items)
                                      ? items.map((item: any) => ({
                                          question: item?.performanceCriteria || item?.id || 'Competency Item',
                                          answer: item?.competent === 'yes' ? 'yes' : item?.competent === 'not-yet' ? 'not-yet' : 'yes',
                                          comment: item?.comments || 'No comment provided',
                                          section: 'Competency Assessment',
                                          helpText: item?.examples || 'Direct observation / discussion'
                                        }))
                                      : items && typeof items === 'object'
                                      ? Object.values(items).map((value: any) => ({
                                          question: value?.performanceCriteria || value?.id || 'Competency Item',
                                          answer: value?.competent === 'yes' ? 'yes' : value?.competent === 'not-yet' ? 'not-yet' : 'yes',
                                          comment: value?.comments || 'No comment provided',
                                          section: 'Competency Assessment',
                                          helpText: value?.examples || 'Direct observation / discussion'
                                        }))
                                      : [];
  
                                    // Add signature if available
                                    if (parsedData.acknowledgement?.signature) {
                                      responses.push({
                                        question: 'Employee Signature',
                                        answer: 'yes',
                                        comment: parsedData.acknowledgement.signature,
                                        section: 'Acknowledgement',
                                        helpText: 'Employee acknowledgement'
                                      });
                                    }
                                    
                                     const competencyData = {
                                       employeeId: item.record.employee_id,
                                       employeeName: item.employee.name,
                                       periodIdentifier: item.record.period_identifier,
                                       assessmentDate: item.record.completion_date,
                                       responses: responses,
                                       signature: parsedData.acknowledgement?.signature || '',
                                       completedAt: item.record.created_at,
                                       questionnaireName: 'Medication Competency Assessment',
                                       assessorName: parsedData.signatures?.assessorName || '',
                                       assessorSignatureData: parsedData.signatures?.assessorSignatureData || '',
                                       employeeSignatureData: parsedData.signatures?.employeeSignatureData || ''
                                     };
  
                                    // Import the PDF generator
                                    import('@/lib/medication-competency-pdf').then(({ generateMedicationCompetencyPdf }) => {
                                      generateMedicationCompetencyPdf(competencyData, {
                                        name: companySettings?.name || 'Company',
                                        logo: companySettings?.logo
                                      });
                                    });
                                  } catch (error) {
                                    console.error('Error generating medication competency PDF:', error);
                                    toast({
                                      title: "Download failed",
                                      description: "Could not download the medication competency PDF.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                className="h-6 w-6 p-0"
                                title="Download Medication Competency PDF"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                 </Table>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Items per page:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => handleItemsPerPageChange(e.target.value)}
                        className="border border-border rounded px-2 py-1 text-sm bg-background"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className={currentPage === page ? "bg-primary text-primary-foreground" : ""}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} employees
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        <ComplianceRecordViewDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          employee={selectedEmployee}
          record={selectedRecord}
          completedByUser={selectedRecord?.completed_by_user ? {
            name: selectedRecord.completed_by_user.name,
            created_at: selectedRecord.completion_date || selectedRecord.created_at
          } : null}
          createdByUser={selectedRecord?.created_by_user ? {
            name: selectedRecord.created_by_user.name,
            created_at: selectedRecord.created_at
          } : null}
          updatedByUser={selectedRecord?.updated_by_user ? {
            name: selectedRecord.updated_by_user.name,
            updated_at: selectedRecord.updated_at
          } : null}
        />
      </DialogContent>
    </Dialog>
  );
}