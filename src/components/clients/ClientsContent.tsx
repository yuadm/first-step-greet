import { useState, useEffect } from "react";
import { Plus, Search, Eye, Edit3, Trash2, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/contexts/PermissionsContext";

interface Client {
  id: string;
  name: string;
  branch_id: string;
  created_at: string;
  is_active: boolean;
  branches?: {
    name: string;
  };
}

interface Branch {
  id: string;
  name: string;
}

export function ClientsContent() {
  const [clients, setClients] = useState<Client[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const { isAdmin } = usePermissions();
  const { toast } = useToast();

  const [newClient, setNewClient] = useState({
    name: "",
    branch_id: ""
  });

  const [editedClient, setEditedClient] = useState({
    name: "",
    branch_id: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch clients with branch information
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          branches (
            name
          )
        `)
        .order('name');

      if (clientsError) throw clientsError;

      // Fetch branches for the form
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('id, name')
        .order('name');

      if (branchesError) throw branchesError;

      setClients(clientsData || []);
      setBranches(branchesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error loading data",
        description: "Could not fetch client data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addClient = async () => {
    if (!isAdmin) {
      toast({
        title: "Access denied",
        description: "You don't have permission to create clients.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (!newClient.name || !newClient.branch_id) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('clients')
        .insert([{
          name: newClient.name,
          branch_id: newClient.branch_id,
          is_active: true
        }]);

      if (error) throw error;

      toast({
        title: "Client added",
        description: "The client has been added successfully.",
      });

      setDialogOpen(false);
      setNewClient({
        name: "",
        branch_id: ""
      });
      fetchData();
    } catch (error) {
      console.error('Error adding client:', error);
      toast({
        title: "Error adding client",
        description: "Could not add client. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openViewDialog = (client: Client) => {
    setSelectedClient(client);
    setEditedClient({
      name: client.name || "",
      branch_id: client.branch_id || ""
    });
    setEditMode(false);
    setViewDialogOpen(true);
  };

  const updateClient = async () => {
    if (!isAdmin) {
      toast({
        title: "Access denied",
        description: "You don't have permission to edit clients.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedClient) return;
    
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: editedClient.name,
          branch_id: editedClient.branch_id
        })
        .eq('id', selectedClient.id);

      if (error) throw error;

      toast({
        title: "Client updated",
        description: "The client has been updated successfully.",
      });

      setEditMode(false);
      setViewDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error updating client",
        description: "Could not update client. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteClient = async (clientId: string) => {
    if (!isAdmin) {
      toast({
        title: "Access denied",
        description: "You don't have permission to delete clients.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: "Client deleted",
        description: "The client has been deleted successfully.",
      });

      setDeleteDialogOpen(false);
      setSelectedClient(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error deleting client",
        description: "Could not delete client. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getBranchName = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || 'Unknown Branch';
  };

  // Filter clients based on search term and branch filter
  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = branchFilter === "all" || client.branch_id === branchFilter;
    return matchesSearch && matchesBranch;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  // Reset page when filters change or items per page changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, branchFilter, itemsPerPage]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Clients</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Clients</h1>
        </div>
        {isAdmin && (
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Client
          </Button>
        )}
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-64">
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by branch" />
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
          </div>
        </CardContent>
      </Card>

      {/* Clients Table - Desktop */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Clients ({filteredClients.length} total, showing {paginatedClients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.branches?.name || getBranchName(client.branch_id)}</TableCell>
                  <TableCell>
                    {new Date(client.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewDialog(client)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedClient(client);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No clients found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Clients Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {paginatedClients.map((client) => (
          <Card key={client.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{client.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {client.branches?.name || getBranchName(client.branch_id)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Created: {new Date(client.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openViewDialog(client)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedClient(client);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
        {paginatedClients.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No clients found</p>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Items per page:</span>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) {
                      setPage(page - 1);
                      window.scrollTo(0, 0);
                    }
                  }}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const pageNumber = start + i;
                if (pageNumber > totalPages) return null;
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      isActive={pageNumber === page}
                      className={pageNumber === page ? "bg-primary text-primary-foreground" : ""}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(pageNumber);
                        window.scrollTo(0, 0);
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) {
                      setPage(page + 1);
                      window.scrollTo(0, 0);
                    }
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Add Client Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Client Name</Label>
              <Input
                id="name"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                placeholder="Enter client name"
              />
            </div>
            <div>
              <Label htmlFor="branch">Branch</Label>
              <Select
                value={newClient.branch_id}
                onValueChange={(value) => setNewClient({ ...newClient, branch_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addClient}>Add Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Client Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Edit Client" : "View Client"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Client Name</Label>
              <Input
                id="edit-name"
                value={editedClient.name}
                onChange={(e) => setEditedClient({ ...editedClient, name: e.target.value })}
                disabled={!editMode}
              />
            </div>
            <div>
              <Label htmlFor="edit-branch">Branch</Label>
              <Select
                value={editedClient.branch_id}
                onValueChange={(value) => setEditedClient({ ...editedClient, branch_id: value })}
                disabled={!editMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            {editMode ? (
              <>
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={updateClient}>Save Changes</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                {isAdmin && (
                  <Button onClick={() => setEditMode(true)}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client
              "{selectedClient?.name}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedClient && deleteClient(selectedClient.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}