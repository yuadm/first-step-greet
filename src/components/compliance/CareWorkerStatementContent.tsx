import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Filter, Download, Eye, Edit, Check, X, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CareWorkerStatementModal } from "./CareWorkerStatementModal";
import { CareWorkerStatementForm } from "./CareWorkerStatementForm";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { generateCareWorkerStatementPDF } from "@/lib/care-worker-statement-pdf";

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
  assigned_employee_id: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  branch_id: string | null;
  created_at: string;
  updated_at: string;
  employees?: {
    name: string;
  } | null;
  branches?: {
    name: string;
  } | null;
}

interface Branch {
  id: string;
  name: string;
}

export function CareWorkerStatementContent() {
  const [statements, setStatements] = useState<CareWorkerStatement[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStatement, setSelectedStatement] = useState<CareWorkerStatement | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin, getAccessibleBranches } = usePermissions();
  const { 
    canViewCompliance,
    canCreateCompliance,
    canEditCompliance,
    canDeleteCompliance
  } = usePagePermissions();

  // Debug logging
  console.log('CareWorkerStatementContent - Debug Info:', {
    isAdmin,
    canViewCompliance: canViewCompliance(),
    canCreateCompliance: canCreateCompliance(),
    canEditCompliance: canEditCompliance(),
    accessibleBranches: getAccessibleBranches(),
    user: user?.id
  });

  useEffect(() => {
    fetchStatements();
    fetchBranches();
  }, []);

  const fetchStatements = async () => {
    try {
      console.log('Fetching statements...');
      const { data, error } = await supabase
        .from('care_worker_statements')
        .select(`
          *,
          employees:assigned_employee_id (name),
          branches:branch_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Raw statements data:', data);
      
      // Filter statements by accessible branches for non-admin users
      let filteredData = data || [];
      const accessibleBranches = getAccessibleBranches();
      
      console.log('Before filtering - statements count:', filteredData.length);
      console.log('Accessible branches:', accessibleBranches);
      console.log('Is admin:', isAdmin);
      
      if (!isAdmin && accessibleBranches.length > 0) {
        filteredData = (data || []).filter(statement => {
          console.log('Checking statement branch_id:', statement.branch_id, 'against accessible:', accessibleBranches);
          return accessibleBranches.includes(statement.branch_id);
        });
        console.log('After filtering - statements count:', filteredData.length);
      }
      
      setStatements((filteredData as any) || []);
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

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .order('name');

      if (error) throw error;
      
      // Filter branches by accessible branches for non-admin users
      let filteredBranches = data || [];
      const accessibleBranches = getAccessibleBranches();
      
      if (!isAdmin && accessibleBranches.length > 0) {
        filteredBranches = (data || []).filter(branch => 
          accessibleBranches.includes(branch.id)
        );
      }
      
      setBranches((filteredBranches as Branch[]) || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const handleStatusUpdate = async (statementId: string, status: string, rejectionReason?: string) => {
    try {
      const updateData: any = {
        status,
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      };

      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('care_worker_statements')
        .update(updateData)
        .eq('id', statementId);

      if (error) throw error;

      await fetchStatements();
      toast({
        title: "Success",
        description: `Statement ${status} successfully`,
      });
    } catch (error) {
      console.error('Error updating statement:', error);
      toast({
        title: "Error",
        description: "Failed to update statement status",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = async (statement: CareWorkerStatement) => {
    try {
      const pdfBlob = await generateCareWorkerStatementPDF(statement);
      
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `care-worker-statement-${statement.care_worker_name.replace(/\s+/g, '-')}-${new Date(statement.report_date).toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "PDF downloaded successfully",
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'submitted': return 'secondary';
      case 'rejected': return 'destructive';
      case 'draft': return 'outline';
      default: return 'outline';
    }
  };

  const filteredStatements = statements.filter(statement => {
    const matchesSearch = 
      statement.care_worker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      statement.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || statement.status === statusFilter;
    const matchesBranch = branchFilter === "all" || statement.branch_id === branchFilter;
    
    return matchesSearch && matchesStatus && matchesBranch;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Statements</h1>
          <p className="text-muted-foreground">Manage care worker statement reports</p>
        </div>
        {canCreateCompliance() && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Statement
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="search">Search by Care Worker or Client Name</Label>
            <Input
              id="search"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="branch">Branch</Label>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Care Worker Statements ({filteredStatements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Care Worker</TableHead>
                <TableHead>Client Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Report Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStatements.map((statement) => (
                <TableRow key={statement.id}>
                  <TableCell className="font-medium">
                    {statement.care_worker_name}
                  </TableCell>
                  <TableCell>{statement.client_name}</TableCell>
                  <TableCell>{statement.branches?.name || 'No branch'}</TableCell>
                  <TableCell>{new Date(statement.report_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(statement.status)}>
                      {statement.status.charAt(0).toUpperCase() + statement.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {statement.employees?.name || 'Unassigned'}
                  </TableCell>
                  <TableCell>{new Date(statement.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedStatement(statement);
                          setIsFormOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {canEditCompliance() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedStatement(statement);
                            setIsModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}

                      {canEditCompliance() && statement.status === 'submitted' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(statement.id, 'approved')}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const reason = prompt('Enter rejection reason:');
                              if (reason) {
                                handleStatusUpdate(statement.id, 'rejected', reason);
                              }
                            }}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => exportToPDF(statement)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStatements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No statements found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CareWorkerStatementModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        statement={selectedStatement}
        branches={branches}
        onSuccess={() => {
          fetchStatements();
          setSelectedStatement(null);
        }}
      />

      <CareWorkerStatementForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        statement={selectedStatement}
        onSuccess={() => {
          fetchStatements();
          setSelectedStatement(null);
        }}
        readOnly={!canEditCompliance() && selectedStatement?.status !== 'draft' && selectedStatement?.status !== 'rejected'}
      />
    </div>
  );
}