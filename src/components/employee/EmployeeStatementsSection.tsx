import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Edit, Clock, CheckCircle, XCircle, AlertCircle, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEmployeeAuth } from "@/contexts/EmployeeAuthContext";
import { CareWorkerStatementForm } from "@/components/compliance/CareWorkerStatementForm";

interface CareWorkerStatement {
  id: string;
  care_worker_name: string;
  client_name: string;
  client_address: string;
  report_date: string;
  statement: string | null;
  person_completing_report: string | null;
  position: string | null;
  digital_signature: string | null;
  completion_date: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface EmployeeStatementsSectionProps {
  limit?: number;
  showHeader?: boolean;
}

export function EmployeeStatementsSection({ limit, showHeader = true }: EmployeeStatementsSectionProps) {
  const [statements, setStatements] = useState<CareWorkerStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatement, setSelectedStatement] = useState<CareWorkerStatement | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { toast } = useToast();
  const { employee } = useEmployeeAuth();

  useEffect(() => {
    if (employee) {
      fetchMyStatements();
    }
  }, [employee]);

  const fetchMyStatements = async () => {
    if (!employee) return;

    try {
      let query = supabase
        .from('care_worker_statements')
        .select('*')
        .eq('assigned_employee_id', employee.id)
        .order('created_at', { ascending: false });
      
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setStatements(data || []);
    } catch (error) {
      console.error('Error fetching statements:', error);
      toast({
        title: "Error",
        description: "Failed to load your care worker statements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'submitted': return <Clock className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'draft': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'submitted': return 'secondary';
      case 'rejected': return 'destructive';
      case 'draft': return 'outline';
      default: return 'outline';
    }
  };

  const handleViewStatement = (statement: CareWorkerStatement) => {
    setSelectedStatement(statement);
    setIsFormOpen(true);
  };

  if (loading) {
    return (
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-4">
          {showHeader && (
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              Care Worker Statements
            </CardTitle>
          )}
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-4">
          {showHeader && (
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              Care Worker Statements
              {statements.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {statements.length}
                </Badge>
              )}
            </CardTitle>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {statements.length === 0 ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Statements Assigned</h3>
              <p className="text-gray-500">You don't have any care worker statements assigned at this time</p>
            </div>
          ) : (
            <div className="space-y-3">
              {statements.map((statement, index) => (
                <div 
                  key={statement.id} 
                  className="group p-4 border-2 border-blue-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 rounded-xl hover:border-blue-200 transition-all duration-300 hover:shadow-md"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-lg">
                      {getStatusIcon(statement.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate">{statement.care_worker_name}</h4>
                          <p className="text-sm text-gray-600 truncate">Client: {statement.client_name}</p>
                        </div>
                        <Badge variant={getStatusVariant(statement.status)} className="flex items-center gap-1 px-2 py-1 text-xs whitespace-nowrap">
                          {statement.status.charAt(0).toUpperCase() + statement.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          Report: {new Date(statement.report_date).toLocaleDateString()}
                        </p>
                        <Button
                          variant={statement.status === 'draft' || statement.status === 'rejected' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleViewStatement(statement)}
                          className="text-xs px-3 py-1 h-7"
                        >
                          {statement.status === 'draft' || statement.status === 'rejected' ? (
                            <>
                              <Edit className="h-3 w-3 mr-1" />
                              Complete
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {statement.rejection_reason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs font-medium text-red-800 mb-1">Rejection Reason:</p>
                          <p className="text-xs text-red-700 line-clamp-2">{statement.rejection_reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CareWorkerStatementForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        statement={selectedStatement}
        onSuccess={() => {
          fetchMyStatements();
          setSelectedStatement(null);
        }}
        readOnly={selectedStatement?.status === 'approved' || selectedStatement?.status === 'submitted'}
      />
    </>
  );
}