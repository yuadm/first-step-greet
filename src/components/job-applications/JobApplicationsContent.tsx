import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Eye, Filter, Search, Trash2, UserPlus } from 'lucide-react';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { ReferenceButtons } from './ReferenceButtons';
import { TimeSlotsList } from './TimeSlotsList';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useJobApplications, useJobApplicationStatusOptions, useJobApplicationActions } from '@/hooks/queries/useJobApplicationQueries';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { useCompany } from '@/contexts/CompanyContext';
import { DateRange } from 'react-day-picker';
import { JobApplication } from '@/hooks/queries/useJobApplicationQueries';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { generateJobApplicationPdf } from '@/lib/job-application-pdf';
import { ReviewSummary } from '@/components/job-application/ReviewSummary';

export type JobApplicationSortField = 'applicant_name' | 'position' | 'created_at' | 'postcode' | 'english_proficiency';
export type JobApplicationSortDirection = 'asc' | 'desc';

export function JobApplicationsContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<JobApplicationSortField>('created_at');
  const [sortDirection, setSortDirection] = useState<JobApplicationSortDirection>('desc');
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  
  const { toast } = useToast();
  const { companySettings } = useCompany();
  const { user } = useAuth();
  const { getAccessibleBranches, isAdmin } = usePermissions();
  const { hasPageAction } = usePermissions();

  // React Query hooks
  const { data: applications, error: applicationsError, isLoading } = useJobApplications({
    statusFilter,
    sortField,
    sortDirection,
    dateRange,
    page,
    pageSize
  });

  const { data: statusOptions = [], error: statusError } = useJobApplicationStatusOptions();
  const { deleteApplication } = useJobApplicationActions();

  const totalCount = applications?.totalCount || 0;
  const applicationsList = applications?.applications || [];

  // Check if user has permission to view job applications
  if (!isAdmin && !hasPageAction('job-applications', 'view')) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">
          You don't have permission to view job applications.
        </div>
      </div>
    );
  }

  // Filter applications locally using useMemo
  const filteredApplications = useMemo(() => {
    let filtered = applicationsList;

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app => {
        const personalInfo = app.personal_info as any;
        return (personalInfo?.fullName || '').toLowerCase().includes(term) ||
               (personalInfo?.email || '').toLowerCase().includes(term) ||
               (personalInfo?.positionAppliedFor || '').toLowerCase().includes(term);
      });
    }

    return filtered;
  }, [applicationsList, searchTerm]);

  const handleDeleteApplication = (id: string) => {
    deleteApplication.mutate(id);
  };

  const sendReferenceEmail = (application: JobApplication, referenceIndex: number) => {
    const reference = referenceIndex === 1 
      ? application.employment_history?.recentEmployer 
      : application.employment_history?.previousEmployers?.[0];
    
    if (!reference?.email) {
      toast({
        title: "Error",
        description: "No email address found for this reference",
        variant: "destructive",
      });
      return;
    }

    const applicantName = application.personal_info?.fullName || 
                         `${application.personal_info?.firstName || ''} ${application.personal_info?.lastName || ''}`.trim() ||
                         'Unknown Applicant';
    const position = application.personal_info?.positionAppliedFor || 'Unknown Position';
    const referenceName = reference.name || reference.company || 'Reference';
    const referenceCompany = reference.company || 'Unknown Company';
    const referenceAddress = [
      reference.address,
      reference.address2,
      reference.town,
      reference.postcode
    ].filter(Boolean).join(', ') || 'Address not provided';
    
    const subject = `Reference Request for ${applicantName} - ${position} Position`;
    const body = `Dear ${referenceName},

We hope this email finds you well.

We are writing to request a reference for ${applicantName}, who has applied for the position of ${position} with our company. ${applicantName} has listed you as a reference.

Could you please provide information about:
- The nature and duration of your relationship with ${applicantName}
- Their professional capabilities and work ethic
- Any relevant skills or qualities that would be pertinent to this role
- Their reliability and punctuality
- Would you employ this person again? If not, why not?

Your insights would be greatly appreciated and will help us make an informed decision.

Thank you for your time and assistance.

Best regards,
Mohamed Ahmed
HR Department

Reference Details:
Company: ${referenceCompany}
Contact Person: ${referenceName}
Position: ${reference.position || 'Not specified'}
Phone: ${reference.telephone || 'Not provided'}
Address: ${referenceAddress}

Please complete and return this reference as soon as possible.`;

    const mailtoLink = `mailto:${reference.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const handleSort = (field: JobApplicationSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: JobApplicationSortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const displayedApplications = sortField === 'created_at'
    ? filteredApplications
    : [...filteredApplications].sort((a, b) => {
      let aVal: any;
      let bVal: any;
      
      switch (sortField) {
        case 'applicant_name':
          aVal = (a.personal_info as any)?.fullName || '';
          bVal = (b.personal_info as any)?.fullName || '';
          break;
        case 'position':
          aVal = (a.personal_info as any)?.positionAppliedFor || '';
          bVal = (b.personal_info as any)?.positionAppliedFor || '';
          break;
        case 'postcode':
          aVal = (a.personal_info as any)?.postcode || '';
          bVal = (b.personal_info as any)?.postcode || '';
          break;
        case 'english_proficiency':
          aVal = (a.personal_info as any)?.englishProficiency || '';
          bVal = (b.personal_info as any)?.englishProficiency || '';
          break;
        default:
          return 0;
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? comparison : -comparison;
      } else {
        const comparison = (aVal || 0) - (bVal || 0);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
    });

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize));
    setPage(1); // Reset to first page when changing page size
  };

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / pageSize));
  const paginatedApplications = displayedApplications.slice((page - 1) * pageSize, page * pageSize);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading job applications...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Applications</h1>
          <p className="text-muted-foreground">Manage and review job applications</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{filteredApplications.length}</div>
          <div className="text-sm text-muted-foreground">
            {searchTerm ? `Filtered Results` : `Total Applications`}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by name, email, or position..."
            value={searchTerm}
            onChange={(e) => { setPage(1); setSearchTerm(e.target.value); }}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(val) => { setPage(1); setStatusFilter(val); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DatePickerWithRange date={dateRange} setDate={(d) => { setPage(1); setDateRange(d); }} />
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications ({filteredApplications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto font-medium hover:bg-transparent"
                      onClick={() => handleSort('applicant_name')}
                    >
                      Applicant {getSortIcon('applicant_name')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto font-medium hover:bg-transparent"
                      onClick={() => handleSort('position')}
                    >
                      Position Applied {getSortIcon('position')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto font-medium hover:bg-transparent"
                      onClick={() => handleSort('created_at')}
                    >
                      Date {getSortIcon('created_at')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto font-medium hover:bg-transparent"
                      onClick={() => handleSort('postcode')}
                    >
                      Postcode {getSortIcon('postcode')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto font-medium hover:bg-transparent"
                      onClick={() => handleSort('english_proficiency')}
                    >
                      Proficiency In English {getSortIcon('english_proficiency')}
                    </Button>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div className="font-medium">
                        {(application.personal_info as any)?.fullName || 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(application.personal_info as any)?.positionAppliedFor || 'Not specified'}
                    </TableCell>
                    <TableCell>
                      {new Date(application.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {(application.personal_info as any)?.postcode || 'Not provided'}
                    </TableCell>
                    <TableCell>
                      {(application.personal_info as any)?.englishProficiency || 'Not specified'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedApplication(application)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Application Details</DialogTitle>
                            </DialogHeader>
                            {selectedApplication && (
                              <div>Application details would go here</div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteApplication(application.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => sendReferenceEmail(application, 1)}>
                            Ref 1
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => sendReferenceEmail(application, 2)}>
                            Ref 2
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredApplications.length)} of {filteredApplications.length} applications
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Rows per page</p>
                <Select
                  value={pageSize.toString()}
                  onValueChange={handlePageSizeChange}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 40, 50].map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setPage(Math.max(1, page - 1))}
                      className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => setPage(pageNumber)}
                        isActive={page === pageNumber}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <TimeSlotsList timeSlots={[]} />
    </div>
  );
}