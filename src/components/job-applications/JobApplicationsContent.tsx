import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Eye, FileText, Edit, Trash2, Send, ArrowUpDown, ArrowUp, ArrowDown, Plus, Minus, Users, TrendingUp, Clock, MapPin, Mail, Phone, Calendar, Filter, MoreVertical, Download, Star, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";
import { generateJobApplicationPdf } from "@/lib/job-application-pdf";
import { ReviewSummary } from "@/components/job-application/ReviewSummary";
import { usePermissions } from "@/contexts/PermissionsContext";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { DatePickerWithRange, DatePicker } from "@/components/ui/date-picker";
import { DateRange } from "react-day-picker";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { TimeSlotsList } from "./TimeSlotsList";
import { ReferenceButtons } from "./ReferenceButtons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Helper function to format dates from YYYY-MM-DD to MM/DD/YYYY
const formatDateDisplay = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Not provided';
  
  // Check if it's already in MM/DD/YYYY format
  if (dateString.includes('/')) return dateString;
  
  // Convert from YYYY-MM-DD to MM/DD/YYYY
  try {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch (error) {
    return dateString; // Return original if conversion fails
  }
};

interface JobApplication {
  id: string;
  personal_info: any;
  availability: any;
  emergency_contact: any;
  employment_history: any;
  reference_info: any;
  skills_experience: any;
  declarations: any;
  consent: any;
  status: string;
  created_at: string;
  updated_at: string;
}

export type JobApplicationSortField = 'applicant_name' | 'position' | 'created_at' | 'postcode' | 'english_proficiency';
export type JobApplicationSortDirection = 'asc' | 'desc';

export function JobApplicationsContent() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<JobApplicationSortField>('created_at');
  const [sortDirection, setSortDirection] = useState<JobApplicationSortDirection>('desc');
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [statusOptions, setStatusOptions] = useState<string[]>(['new','reviewing','interviewed','accepted','rejected']);
  const { toast } = useToast();
  const { companySettings } = useCompany();
  const { user } = useAuth();
  const { getAccessibleBranches, isAdmin } = usePermissions();
  const { hasPageAction } = usePermissions();

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

  useEffect(() => {
    fetchStatusOptions();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchApplications();
  }, [statusFilter, sortField, sortDirection, dateRange, page, pageSize]);

  // Filter applications locally using useMemo
  const filteredApplications = useMemo(() => {
    let filtered = applications;

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        (app.personal_info?.fullName || '').toLowerCase().includes(term) ||
        (app.personal_info?.email || '').toLowerCase().includes(term) ||
        (app.personal_info?.positionAppliedFor || '').toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [applications, searchTerm]);

  const fetchStatusOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('application_status_settings')
        .select('status_name, display_order, is_active')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (!error && data) {
        const opts = data.map((d: any) => d.status_name).filter(Boolean);
        if (opts.length) setStatusOptions(opts);
      }
    } catch (e) {
      // ignore, use defaults
    }
  };

  const fetchApplications = async () => {
    try {
      let query = supabase
        .from('job_applications')
        .select('*', { count: 'exact' });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        const toDate = new Date(dateRange.to);
        toDate.setDate(toDate.getDate() + 1); // exclusive upper bound
        query = query.lt('created_at', toDate.toISOString());
      }

      if (sortField === 'created_at') {
        query = query.order('created_at', { ascending: sortDirection === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const from = (page - 1) * pageSize;
      const toIdx = from + pageSize - 1;
      const { data, error, count } = await query.range(from, toIdx);

      if (error) throw error;
      setApplications(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch job applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const deleteApplication = async (id: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setApplications(prev => prev.filter(app => app.id !== id));

      toast({
        title: "Application Deleted",
        description: "The job application has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting application:', error);
      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive",
      });
    }
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
          aVal = a.personal_info?.fullName || '';
          bVal = b.personal_info?.fullName || '';
          break;
        case 'position':
          aVal = a.personal_info?.positionAppliedFor || '';
          bVal = b.personal_info?.positionAppliedFor || '';
          break;
        case 'postcode':
          aVal = a.personal_info?.postcode || '';
          bVal = b.personal_info?.postcode || '';
          break;
        case 'english_proficiency':
          aVal = a.personal_info?.englishProficiency || '';
          bVal = b.personal_info?.englishProficiency || '';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'interviewed': return <Star className="w-4 h-4" />;
      case 'reviewing': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'badge-success';
      case 'rejected': return 'badge-error';
      case 'interviewed': return 'bg-accent text-accent-foreground';
      case 'reviewing': return 'badge-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const statusStats = useMemo(() => {
    const stats = statusOptions.reduce((acc, status) => {
      acc[status] = applications.filter(app => app.status === status).length;
      return acc;
    }, {} as Record<string, number>);
    return stats;
  }, [applications, statusOptions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="p-8 glass">
          <div className="flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-lg font-medium">Loading job applications...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="p-6 space-y-8">
        {/* Hero Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-primary rounded-radius-xl opacity-5"></div>
          <div className="relative p-8 rounded-radius-xl border border-card-border bg-gradient-card">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Job Applications
                </h1>
                <p className="text-muted-foreground text-lg">
                  Discover, review, and manage talented candidates joining your team
                </p>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statusOptions.slice(0, 4).map((status) => (
                  <Card key={status} className="card-premium">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        {getStatusIcon(status)}
                        <span className="text-sm font-medium capitalize">{status}</span>
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {statusStats[status] || 0}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <Card className="card-premium">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-primary" />
              <CardTitle>Smart Filters & Search</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => { setPage(1); setSearchTerm(e.target.value); }}
                  className="pl-10 border-input-border focus:border-primary transition-colors"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(val) => { setPage(1); setStatusFilter(val); }}>
                <SelectTrigger className="border-input-border focus:border-primary">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <DatePickerWithRange 
                date={dateRange} 
                setDate={(d) => { setPage(1); setDateRange(d); }}
                className="border-input-border focus:border-primary"
              />
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Show:</span>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-20 border-input-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {searchTerm && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Found {filteredApplications.length} candidates matching "{searchTerm}"</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSearchTerm("")}
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Applications Grid/List View */}
        <Tabs defaultValue="grid" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-[200px] grid-cols-2">
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
            
            <div className="text-sm text-muted-foreground">
              Showing {paginatedApplications.length} of {filteredApplications.length} applications
            </div>
          </div>

          {/* Grid View */}
          <TabsContent value="grid" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedApplications.map((application) => (
                <Card key={application.id} className="group card-premium hover:shadow-glow transition-all duration-normal">
                  <CardContent className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {application.personal_info?.fullName || 'Unknown'}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {application.personal_info?.positionAppliedFor || 'Position not specified'}
                        </p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => {
                                e.preventDefault();
                                setSelectedApplication(application);
                              }}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                              <DialogHeader>
                                <DialogTitle>Application Details - {application.personal_info?.fullName}</DialogTitle>
                              </DialogHeader>
                              {selectedApplication && (
                                <ReviewSummary data={{
                                  personalInfo: selectedApplication.personal_info || {},
                                  availability: selectedApplication.availability || {},
                                  emergencyContact: selectedApplication.emergency_contact || {},
                                  employmentHistory: selectedApplication.employment_history || {},
                                  references: selectedApplication.reference_info || {},
                                  skillsExperience: selectedApplication.skills_experience || {},
                                  declaration: selectedApplication.declarations || {},
                                  termsPolicy: selectedApplication.consent || {}
                                }} />
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <DropdownMenuItem onClick={() => {
                            generateJobApplicationPdf({
                              personalInfo: application.personal_info || {},
                              availability: application.availability || {},
                              emergencyContact: application.emergency_contact || {},
                              employmentHistory: application.employment_history || {},
                              references: application.reference_info || {},
                              skillsExperience: application.skills_experience || {},
                              declaration: application.declarations || {},
                              termsPolicy: application.consent || {}
                            }, {
                              logoUrl: companySettings.logo,
                              companyName: companySettings.name,
                            });
                          }}>
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Application</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this application? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteApplication(application.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(application.status)} flex items-center gap-1`}>
                        {getStatusIcon(application.status)}
                        <span className="capitalize">{application.status}</span>
                      </Badge>
                    </div>

                    {/* Key Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>Applied {new Date(application.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{application.personal_info?.postcode || 'Location not provided'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{application.personal_info?.email || 'Email not provided'}</span>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 border-primary/20 hover:bg-primary/5"
                        onClick={() => setSelectedApplication(application)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      
                      <ReferenceButtons 
                        application={application} 
                        references={application.reference_info}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list" className="space-y-4">
            <Card className="card-premium">
              <CardContent className="p-0">
                <div className="rounded-md border border-card-border overflow-hidden">
                  <Table>
                     <TableHeader className="bg-muted/30">
                       <TableRow className="hover:bg-transparent">
                         <TableHead>
                           <Button 
                             variant="ghost" 
                             className="p-0 h-auto font-semibold hover:bg-transparent hover:text-primary"
                             onClick={() => handleSort('applicant_name')}
                           >
                             Applicant {getSortIcon('applicant_name')}
                           </Button>
                         </TableHead>
                         <TableHead>
                           <Button 
                             variant="ghost" 
                             className="p-0 h-auto font-semibold hover:bg-transparent hover:text-primary"
                             onClick={() => handleSort('position')}
                           >
                             Position {getSortIcon('position')}
                           </Button>
                         </TableHead>
                         <TableHead>Status</TableHead>
                         <TableHead>
                           <Button 
                             variant="ghost" 
                             className="p-0 h-auto font-semibold hover:bg-transparent hover:text-primary"
                             onClick={() => handleSort('created_at')}
                           >
                             Applied {getSortIcon('created_at')}
                           </Button>
                         </TableHead>
                         <TableHead>Location</TableHead>
                         <TableHead>English Level</TableHead>
                         <TableHead className="text-right">Actions</TableHead>
                       </TableRow>
                     </TableHeader>
                    <TableBody>
                      {paginatedApplications.map((application) => (
                        <TableRow key={application.id} className="group hover:bg-muted/20 transition-colors">
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium group-hover:text-primary transition-colors">
                                {application.personal_info?.fullName || 'Unknown'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {application.personal_info?.email || 'No email'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {application.personal_info?.positionAppliedFor || 'Not specified'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(application.status)} flex items-center gap-1 w-fit`}>
                              {getStatusIcon(application.status)}
                              <span className="capitalize">{application.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {new Date(application.created_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3 text-muted-foreground" />
                              {application.personal_info?.postcode || 'Not provided'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {application.personal_info?.englishProficiency || 'Not specified'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 justify-end">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedApplication(application)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                                  <DialogHeader>
                                    <DialogTitle>Application Details - {application.personal_info?.fullName}</DialogTitle>
                                  </DialogHeader>
                                  {selectedApplication && (
                                    <ReviewSummary data={{
                                      personalInfo: selectedApplication.personal_info || {},
                                      availability: selectedApplication.availability || {},
                                      emergencyContact: selectedApplication.emergency_contact || {},
                                      employmentHistory: selectedApplication.employment_history || {},
                                      references: selectedApplication.reference_info || {},
                                      skillsExperience: selectedApplication.skills_experience || {},
                                      declaration: selectedApplication.declarations || {},
                                      termsPolicy: selectedApplication.consent || {}
                                    }} />
                                  )}
                                </DialogContent>
                              </Dialog>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  generateJobApplicationPdf({
                                    personalInfo: application.personal_info || {},
                                    availability: application.availability || {},
                                    emergencyContact: application.emergency_contact || {},
                                    employmentHistory: application.employment_history || {},
                                    references: application.reference_info || {},
                                    skillsExperience: application.skills_experience || {},
                                    declaration: application.declarations || {},
                                    termsPolicy: application.consent || {}
                                  }, {
                                    logoUrl: companySettings.logo,
                                    companyName: companySettings.name,
                                  });
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </Button>

                              <ReferenceButtons 
                                application={application} 
                                references={application.reference_info}
                              />

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Application</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this application? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => deleteApplication(application.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Enhanced Pagination */}
        {filteredApplications.length > 0 && (
          <Card className="card-premium">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredApplications.length)} of {filteredApplications.length} applications
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="border-input-border hover:bg-primary/5"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 7) {
                        pageNumber = i + 1;
                      } else if (page <= 4) {
                        pageNumber = i + 1;
                      } else if (page >= totalPages - 3) {
                        pageNumber = totalPages - 6 + i;
                      } else {
                        pageNumber = page - 3 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNumber}
                          variant={page === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNumber)}
                          className={page === pageNumber ? "" : "border-input-border hover:bg-primary/5"}
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="border-input-border hover:bg-primary/5"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {filteredApplications.length === 0 && (
          <Card className="card-premium">
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">No applications found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? `No applications match "${searchTerm}". Try adjusting your search criteria.`
                      : "There are no job applications yet. Applications will appear here once candidates start applying."
                    }
                  </p>
                </div>
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm("")}>
                    Clear Search
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}