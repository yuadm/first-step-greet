import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, Download, Eye, FileText, Filter, Search, Trash2, UserPlus } from 'lucide-react';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { DocumentEditDialog } from './DocumentEditDialog';
import { DocumentViewDialog } from './DocumentViewDialog';
import { useDocuments, useDocumentEmployees, useDocumentTypes, useDocumentBranches, useDocumentActions } from '@/hooks/queries/useDocumentQueries';
import { usePermissions } from '@/contexts/PermissionsContext';
import { usePagePermissions } from '@/hooks/usePagePermissions';

// Document interface
interface Document {
  id: string;
  employee_id: string;
  document_type_id: string;
  branch_id: string;
  document_number?: string;
  issue_date?: string;
  expiry_date: string;
  status: string;
  notes?: string;
  employees?: {
    name: string;
    email: string;
    branch: string;
  };
  document_types?: {
    name: string;
  };
}

// Employee interface
interface Employee {
  id: string;
  name: string;
  email: string;
  branch: string;
  branch_id: string;
  employee_code: string;
  sponsored?: boolean;
  twenty_hours?: boolean;
}

// DocumentType interface
interface DocumentType {
  id: string;
  name: string;
}

// Branch interface
interface Branch {
  id: string;
  name: string;
}

export function DocumentsContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDocumentForEdit, setSelectedDocumentForEdit] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const { toast } = useToast();
  const { getAccessibleBranches, isAdmin } = usePermissions();
  const { 
    canViewDocuments,
    canCreateDocuments,
    canEditDocuments,
    canDeleteDocuments,
    canUploadDocuments
  } = usePagePermissions();

  // React Query hooks
  const { data: documents = [], error: documentsError, isLoading } = useDocuments();
  const { data: employees = [], error: employeesError } = useDocumentEmployees();
  const { data: documentTypes = [], error: documentTypesError } = useDocumentTypes();
  const { data: branches = [], error: branchesError } = useDocumentBranches();
  const { createDocument, updateDocument, deleteDocuments } = useDocumentActions();

  const filteredDocuments = useMemo(() => {
    return documents.filter(document => {
      const matchesSearch = 
        document.employees?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        document.employees?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        document.document_types?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        document.document_number?.toLowerCase()?.includes(searchTerm.toLowerCase());
      
      const isValidDate = (dateStr: string) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
      };

      const expiryDate = isValidDate(document.expiry_date) ? new Date(document.expiry_date) : null;
      let documentStatus = 'valid';
      
      if (expiryDate) {
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        
        if (daysUntilExpiry < 0) {
          documentStatus = 'expired';
        } else if (daysUntilExpiry <= 30) {
          documentStatus = 'expiring';
        }
      }
      
      const matchesStatus = statusFilter === 'all' || documentStatus === statusFilter;
      const matchesBranch = branchFilter === 'all' || document.employees?.branch === branchFilter;
      
      // Category filtering
      const employee = employees.find(emp => emp.id === document.employee_id);
      let matchesCategory = true;
      
      if (categoryFilter === 'sponsored') {
        matchesCategory = employee?.sponsored === true;
      } else if (categoryFilter === '20-hours') {
        matchesCategory = employee?.twenty_hours === true;
      }
      
      // For non-admin users, filter by accessible branches
      const accessibleBranches = getAccessibleBranches();
      let hasAccess = true;
      if (!isAdmin && accessibleBranches.length > 0) {
        const employeeBranchId = branches.find(b => b.name === document.employees?.branch)?.id;
        hasAccess = accessibleBranches.includes(employeeBranchId || '');
      }
      
      return matchesSearch && matchesStatus && matchesBranch && matchesCategory && hasAccess;
    });
  }, [documents, employees, branches, searchTerm, statusFilter, branchFilter, categoryFilter, getAccessibleBranches, isAdmin]);

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded-lg w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-muted rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Manage employee documents and track expiry dates</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{filteredDocuments.length}</div>
          <div className="text-sm text-muted-foreground">Total Documents</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="valid">Valid</SelectItem>
            <SelectItem value="expiring">Expiring Soon</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.name}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Employee</th>
                  <th className="text-left p-4 font-medium">Document Type</th>
                  <th className="text-left p-4 font-medium">Expiry Date</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDocuments.map((document) => (
                  <tr key={document.id} className="border-b">
                    <td className="p-4">
                      <div className="font-medium">{document.employees?.name || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">{document.employees?.branch}</div>
                    </td>
                    <td className="p-4">{document.document_types?.name || 'Unknown Type'}</td>
                    <td className="p-4">{format(new Date(document.expiry_date), 'MMM dd, yyyy')}</td>
                    <td className="p-4">
                      <Badge variant="outline">Valid</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(document);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <DocumentViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        document={selectedDocument}
      />

      {/* Edit Dialog */}
      <DocumentEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        document={selectedDocumentForEdit}
        employees={employees}
        documentTypes={documentTypes}
        branches={branches}
        onSave={(data) => {
          if (selectedDocumentForEdit) {
            updateDocument.mutate({ id: selectedDocumentForEdit.id, ...data });
          }
        }}
      />
    </div>
  );
}
