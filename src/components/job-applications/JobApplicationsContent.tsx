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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Eye, FileText, Edit, Trash2, Send, Filter, Download, Users, TrendingUp, Clock, MapPin, Mail, Phone, Calendar, Star, Briefcase, GraduationCap, Languages } from "lucide-react";
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

// Helper function to format dates
const formatDateDisplay = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Not provided';
  if (dateString.includes('/')) return dateString;
  
  try {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch (error) {
    return dateString;
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

// Status color mapping for modern badges
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'new': return 'bg-primary-soft text-primary border-primary/20';
    case 'reviewing': return 'bg-warning-soft text-warning border-warning/20';
    case 'interviewed': return 'bg-accent-soft text-accent-foreground border-accent/20';
    case 'accepted': return 'bg-success-soft text-success border-success/20';
    case 'rejected': return 'bg-destructive-soft text-destructive border-destructive/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

export function JobApplicationsContent() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalCount, setTotalCount] = useState(0);
  const [statusOptions, setStatusOptions] = useState<string[]>(['new','reviewing','interviewed','accepted','rejected']);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { toast } = useToast();
  const { companySettings } = useCompany();
  const { user } = useAuth();
  const { getAccessibleBranches, isAdmin } = usePermissions();
  const { hasPageAction } = usePermissions();

  // Check permissions
  if (!isAdmin && !hasPageAction('job-applications', 'view')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Card className="card-premium p-8 text-center max-w-md mx-auto">
          <div className="mb-4">
            <Users className="w-16 h-16 mx-auto text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">
            You don't have permission to view job applications.
          </p>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    fetchStatusOptions();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchApplications();
  }, [statusFilter, dateRange, page, pageSize]);

  // Filter applications locally
  const filteredApplications = useMemo(() => {
    let filtered = applications;

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
      // Use defaults
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
        toDate.setDate(toDate.getDate() + 1);
        query = query.lt('created_at', toDate.toISOString());
      }

      query = query.order('created_at', { ascending: false });

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

    const applicantName = application.personal_info?.fullName || 'Unknown Applicant';
    const position = application.personal_info?.positionAppliedFor || 'Unknown Position';
    const referenceName = reference.name || reference.company || 'Reference';
    
    const subject = `Reference Request for ${applicantName} - ${position} Position`;
    const body = `Dear ${referenceName},\n\nWe hope this email finds you well.\n\nWe are writing to request a reference for ${applicantName}, who has applied for the position of ${position} with our company.\n\nCould you please provide information about:\n- The nature and duration of your relationship with ${applicantName}\n- Their professional capabilities and work ethic\n- Any relevant skills or qualities that would be pertinent to this role\n- Their reliability and punctuality\n- Would you employ this person again? If not, why not?\n\nYour insights would be greatly appreciated and will help us make an informed decision.\n\nThank you for your time and assistance.\n\nBest regards,\nMohamed Ahmed\nHR Department`;

    const mailtoLink = `mailto:${reference.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / pageSize));

  // Statistics calculations
  const stats = useMemo(() => {
    const total = filteredApplications.length;
    const newApps = filteredApplications.filter(app => app.status === 'new').length;
    const reviewing = filteredApplications.filter(app => app.status === 'reviewing').length;
    const accepted = filteredApplications.filter(app => app.status === 'accepted').length;
    
    return { total, newApps, reviewing, accepted };
  }, [filteredApplications]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="card-premium animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-8 bg-muted rounded mb-1"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="card-premium animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-4"></div>
                  <div className="h-6 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-primary rounded-radius-xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10 rounded-radius-xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Job Applications</h1>
                <p className="text-primary-foreground/80 text-lg">
                  Manage and review candidate applications with ease
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-primary-foreground/80">Total Applications</div>
              </div>
            </div>
          </div>
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full"></div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-premium animate-fade-in">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-soft rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Applications</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-warning-soft rounded-lg">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New Applications</p>
                  <p className="text-2xl font-bold">{stats.newApps}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-accent-soft rounded-lg">
                  <TrendingUp className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Under Review</p>
                  <p className="text-2xl font-bold">{stats.reviewing}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium animate-fade-in" style={{ animationDelay: '300ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-success-soft rounded-lg">
                  <Star className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Accepted</p>
                  <p className="text-2xl font-bold">{stats.accepted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="card-premium">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search by name, email, or position..."
                  value={searchTerm}
                  onChange={(e) => { setPage(1); setSearchTerm(e.target.value); }}
                  className="pl-11 h-12 border-input-border focus:border-primary transition-colors"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(val) => { setPage(1); setStatusFilter(val); }}>
                <SelectTrigger className="w-48 h-12">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <DatePickerWithRange 
                date={dateRange} 
                setDate={(d) => { setPage(1); setDateRange(d); }} 
              />

              <Button
                variant="outline"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="h-12 px-4"
              >
                {viewMode === 'grid' ? 'List View' : 'Grid View'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Applications Grid */}
        {filteredApplications.length === 0 ? (
          <Card className="card-premium">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Applications Found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search criteria' : 'No job applications have been submitted yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApplications.slice((page - 1) * pageSize, page * pageSize).map((application, index) => (
              <Card 
                key={application.id} 
                className="card-premium hover:shadow-glow transition-all duration-normal group animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-6">
                  {/* Status Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <Badge className={`px-3 py-1 ${getStatusColor(application.status)}`}>
                      {application.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {new Date(application.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Applicant Info */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg mb-1">
                      {application.personal_info?.fullName || 'Unknown Applicant'}
                    </h3>
                    <p className="text-muted-foreground text-sm flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {application.personal_info?.positionAppliedFor || 'Position not specified'}
                    </p>
                  </div>

                  {/* Quick Info */}
                  <div className="space-y-2 mb-6">
                    {application.personal_info?.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{application.personal_info.email}</span>
                      </div>
                    )}
                    {application.personal_info?.postcode && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{application.personal_info.postcode}</span>
                      </div>
                    )}
                    {application.personal_info?.englishProficiency && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Languages className="w-4 h-4" />
                        <span>{application.personal_info.englishProficiency}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedApplication(application)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                        <DialogHeader>
                          <DialogTitle>Application Details</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="max-h-[calc(90vh-120px)]">
                          {selectedApplication && (
                            <ApplicationDetails 
                              application={selectedApplication}
                              onUpdate={(updatedApp) => {
                                setApplications(prev => 
                                  prev.map(app => app.id === updatedApp.id ? updatedApp : app)
                                );
                                setSelectedApplication(updatedApp);
                              }}
                            />
                          )}
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Application</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this job application? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteApplication(application.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationPrevious 
                  onClick={() => setPage(Math.max(1, page - 1))}
                  className={page === 1 ? "pointer-events-none opacity-50" : ""}
                />
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setPage(pageNum)}
                        isActive={page === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationNext 
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}

// Application Details Component
function ApplicationDetails({ 
  application, 
  onUpdate 
}: { 
  application: JobApplication; 
  onUpdate: (app: JobApplication) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedApplication, setEditedApplication] = useState(application);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({
          status: editedApplication.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', editedApplication.id);

      if (error) throw error;

      onUpdate(editedApplication);
      setIsEditing(false);
      toast({
        title: "Application Updated",
        description: "The application has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: "Failed to update application",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    try {
      // Convert JobApplication to JobApplicationData format for PDF generation
      const pdfData = {
        personalInfo: application.personal_info,
        availability: application.availability,
        emergencyContact: application.emergency_contact,
        employmentHistory: application.employment_history,
        references: application.reference_info,
        skillsExperience: application.skills_experience,
        declaration: application.declarations,
        termsPolicy: application.consent
      };
      await generateJobApplicationPdf(pdfData);
      toast({
        title: "PDF Generated",
        description: "The PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const statusOptions = ['new', 'reviewing', 'interviewed', 'accepted', 'rejected'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{application.personal_info?.fullName}</h2>
          <p className="text-muted-foreground">{application.personal_info?.positionAppliedFor}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          {isEditing ? (
            <>
              <Button onClick={handleSave} size="sm">Save</Button>
              <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">Cancel</Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Status:</label>
        {isEditing ? (
          <Select
            value={editedApplication.status}
            onValueChange={(value) => setEditedApplication({ ...editedApplication, status: value })}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge className={`px-3 py-1 ${getStatusColor(application.status)}`}>
            {application.status}
          </Badge>
        )}
      </div>

      {/* Application Content */}
      <div className="bg-muted/30 rounded-lg p-6">
        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="text-sm">{application.personal_info?.fullName || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-sm">{application.personal_info?.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <p className="text-sm">{application.personal_info?.phoneNumber || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Position Applied For</label>
                <p className="text-sm">{application.personal_info?.positionAppliedFor || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Address</label>
                <p className="text-sm">{application.personal_info?.address || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Postcode</label>
                <p className="text-sm">{application.personal_info?.postcode || 'Not provided'}</p>
              </div>
            </div>
          </section>

          {application.employment_history && (
            <section>
              <h3 className="text-lg font-semibold mb-4">Employment History</h3>
              {application.employment_history.recentEmployer && (
                <div className="bg-background rounded-lg p-4 mb-4">
                  <h4 className="font-medium mb-2">Most Recent Employer</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Company:</span> {application.employment_history.recentEmployer.company || 'Not provided'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Position:</span> {application.employment_history.recentEmployer.position || 'Not provided'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">From:</span> {formatDateDisplay(application.employment_history.recentEmployer.fromDate)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">To:</span> {formatDateDisplay(application.employment_history.recentEmployer.toDate)}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {application.skills_experience && (
            <section>
              <h3 className="text-lg font-semibold mb-4">Skills & Experience</h3>
              <div className="space-y-2">
                {Object.entries(application.skills_experience.skills || {}).map(([skill, hasSkill]) => (
                  hasSkill && (
                    <Badge key={skill} variant="secondary" className="mr-2 mb-2">
                      {skill.replace(/([A-Z])/g, ' $1').trim()}
                    </Badge>
                  )
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Reference Actions */}
      <ReferenceButtons 
        application={application}
        references={application.employment_history || {}}
        onUpdate={() => {}}
      />
    </div>
  );
}
