import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle, XCircle, Plus, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LeaveRequestDialog } from "@/components/employee/LeaveRequestDialog";
import { DocumentUploadDialog } from "@/components/employee/DocumentUploadDialog";

interface LeaveRequest {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  notes: string;
  leave_type: { name: string };
  created_at: string;
}

interface LeaveManagementCardProps {
  employeeId: string;
}

export function LeaveManagementCard({ employeeId }: LeaveManagementCardProps) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaveRequests();
  }, [employeeId]);

  const fetchLeaveRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          leave_type:leave_types(name)
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setLeaveRequests(data || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      toast({
        title: "Error",
        description: "Failed to load leave requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card className="card-premium animate-fade-in">
        <CardHeader>
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="card-premium animate-fade-in">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary-foreground" />
              </div>
              Leave Management
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                size="sm"
                onClick={() => setShowLeaveDialog(true)}
                className="bg-gradient-primary hover:opacity-90 shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Request Leave
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDocumentDialog(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {leaveRequests.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">No leave requests yet</p>
                  <p className="text-sm text-muted-foreground">Your requests will appear here</p>
                </div>
              </div>
            ) : (
              leaveRequests.map((leave, index) => (
                <div 
                  key={leave.id} 
                  className="flex items-center justify-between p-4 bg-gradient-surface rounded-xl border border-card-border hover:shadow-md transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                      {getStatusIcon(leave.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{leave.leave_type.name}</span>
                        <Badge variant={getStatusVariant(leave.status)}>
                          {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <LeaveRequestDialog
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        employeeId={employeeId}
        onSuccess={fetchLeaveRequests}
      />
      
      <DocumentUploadDialog
        open={showDocumentDialog}
        onOpenChange={setShowDocumentDialog}
        employeeId={employeeId}
      />
    </>
  );
}