import { useState, useMemo, useEffect } from "react";
import { Calendar, Users, CheckCircle, AlertTriangle, Clock, Eye, Plus, Edit, Trash2, Search } from "lucide-react";
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
import { useClientCompliancePeriodData } from "@/hooks/queries/useCompliancePeriodQueries";
import { ClientComplianceRecordViewDialog } from "./ClientComplianceRecordViewDialog";
import ClientSpotCheckFormDialog from "./ClientSpotCheckFormDialog";
import { ClientDeleteConfirmDialog } from "./ClientDeleteConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/contexts/PermissionsContext";

interface Client {
  id: string;
  name: string;
  branch_id: string;
  branches?: {
    name: string;
  };
}

interface ClientComplianceRecord {
  id: string;
  client_id: string;
  period_identifier: string;
  completion_date: string;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  completed_by: string | null;
  completion_method?: string;
  completed_by_user?: any;
  created_by_user?: any;
  updated_by_user?: any;
}

interface ClientComplianceStatus {
  client: Client;
  record: ClientComplianceRecord | null;
  status: 'completed' | 'overdue' | 'due' | 'pending';
}

interface ClientCompliancePeriodDialogProps {
  complianceTypeId: string;
  complianceTypeName: string;
  periodIdentifier: string;
  frequency: string;
  trigger: React.ReactNode;
}

export function ClientCompliancePeriodDialog({ 
  complianceTypeId, 
  complianceTypeName, 
  periodIdentifier, 
  frequency,
  trigger 
}: ClientCompliancePeriodDialogProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [spotCheckDialogOpen, setSpotCheckDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [editingSpotCheckData, setEditingSpotCheckData] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { companySettings } = useCompany();
  const { getAccessibleBranches, isAdmin } = usePermissions();

  // Fetch data using React Query
  const { data, isLoading, error, refetch } = useClientCompliancePeriodData(
    complianceTypeId, 
    frequency, 
    parseInt(periodIdentifier.split('-')[0]), 
    getAccessibleBranches(),
    isAdmin
  );
  
  const clients = data?.clients || [];
  const records = data?.records || [];

  // Filter records for the specific period
  const periodRecords = useMemo(() => {
    return records.filter(r => r.period_identifier === periodIdentifier);
  }, [records, periodIdentifier]);

  const isPeriodOverdue = (periodIdentifier: string, frequency: string, currentDate: Date): boolean => {
    const now = currentDate;
    
    switch (frequency.toLowerCase()) {
      case 'annual': {
        const year = parseInt(periodIdentifier);
        const endOfYear = new Date(year, 11, 31);
        return now > endOfYear;
      }
      case 'monthly': {
        const [year, month] = periodIdentifier.split('-').map(Number);
        const endOfMonth = new Date(year, month, 0);
        return now > endOfMonth;
      }
      case 'quarterly': {
        const [year, quarterStr] = periodIdentifier.split('-');
        const quarter = parseInt(quarterStr.replace('Q', ''));
        const endMonth = quarter * 3;
        const endOfQuarter = new Date(parseInt(year), endMonth, 0);
        return now > endOfQuarter;
      }
      case 'weekly': {
        const [year, weekStr] = periodIdentifier.split('-W');
        const weekNum = parseInt(weekStr);
        // Calculate end of week (Sunday)
        const startOfYear = new Date(parseInt(year), 0, 1);
        const daysToAdd = (weekNum * 7) - startOfYear.getDay();
        const endOfWeek = new Date(parseInt(year), 0, daysToAdd);
        return now > endOfWeek;
      }
      case 'bi-annual':
      case 'biannual': {
        const [year, halfStr] = periodIdentifier.split('-H');
        const half = parseInt(halfStr);
        const endMonth = half === 1 ? 6 : 12;
        const endOfHalf = new Date(parseInt(year), endMonth, 0);
        return now > endOfHalf;
      }
      default:
        return false;
    }
  };

  // Calculate client status using useMemo
  const clientStatusList = useMemo(() => {
    if (!clients || !periodRecords) return [];
    
    return clients.map(client => {
      const record = periodRecords.find(record => record.client_id === client.id);

      let status: 'completed' | 'overdue' | 'due' | 'pending' = 'due';
      
      if (record?.status === 'completed' || record?.completion_date) {
        status = 'completed';
      } else if (record?.status === 'overdue' || (record as any)?.is_overdue === true) {
        status = 'overdue';
      } else {
        // Check if period is overdue based on actual dates
        const now = new Date();
        const isOverdue = isPeriodOverdue(periodIdentifier, frequency, now);
        status = isOverdue ? 'overdue' : 'due';
      }

      return {
        client,
        record: record || null,
        status
      };
    });
  }, [clients, periodRecords, periodIdentifier, frequency]);

  // Calculate statistics
  const { completedCount, overdueCount, dueCount, pendingCount } = useMemo(() => {
    const completed = clientStatusList.filter(c => c.status === 'completed').length;
    const overdue = clientStatusList.filter(c => c.status === 'overdue').length;
    const due = clientStatusList.filter(c => c.status === 'due').length;

    return {
      completedCount: completed,
      overdueCount: overdue,
      dueCount: due,
      pendingCount: 0
    };
  }, [clientStatusList]);

  // Filter and pagination
  const filteredClients = useMemo(() => {
    if (!searchTerm) return clientStatusList;
    
    return clientStatusList.filter(item => 
      item.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.client.branches?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clientStatusList, searchTerm]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);
  const totalItems = filteredClients.length;

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/10 text-success border-success/20">Compliant</Badge>;
      case 'overdue':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Overdue</Badge>;
      case 'due':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Due</Badge>;
      default:
        return <Badge className="bg-muted/10 text-muted-foreground border-muted/20">Due</Badge>;
    }
  };

  const handleAddSpotCheck = async (client: Client) => {
    setSelectedClient(client);
    setEditingSpotCheckData(null);
    setSpotCheckDialogOpen(true);
  };

  const handleViewRecord = (client: Client, record: ClientComplianceRecord) => {
    setSelectedClient(client);
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  const handleSpotCheckSubmit = async (formData: any) => {
    if (!selectedClient) return;

    try {
      const transformedObservations = formData.observations.map((obs: any) => ({
        label: obs.label,
        value: obs.value,
        comments: obs.comments || ''
      }));

      const spotCheckData = {
        client_id: selectedClient.id,
        service_user_name: formData.serviceUserName,
        care_workers: formData.careWorkers || '',
        date: formData.date,
        time: formData.time || '00:00',
        performed_by: formData.completedBy,
        observations: transformedObservations,
      };

      const { data: spotCheckRecord, error: spotCheckError } = await supabase
        .from('client_spot_check_records')
        .insert(spotCheckData)
        .select()
        .single();

      if (spotCheckError) throw spotCheckError;

      // Get the correct period end date from the database function
      const { data: periodEndData, error: periodEndError } = await supabase
        .rpc('get_period_end_date', {
          p_frequency: frequency,
          p_period_identifier: periodIdentifier
        });

      if (periodEndError) {
        console.error('Error calculating period end date:', periodEndError);
        throw periodEndError;
      }

      const complianceRecordData = {
        client_compliance_type_id: complianceTypeId,
        client_id: selectedClient.id,
        period_identifier: periodIdentifier,
        completion_date: formData.date,
        status: 'completed',
        completion_method: 'spotcheck',
        notes: formData.notes || null,
        grace_period_end: periodEndData, // Use the calculated period end date
      };

      const { error: complianceError } = await supabase
        .from('client_compliance_period_records')
        .upsert(complianceRecordData, {
          onConflict: 'client_compliance_type_id,client_id,period_identifier'
        });

      if (complianceError) throw complianceError;

      await supabase
        .from('client_spot_check_records')
        .update({ compliance_record_id: spotCheckRecord.id })
        .eq('id', spotCheckRecord.id);

      toast({
        title: "Success",
        description: "Spot check record saved successfully",
      });

      setSpotCheckDialogOpen(false);
      setSelectedClient(null);
      setEditingSpotCheckData(null);
      refetch();

    } catch (error) {
      console.error('Error saving spot check:', error);
      toast({
        title: "Error",
        description: "Failed to save spot check record",
        variant: "destructive",
      });
    }
  };

  if (error) {
    console.error('Error loading data:', error);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {complianceTypeName} - {periodIdentifier}
          </DialogTitle>
          <DialogDescription>
            Client compliance status for this specific period
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
                      <p className="text-sm font-medium text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-success">{completedCount}</p>
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

            {/* Client Table */}
            <Card className="card-premium">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Clients
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/50">
                      <TableHead className="font-semibold">Client</TableHead>
                      <TableHead className="font-semibold">Branch</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Completion Date</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClients.map(({ client, record, status }) => (
                      <TableRow 
                        key={client.id} 
                        className="group hover:bg-gradient-to-r hover:from-muted/20 hover:to-transparent transition-all duration-200 border-b border-border/50"
                      >
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.branches?.name || 'N/A'}</TableCell>
                        <TableCell>{getStatusBadge(status)}</TableCell>
                        <TableCell>
                          {record?.completion_date 
                            ? new Date(record.completion_date).toLocaleDateString()
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {status === 'completed' ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewRecord(client, record!)}
                                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                                  title="View Record"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddSpotCheck(client)}
                                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRecord(record);
                                    setSelectedClient(client);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAddSpotCheck(client)}
                                className="hover:bg-primary/10 text-primary"
                              >
                                Add Record
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
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let page;
                          if (totalPages <= 5) {
                            page = i + 1;
                          } else if (currentPage <= 3) {
                            page = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            page = totalPages - 4 + i;
                          } else {
                            page = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              className={currentPage === page ? "bg-primary text-primary-foreground" : ""}
                            >
                              {page}
                            </Button>
                          );
                        })}
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
                      Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} clients
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        <ClientComplianceRecordViewDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          client={selectedClient}
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

        <ClientSpotCheckFormDialog
          open={spotCheckDialogOpen}
          onOpenChange={(open) => {
            setSpotCheckDialogOpen(open);
            if (!open) {
              setEditingSpotCheckData(null);
              setSelectedClient(null);
            }
          }}
          onSubmit={handleSpotCheckSubmit}
          initialData={editingSpotCheckData}
          periodIdentifier={periodIdentifier}
          frequency={frequency}
        />

        <ClientDeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          client={selectedClient}
          onConfirm={async () => {
            if (!selectedRecord) return;
            
            try {
              setIsDeleting(true);
              
              // Delete the compliance record
              const { error } = await supabase
                .from('client_compliance_period_records')
                .delete()
                .eq('id', selectedRecord.id);
              
              if (error) throw error;
              
              toast({
                title: "Record deleted",
                description: "Compliance record has been deleted successfully.",
              });
              
              setDeleteDialogOpen(false);
              setSelectedRecord(null);
              setSelectedClient(null);
              refetch();
            } catch (error) {
              console.error('Error deleting record:', error);
              toast({
                title: "Error",
                description: "Failed to delete compliance record.",
                variant: "destructive",
              });
            } finally {
              setIsDeleting(false);
            }
          }}
          isDeleting={isDeleting}
        />
      </DialogContent>
    </Dialog>
  );
}
