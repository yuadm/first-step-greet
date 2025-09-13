import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Edit, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

interface StatementsCardProps {
  employeeId: string;
}

export function StatementsCard({ employeeId }: StatementsCardProps) {
  const [statements, setStatements] = useState<CareWorkerStatement[]>([]);
  const [selectedStatement, setSelectedStatement] = useState<CareWorkerStatement | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStatements();
  }, [employeeId]);

  const fetchStatements = async () => {
    try {
      const { data, error } = await supabase
        .from('care_worker_statements')
        .select('*')
        .eq('assigned_employee_id', employeeId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setStatements(data || []);
    } catch (error) {
      console.error('Error fetching statements:', error);
      toast({
        title: "Error",
        description: "Failed to load care worker statements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'submitted': return <Clock className="h-4 w-4 text-primary" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'draft': return <AlertCircle className="h-4 w-4 text-warning" />;
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
      <Card className="card-premium animate-fade-in">
        <CardHeader>
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded animate-pulse" />
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
          <CardTitle className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            Care Worker Statements
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {statements.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">No statements assigned</p>
                  <p className="text-sm text-muted-foreground">Statements will appear here when assigned</p>
                </div>
              </div>
            ) : (
              statements.map((statement, index) => (
                <div 
                  key={statement.id} 
                  className="p-4 bg-gradient-surface rounded-xl border border-card-border hover:shadow-md transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                        {getStatusIcon(statement.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{statement.care_worker_name}</span>
                          <Badge variant={getStatusVariant(statement.status)}>
                            {statement.status.charAt(0).toUpperCase() + statement.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Client: {statement.client_name}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Report Date: {new Date(statement.report_date).toLocaleDateString()}
                    </div>
                    <Button
                      variant={statement.status === 'draft' || statement.status === 'rejected' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleViewStatement(statement)}
                      className="h-8"
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
                    <div className="mt-3 p-2 bg-destructive-soft rounded-lg border border-destructive/20">
                      <p className="text-xs font-medium text-destructive mb-1">Rejection Reason:</p>
                      <p className="text-xs text-destructive/80">{statement.rejection_reason}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <CareWorkerStatementForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        statement={selectedStatement}
        onSuccess={() => {
          fetchStatements();
          setSelectedStatement(null);
        }}
        readOnly={selectedStatement?.status === 'approved' || selectedStatement?.status === 'submitted'}
      />
    </>
  );
}