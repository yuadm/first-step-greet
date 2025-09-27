import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Trash2, 
  Edit, 
  Plus, 
  Settings, 
  Clock, 
  Flag, 
  User, 
  Phone, 
  Award, 
  FileText,
  Save,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface JobApplicationSetting {
  id: string;
  category: string;
  setting_type?: string;
  setting_key: string;
  setting_value: any;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function UserFriendlyApplicationSettings() {
  const [settings, setSettings] = useState<JobApplicationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('personal');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<JobApplicationSetting | null>(null);
  const { toast } = useToast();

  const categories = [
    { 
      key: 'personal', 
      label: 'Personal Info', 
      description: 'Personal information options',
      icon: User,
      color: 'from-blue-500/10 to-blue-600/5 border-blue-200/50'
    },
    { 
      key: 'emergency', 
      label: 'Emergency Contact', 
      description: 'Emergency contact types',
      icon: Phone,
      color: 'from-red-500/10 to-red-600/5 border-red-200/50'
    },
    { 
      key: 'shift', 
      label: 'Shifts', 
      description: 'Available shift patterns',
      icon: Clock,
      color: 'from-green-500/10 to-green-600/5 border-green-200/50'
    },
    { 
      key: 'skills', 
      label: 'Skills', 
      description: 'Skills and categories',
      icon: Award,
      color: 'from-purple-500/10 to-purple-600/5 border-purple-200/50'
    },
    { 
      key: 'status', 
      label: 'Application Status', 
      description: 'Application status options',
      icon: Flag,
      color: 'from-orange-500/10 to-orange-600/5 border-orange-200/50'
    },
    { 
      key: 'steps', 
      label: 'Form Steps', 
      description: 'Application form steps',
      icon: Settings,
      color: 'from-gray-500/10 to-gray-600/5 border-gray-200/50'
    },
    { 
      key: 'fields', 
      label: 'Form Fields', 
      description: 'Form field configuration',
      icon: FileText,
      color: 'from-teal-500/10 to-teal-600/5 border-teal-200/50'
    },
    { 
      key: 'reference', 
      label: 'References', 
      description: 'Reference requirements',
      icon: FileText,
      color: 'from-indigo-500/10 to-indigo-600/5 border-indigo-200/50'
    },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_application_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategorySettings = (category: string) => {
    return settings.filter(s => s.category === category);
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('job_application_settings')
        .update({ is_active: !currentActive })
        .eq('id', id);

      if (error) throw error;

      await fetchSettings();
      toast({
        title: "Success",
        description: `Setting ${!currentActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
    }
  };

  const deleteSetting = async (id: string) => {
    try {
      const { error } = await supabase
        .from('job_application_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchSettings();
      toast({
        title: "Success",
        description: "Setting deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting setting:', error);
      toast({
        title: "Error",
        description: "Failed to delete setting",
        variant: "destructive",
      });
    }
  };

  const renderSettingDisplay = (setting: JobApplicationSetting) => {
    const value = setting.setting_value;
    
    if (setting.category === 'personal') {
      const typeLabels = {
        'title': 'Title',
        'nationality': 'Nationality', 
        'gender': 'Gender',
        'marital_status': 'Marital Status',
        'ethnicity': 'Ethnicity',
        'language': 'Language',
        'religion': 'Religion',
        'qualification': 'Qualification',
        'borough': 'Borough',
        'dbs_type': 'DBS Type',
        'personal_care': 'Personal Care'
      };
      
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {typeLabels[setting.setting_type as keyof typeof typeLabels] || setting.setting_type}
            </Badge>
            <span className="font-medium">{value?.value || value?.name || setting.setting_key}</span>
          </div>
        </div>
      );
    }

    if (setting.category === 'shift') {
      return (
        <div className="space-y-2">
          <div className="font-medium">{value?.label || value?.name}</div>
          <div className="text-sm text-muted-foreground">
            {value?.start_time} - {value?.end_time}
          </div>
        </div>
      );
    }

    if (setting.category === 'status') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full border" 
              style={{ backgroundColor: value?.status_color || '#6b7280' }}
            />
            <span className="font-medium">{value?.status_label || value?.status_name}</span>
            {value?.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
          </div>
        </div>
      );
    }

    if (setting.category === 'skills') {
      const isCategory = setting.setting_type === 'category';
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={isCategory ? "default" : "outline"} className="text-xs">
              {isCategory ? 'Category' : 'Skill'}
            </Badge>
            <span className="font-medium">{value?.name}</span>
          </div>
          {value?.description && (
            <div className="text-sm text-muted-foreground">{value.description}</div>
          )}
        </div>
      );
    }

    if (setting.category === 'steps') {
      return (
        <div className="space-y-2">
          <div className="font-medium">{value?.display_name || value?.step_name}</div>
          <div className="flex items-center gap-2">
            <Badge variant={value?.is_enabled ? "default" : "secondary"} className="text-xs">
              {value?.is_enabled ? 'Enabled' : 'Disabled'}
            </Badge>
            {value?.is_required && <Badge variant="outline" className="text-xs">Required</Badge>}
          </div>
        </div>
      );
    }

    if (setting.category === 'emergency') {
      return (
        <div className="space-y-2">
          <div className="font-medium">{value?.value || value?.name || setting.setting_key}</div>
        </div>
      );
    }

    // Default fallback
    return (
      <div className="space-y-2">
        <div className="font-medium">{setting.setting_key}</div>
        <div className="text-sm text-muted-foreground">
          {typeof value === 'object' ? JSON.stringify(value) : value}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading settings...</div>;
  }

  return (
    <Card className="card-premium animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-primary" />
          Job Application Settings
        </CardTitle>
        <p className="text-muted-foreground">
          Manage all aspects of your job application process in a user-friendly interface
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            {categories.map((category) => (
              <TabsTrigger 
                key={category.key} 
                value={category.key}
                className="text-xs"
              >
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => {
            const Icon = category.icon;
            const categorySettings = getCategorySettings(category.key);
            
            return (
              <TabsContent key={category.key} value={category.key} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center border`}>
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{category.label}</h3>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                  <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add {category.label}
                      </Button>
                    </DialogTrigger>
                    <AddItemDialog 
                      category={category.key}
                      onSuccess={() => {
                        setShowAddDialog(false);
                        fetchSettings();
                      }}
                    />
                  </Dialog>
                </div>

                <div className="grid gap-4">
                  {categorySettings.length === 0 ? (
                    <Card className="p-8 text-center border-dashed">
                      <Icon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-medium text-lg mb-2">No {category.label} Settings</h3>
                      <p className="text-muted-foreground mb-4">
                        Start by adding your first {category.label.toLowerCase()} setting.
                      </p>
                    </Card>
                  ) : (
                    categorySettings.map((setting) => (
                      <Card key={setting.id} className={`p-4 transition-all hover:shadow-md ${setting.is_active ? 'border-primary/20' : 'border-muted opacity-60'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant={setting.is_active ? "default" : "secondary"} className="text-xs">
                                {setting.is_active ? "Active" : "Inactive"}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Order: {setting.display_order}
                              </Badge>
                            </div>
                            {renderSettingDisplay(setting)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={setting.is_active}
                              onCheckedChange={() => toggleActive(setting.id, setting.is_active)}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingItem(setting)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteSetting(setting.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Add Item Dialog Component
function AddItemDialog({ 
  category, 
  onSuccess 
}: { 
  category: string; 
  onSuccess: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    description: '',
    type: '',
    color: '#6b7280',
    startTime: '',
    endTime: '',
    isEnabled: true,
    isRequired: false,
    isDefault: false,
    displayOrder: 0
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!formData.name.trim() && !formData.value.trim()) {
      toast({
        title: "Error",
        description: "Please provide a name or value",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let settingValue: any = {};
      let settingKey = '';

      // Build setting value based on category
      switch (category) {
        case 'personal':
          settingValue = { value: formData.value };
          settingKey = `${formData.type}_${formData.value}`;
          break;
        case 'shift':
          settingValue = {
            name: formData.name,
            label: formData.name,
            start_time: formData.startTime,
            end_time: formData.endTime
          };
          settingKey = formData.name.toLowerCase().replace(/\s+/g, '_');
          break;
        case 'status':
          settingValue = {
            status_name: formData.name,
            status_label: formData.name,
            status_color: formData.color,
            is_default: formData.isDefault
          };
          settingKey = formData.name.toLowerCase().replace(/\s+/g, '_');
          break;
        case 'skills':
          settingValue = {
            name: formData.name,
            description: formData.description
          };
          settingKey = formData.name.toLowerCase().replace(/\s+/g, '_');
          break;
        case 'emergency':
          settingValue = { value: formData.value || formData.name };
          settingKey = (formData.value || formData.name).toLowerCase().replace(/\s+/g, '_');
          break;
        default:
          settingValue = { name: formData.name, value: formData.value };
          settingKey = formData.name.toLowerCase().replace(/\s+/g, '_');
      }

      const { error } = await supabase
        .from('job_application_settings')
        .insert({
          category,
          setting_type: formData.type || category,
          setting_key: settingKey,
          setting_value: settingValue,
          display_order: formData.displayOrder,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Setting added successfully",
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving setting:', error);
      toast({
        title: "Error",
        description: "Failed to save setting",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add {category} Setting</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        {category === 'personal' && (
          <>
            <div>
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="language">Language</SelectItem>
                  <SelectItem value="borough">Borough</SelectItem>
                  <SelectItem value="nationality">Nationality</SelectItem>
                  <SelectItem value="gender">Gender</SelectItem>
                  <SelectItem value="ethnicity">Ethnicity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Value</Label>
              <Input 
                value={formData.value} 
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="e.g., Spanish, Westminster, Mr" 
              />
            </div>
          </>
        )}

        {category === 'shift' && (
          <>
            <div>
              <Label>Shift Name</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Morning Shift" 
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Start Time</Label>
                <Input 
                  type="time"
                  value={formData.startTime} 
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input 
                  type="time"
                  value={formData.endTime} 
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
          </>
        )}

        {category === 'status' && (
          <>
            <div>
              <Label>Status Name</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Under Review" 
              />
            </div>
            <div>
              <Label>Color</Label>
              <Input 
                type="color"
                value={formData.color} 
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
              />
              <Label>Default Status</Label>
            </div>
          </>
        )}

        {(category === 'skills' || category === 'emergency') && (
          <>
            <div>
              <Label>Name</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter name" 
              />
            </div>
            {category === 'skills' && (
              <div>
                <Label>Description (Optional)</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this skill" 
                />
              </div>
            )}
          </>
        )}

        <div>
          <Label>Display Order</Label>
          <Input 
            type="number"
            value={formData.displayOrder} 
            onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}