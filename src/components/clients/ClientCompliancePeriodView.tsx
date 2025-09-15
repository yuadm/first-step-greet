import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Calendar, Filter, Search, FileText, Users, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { generatePeriods } from '@/utils/timeSlotUtils';
import { ClientSpotCheckFormDialog } from '../clients/ClientSpotCheckFormDialog';
import { ClientSpotCheckViewDialog } from '../clients/ClientSpotCheckViewDialog';
import { useClientCompliancePeriodData } from '@/hooks/queries/useCompliancePeriodQueries';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/contexts/CompanyContext';
import { usePermissions } from '@/contexts/PermissionsContext';

interface ClientCompliancePeriodViewProps {
  complianceTypeId: string;
  complianceTypeName: string;
  frequency: string;
  selectedFilter?: string | null;
}

interface PeriodData {
  period_identifier: string;
  year: number;
  record_count: number;
  completion_rate: number;
  download_available: boolean;
  archive_due_date?: string;
  download_available_date?: string;
  is_current: boolean;
}

interface Client {
  id: string;
  name: string;
  branch_id: string;
  branches?: {
    name: string;
  };
}

export function ClientCompliancePeriodView({ 
  complianceTypeId, 
  complianceTypeName, 
  frequency,
  selectedFilter
}: ClientCompliancePeriodViewProps) {
  const [periods, setPeriods] = useState<PeriodData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [spotCheckDialogOpen, setSpotCheckDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"status" | "periods">("status");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<'name' | 'branch' | 'status' | 'completion_date'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  const { toast } = useToast();
  const { companySettings } = useCompany();
  const { getAccessibleBranches, isAdmin } = usePermissions();

  // React Query hooks
  const { data: clientComplianceData, error: dataError, isLoading } = useClientCompliancePeriodData(
    complianceTypeId, 
    frequency, 
    selectedYear
  );

  const clients = clientComplianceData?.clients || [];
  const records = clientComplianceData?.records || [];

  useEffect(() => {
    if (clientComplianceData) {
      generatePeriods(clients, records);
    }
  }, [clientComplianceData, clients, records]);

  useEffect(() => {
    if (dataError) {
      console.error('Error fetching data:', dataError);
      toast({
        title: "Error loading data",
        description: "Could not fetch client compliance data.",
        variant: "destructive",
      });
    }
  }, [dataError, toast]);

  const generatePeriods = (clientsData: Client[], recordsData: any[]) => {
    const currentYear = new Date().getFullYear();
    const periods: PeriodData[] = [];
    
    const startYear = Math.max(2025, currentYear - 5);
    const endYear = currentYear;
    
    for (let year = endYear; year >= startYear; year--) {
      const isCurrentYear = year === currentYear;
      const yearsOld = currentYear - year;
      const shouldShowDownload = yearsOld >= 1;
      const archiveDueYear = year + 6;
      
      switch (frequency.toLowerCase()) {
        case 'quarterly':
          if (year === selectedYear) {
            const currentQuarter = year === currentYear ? Math.ceil((new Date().getMonth() + 1) / 3) : 4;
            for (let quarter = currentQuarter; quarter >= 1; quarter--) {
              const periodId = `${year}-Q${quarter}`;
              const isCurrentQuarter = year === currentYear && quarter === Math.ceil((new Date().getMonth() + 1) / 3);
              const quarterStats = calculatePeriodStats(periodId, clientsData, recordsData);
              periods.push({
                period_identifier: periodId,
                year,
                record_count: quarterStats.record_count,
                completion_rate: quarterStats.completion_rate,
                download_available: shouldShowDownload,
                archive_due_date: shouldShowDownload ? `${archiveDueYear}-01-01` : undefined,
                download_available_date: shouldShowDownload ? `${archiveDueYear - 1}-10-01` : undefined,
                is_current: isCurrentQuarter
              });
            }
          }
          break;
        
        case 'annual':
          const annualStats = calculatePeriodStats(year.toString(), clientsData, recordsData);
          periods.push({
            period_identifier: year.toString(),
            year,
            record_count: annualStats.record_count,
            completion_rate: annualStats.completion_rate,
            download_available: shouldShowDownload,
            archive_due_date: shouldShowDownload ? `${archiveDueYear}-01-01` : undefined,
            download_available_date: shouldShowDownload ? `${archiveDueYear - 1}-10-01` : undefined,
            is_current: isCurrentYear
          });
          break;
      }
    }
    
    setPeriods(periods);
    if (periods.length > 0 && !selectedPeriod) {
      const currentPeriod = periods.find(p => p.is_current) || periods[0];
      setSelectedPeriod(currentPeriod.period_identifier);
    }
  };

  const calculatePeriodStats = (periodId: string, clientsData: Client[], recordsData: any[]) => {
    const totalClients = clientsData.length;
    const periodRecords = recordsData.filter(record => record.period_identifier === periodId);
    const completedRecords = periodRecords.filter(record => 
      record.status === 'completed' || record.completion_date
    );
    
    return {
      record_count: periodRecords.length,
      completion_rate: totalClients > 0 ? (completedRecords.length / totalClients) * 100 : 0
    };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading client compliance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{complianceTypeName}</h2>
          <p className="text-muted-foreground">Track client compliance for {frequency.toLowerCase()} requirements</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "status" | "periods")}>
        <TabsList>
          <TabsTrigger value="status">Client Status</TabsTrigger>
          <TabsTrigger value="periods">Period Management</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {/* Add branch options here */}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Client Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {clients.length} clients found for compliance tracking
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="periods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Period Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Period management for {frequency.toLowerCase()} compliance
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Spot Check Dialog */}
      <ClientSpotCheckFormDialog
        open={spotCheckDialogOpen}
        onOpenChange={setSpotCheckDialogOpen}
        client={selectedClient}
        onSubmit={async (data) => {
          // Handle spot check submission
          console.log('Spot check data:', data);
          setSpotCheckDialogOpen(false);
          setSelectedClient(null);
        }}
      />
    </div>
  );
}