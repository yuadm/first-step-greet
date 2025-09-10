import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Crown, Mail, Lock, UserPlus } from "lucide-react";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateUser: (email: string, password: string, role: string) => void;
  creating: boolean;
}

export function CreateUserDialog({ 
  open, 
  onOpenChange, 
  onCreateUser, 
  creating 
}: CreateUserDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");

  const handleSubmit = () => {
    onCreateUser(email, password, role);
    // Reset form
    setEmail("");
    setPassword("");
    setRole("user");
  };

  const roleOptions = [
    {
      value: 'user',
      label: 'User',
      icon: <User className="w-4 h-4" />,
      description: 'Basic access to assigned features',
      color: 'bg-muted text-muted-foreground'
    },
    {
      value: 'admin',
      label: 'Admin',
      icon: <Crown className="w-4 h-4" />,
      description: 'Full system access and management',
      color: 'bg-destructive text-destructive-foreground'
    }
  ];

  const selectedRole = roleOptions.find(r => r.value === role);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Create New User
          </DialogTitle>
          <DialogDescription>
            Add a new user to the system and assign their initial role and permissions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="transition-all focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 6 characters required
              </p>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              User Role
            </Label>
            
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Role Preview */}
            {selectedRole && (
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {selectedRole.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{selectedRole.label}</span>
                          <Badge className={selectedRole.color}>
                            {selectedRole.label.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {selectedRole.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={creating || !email || !password}
              className="bg-gradient-primary hover:opacity-90"
            >
              {creating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}