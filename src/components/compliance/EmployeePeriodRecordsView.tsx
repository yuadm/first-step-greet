import { useState, useEffect, useMemo } from "react";
import { Calendar, Download, AlertTriangle, Plus, Eye, Edit, Trash2, Filter, Users, Search, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { AddComplianceRecordModal } from "./AddComplianceRecordModal";

interface EmployeePeriodRecordsViewProps {
  complianceTypeId: string;
  complianceTypeName: string;
  frequency: string;
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

interface Employee {
  id: string;
  name: string;
  branch_id: string;
  branches?: {
    name: string;
  };
}

interface ComplianceRecord {
  id: string;
  employee_id: string;
  period_identifier: string;
  status: string;
  completion_date?: string;
  completion_method?: string;
  notes?: string;
  employees?: Employee;
}

export function EmployeePeriodRecordsView({ 
  complianceTypeId, 
  complianceTypeName, 
  frequency
}: EmployeePeriodRecordsViewProps) {
  const [periods, setPeriods] = useState<PeriodData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchData();
  }, [complianceTypeId, frequency, selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get accessible branches for the current user
      const accessibleBranches = getAccessibleBranches();
      
      // Build the query with branch filtering for non-admin users
      let employeesQuery = supabase
        .from('employees')
        .select(`
          *,
          branches (
            name
          )
        `);
      
      // Apply branch filtering for non-admin users
      if (!isAdmin && accessibleBranches.length > 0) {
        employeesQuery = employeesQuery.in('branch_id', accessibleBranches);
      }
      
      const { data: employeesData, error: employeesError } = await employeesQuery.order('name');

      if (employeesError) throw employeesError;

      // Fetch compliance records
      const { data: recordsData, error: recordsError } = await supabase
        .from('compliance_period_records')
        .select('*')
        .eq('compliance_type_id', complianceTypeId)
        .order('completion_date', { ascending: false });

      if (recordsError) throw recordsError;

      setEmployees(employeesData || []);
      setRecords(recordsData || []);
      
      generatePeriods(employeesData || [], recordsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error loading data",
        description: "Could not fetch employee compliance data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPeriod = () => {
    const now = new Date();
    switch (frequency.toLowerCase()) {
      case 'quarterly':
        return `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;
      case 'annual':
        return now.getFullYear().toString();
      case 'monthly':
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      default:
        return now.getFullYear().toString();
    }
  };

  const calculatePeriodStats = (periodId: string, employeesData: Employee[], recordsData: ComplianceRecord[]) => {
    const totalEmployees = employeesData.length;
    const periodRecords = recordsData.filter(record => record.period_identifier === periodId);
    const completedRecords = periodRecords.filter(record => 
      record.status === 'completed' || record.completion_date
    );
    
    return {
      record_count: periodRecords.length,
      completion_rate: totalEmployees > 0 ? (completedRecords.length / totalEmployees) * 100 : 0
    };
  };

  const generatePeriods = (employeesData: Employee[], recordsData: ComplianceRecord[]) => {
    const currentYear = new Date().getFullYear();
    const periods: PeriodData[] = [];
    
    const startYear = Math.max(2025, currentYear - 5);
    const endYear = currentYear;
    
    for (let year = endYear; year >= startYear; year--) {
      const isCurrentYear = year === currentYear;
      const yearsOld = currentYear - year;
      const shouldShowDownload = yearsOld >= 1; // Changed from >= 5 to >= 1 for easier testing
      const archiveDueYear = year + 6;
      
      switch (frequency.toLowerCase()) {
        case 'quarterly':
          if (year === selectedYear) {
            const currentQuarter = year === currentYear ? Math.ceil((new Date().getMonth() + 1) / 3) : 4;
            for (let quarter = currentQuarter; quarter >= 1; quarter--) {
              const periodId = `${year}-Q${quarter}`;
              const isCurrentQuarter = year === currentYear && quarter === Math.ceil((new Date().getMonth() + 1) / 3);
              const quarterStats = calculatePeriodStats(periodId, employeesData, recordsData);
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
          const annualStats = calculatePeriodStats(year.toString(), employeesData, recordsData);
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

  const getPeriodLabel = (periodId: string) => {
    switch (frequency.toLowerCase()) {
      case 'quarterly':
        return periodId.replace('-', ' ');
      case 'annual':
        return `Year ${periodId}`;
      default:
        return periodId;
    }
  };

  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const startYear = Math.max(2025, currentYear - 5);
    const years = [];
    for (let year = currentYear; year >= startYear; year--) {
      years.push(year);
    }
    return years;
  };

  const getCompletionBadge = (rate: number) => {
    if (rate >= 90) return "bg-success/10 text-success border-success/20";
    if (rate >= 70) return "bg-warning/10 text-warning border-warning/20";
    return "bg-destructive/10 text-destructive border-destructive/20";
  };

  const getEmployeeRecordForPeriod = (employeeId: string, periodId: string) => {
    return records.find(r => 
      r.employee_id === employeeId && 
      r.period_identifier === periodId
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'compliant':
        return "bg-success/10 text-success border-success/20";
      case 'overdue':
        return "bg-destructive/10 text-destructive border-destructive/20";
      case 'pending':
      default:
        return "bg-warning/10 text-warning border-warning/20";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
      case 'compliant':
        return 'Compliant';
      case 'overdue':
        return 'Overdue';
      case 'pending':
      default:
        return 'Due';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'compliant':
        return 'bg-success/5 border-success/20';
      case 'overdue':
        return 'bg-destructive/5 border-destructive/20';
      case 'pending':
      default:
        return 'bg-warning/5 border-warning/20';
    }
  };

  // Filtered and sorted employees
  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = employees;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.branches?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by branch
    if (selectedBranch !== "all") {
      filtered = filtered.filter(employee => employee.branch_id === selectedBranch);
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'branch':
          aValue = a.branches?.name || 'Unassigned';
          bValue = b.branches?.name || 'Unassigned';
          break;
        case 'status':
          const aRecord = getEmployeeRecordForPeriod(a.id, selectedPeriod);
          const bRecord = getEmployeeRecordForPeriod(b.id, selectedPeriod);
          const statusOrder = { 'completed': 3, 'pending': 2, 'overdue': 1 };
          aValue = statusOrder[aRecord?.status || 'pending'] || 0;
          bValue = statusOrder[bRecord?.status || 'pending'] || 0;
          break;
        case 'completion_date':
          const aRecordDate = getEmployeeRecordForPeriod(a.id, selectedPeriod);
          const bRecordDate = getEmployeeRecordForPeriod(b.id, selectedPeriod);
          aValue = aRecordDate?.completion_date ? new Date(aRecordDate.completion_date).getTime() : 0;
          bValue = bRecordDate?.completion_date ? new Date(bRecordDate.completion_date).getTime() : 0;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [employees, searchTerm, selectedBranch, selectedPeriod, sortField, sortDirection]);

  // Pagination calculations
  const totalItems = filteredAndSortedEmployees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = filteredAndSortedEmployees.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBranch, selectedPeriod]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const getUniqueBranches = () => {
    const branches = employees.map(employee => ({
      id: employee.branch_id || 'unassigned',
      name: employee.branches?.name || 'Unassigned'
    }));
    
    // Remove duplicates
    const uniqueBranches = branches.filter((branch, index, self) => 
      index === self.findIndex(b => b.id === branch.id)
    );
    
    return uniqueBranches;
  };

  const handleSort = (field: 'name' | 'branch' | 'status' | 'completion_date') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: 'name' | 'branch' | 'status' | 'completion_date') => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4" />
      : <ArrowDown className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "status" | "periods")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-muted/50 to-muted/30 p-1">
          <TabsTrigger 
            value="status" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground"
          >
            <Users className="w-4 h-4" />
            Employee Compliance Status
          </TabsTrigger>
          <TabsTrigger 
            value="periods"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground"
          >
            <Calendar className="w-4 h-4" />
            Period Records
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6">
          {selectedPeriod && (
            <div className="space-y-6">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                      Employee Compliance Overview
                    </h3>
                    <p className="text-muted-foreground">
                      Compliance status for {getPeriodLabel(selectedPeriod)}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger className="w-48 bg-background border-border/50 focus:border-primary/50">
                        <SelectValue placeholder="Select Period" />
                      </SelectTrigger>
                      <SelectContent>
                        {periods.map((period) => (
                          <SelectItem key={period.period_identifier} value={period.period_identifier}>
                            {getPeriodLabel(period.period_identifier)}
                            {period.is_current && " (Current)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Card className="card-premium">
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <CardTitle className="flex items-center gap-3">
                      <Users className="w-6 h-6" />
                      Employee Status ({totalItems} employees)
                    </CardTitle>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search employees..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64 bg-background border-border/50 focus:border-primary/50"
                        />
                      </div>
                      
                      <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                        <SelectTrigger className="w-48 bg-background border-border/50 focus:border-primary/50">
                          <SelectValue placeholder="All Branches" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Branches</SelectItem>
                          {getUniqueBranches().map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                          <div className="flex items-center gap-2">
                            Employee {getSortIcon('name')}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('branch')}>
                          <div className="flex items-center gap-2">
                            Branch {getSortIcon('branch')}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                          <div className="flex items-center gap-2">
                            Status {getSortIcon('status')}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('completion_date')}>
                          <div className="flex items-center gap-2">
                            Completion Date {getSortIcon('completion_date')}
                          </div>
                        </TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedEmployees.map((employee) => {
                        const record = getEmployeeRecordForPeriod(employee.id, selectedPeriod);
                        const status = record?.status || 'pending';
                        const isCompleted = status === 'completed';
                        
                        return (
                          <TableRow key={employee.id} className={`group hover:bg-gradient-to-r hover:from-muted/20 hover:to-transparent transition-all duration-200 border-b border-border/50 ${getStatusColor(status)}`}>
                           <TableCell className="font-semibold text-foreground">{employee.name}</TableCell>
                           <TableCell className="text-muted-foreground">{employee.branches?.name || 'Unassigned'}</TableCell>
                           <TableCell>
                             <Badge className={`${getStatusBadge(status)} font-medium`}>
                               {getStatusText(status)}
                             </Badge>
                           </TableCell>
                           <TableCell className="text-muted-foreground">
                             {record?.completion_date && record.completion_date !== '' 
                               ? record.completion_date 
                               : '-'
                             }
                           </TableCell>
                           <TableCell className="text-muted-foreground">
                             <div className="max-w-xs truncate">
                               {record?.notes || '-'}
                             </div>
                           </TableCell>
                           <TableCell>
                              <div className="flex items-center gap-2">
                                {!isCompleted && (
                                  <AddComplianceRecordModal
                                    employeeId={employee.id}
                                    employeeName={employee.name}
                                    complianceTypeId={complianceTypeId}
                                    complianceTypeName={complianceTypeName || ''}
                                    frequency={frequency}
                                    periodIdentifier={selectedPeriod}
                                    onRecordAdded={fetchData}
                                    trigger={
                                      <Button variant="outline" size="sm">
                                        Add Record
                                      </Button>
                                    }
                                  />
                                )}
                             </div>
                           </TableCell>
                         </TableRow>
                        );
                      })}
                    
                      {paginatedEmployees.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No employees found
                          </TableCell>
                        </TableRow>
                      )}
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
        </TabsContent>

        <TabsContent value="periods" className="space-y-6">
       <div className="space-y-6">
         {/* Period Controls */}
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
           <h3 className="text-xl font-semibold">Employee Compliance Records</h3>
           
           {frequency.toLowerCase() !== 'annual' && (
             <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
               <SelectTrigger className="w-40">
                 <SelectValue placeholder="Select Year" />
               </SelectTrigger>
               <SelectContent>
                 {getAvailableYears().map((year) => (
                   <SelectItem key={year} value={year.toString()}>
                     {year}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           )}
         </div>

         {/* Periods Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {periods.map((period, index) => {
             const showDownload = period.download_available && period.download_available_date;
             
             return (
               <Card 
                 key={period.period_identifier} 
                 className={`card-premium transition-all duration-300 ${
                   period.is_current ? 'ring-2 ring-primary border-primary bg-primary/5' : ''
                 }`}
                 style={{ animationDelay: `${index * 50}ms` }}
               >
                 <CardHeader className="pb-3">
                   <div className="flex items-center justify-between">
                     <CardTitle className="text-lg flex items-center gap-2">
                       <Calendar className="w-5 h-5" />
                       {getPeriodLabel(period.period_identifier)}
                     </CardTitle>
                     {period.is_current && (
                       <Badge className="bg-primary/10 text-primary border-primary/20">
                         Current
                       </Badge>
                     )}
                   </div>
                 </CardHeader>
                 
                 <CardContent className="space-y-4">
                   <div className="grid grid-cols-2 gap-4 text-sm">
                     <div>
                       <p className="text-muted-foreground">Records</p>
                       <p className="font-semibold">{period.record_count}</p>
                     </div>
                     <div>
                       <p className="text-muted-foreground">Completion</p>
                       <Badge className={getCompletionBadge(period.completion_rate)}>
                         {period.completion_rate.toFixed(1)}%
                       </Badge>
                     </div>
                   </div>

                   {/* Archive Warning */}
                   {period.archive_due_date && (
                     <div className="flex items-center gap-2 p-2 bg-warning/10 rounded-lg">
                       <AlertTriangle className="w-4 h-4 text-warning" />
                       <span className="text-sm text-warning">
                         Archive due: {new Date(period.archive_due_date).toLocaleDateString()}
                       </span>
                     </div>
                   )}

                   {/* Download Button */}
                   {showDownload && (
                     <Button 
                       variant="outline" 
                       size="sm" 
                       className="w-full"
                       onClick={() => {
                         toast({
                           title: "Download Started",
                           description: `Downloading data for ${period.period_identifier}...`,
                         });
                       }}
                     >
                       <Download className="w-4 h-4 mr-2" />
                       Download Archive
                     </Button>
                   )}

                   {/* Manage Period Button */}
                   {!period.download_available && (
                     <Button 
                       variant="default" 
                       size="sm" 
                       className="w-full bg-gradient-primary hover:opacity-90"
                       onClick={() => {
                         setSelectedPeriod(period.period_identifier);
                         setActiveTab("status");
                       }}
                     >
                       Manage Period
                     </Button>
                   )}
                 </CardContent>
               </Card>
             );
           })}
         </div>

         {/* Legend */}
         <Card className="card-premium">
           <CardContent className="p-4">
             <div className="flex flex-wrap gap-4 text-sm">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-primary rounded-full"></div>
                 <span>Current Period</span>
               </div>
               <div className="flex items-center gap-2">
                 <Download className="w-4 h-4 text-muted-foreground" />
                 <span>Download Available (3 months before deletion)</span>
               </div>
               <div className="flex items-center gap-2">
                 <AlertTriangle className="w-4 h-4 text-warning" />
                 <span>Archive Due</span>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}