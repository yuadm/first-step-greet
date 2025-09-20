import { useState, useEffect } from "react";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Eye, 
  EyeOff, 
  Clock, 
  Flag, 
  User, 
  Phone, 
  Award, 
  FileText, 
  Settings,
  ChevronDown,
  ChevronRight,
  Sparkles,
  CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

export function ModernApplicationSettings() {
  const [settings, setSettings] = useState<JobApplicationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<JobApplicationSetting | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['personal']));
  const { toast } = useToast();

  const categories = [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Title, nationality, gender, and personal details',
      icon: User,
      color: 'from-blue-500/10 to-blue-600/5 border-blue-200/50',
      addLabel: 'Add Personal Option'
    },
    {
      id: 'emergency',
      title: 'Emergency Contacts',
      description: 'Emergency contact relationships and types',
      icon: Phone,
      color: 'from-red-500/10 to-red-600/5 border-red-200/50',
      addLabel: 'Add Contact Option'
    },
    {
      id: 'shift',
      title: 'Work Shifts',
      description: 'Available shift patterns and schedules',
      icon: Clock,
      color: 'from-green-500/10 to-green-600/5 border-green-200/50',
      addLabel: 'Add Shift Pattern'
    },
    {
      id: 'skills',
      title: 'Skills & Categories',
      description: 'Skill categories and individual skills',
      icon: Award,
      color: 'from-purple-500/10 to-purple-600/5 border-purple-200/50',
      addLabel: 'Add Skill/Category'
    },
    {
      id: 'status',
      title: 'Application Status',
      description: 'Status options for job applications',
      icon: Flag,
      color: 'from-orange-500/10 to-orange-600/5 border-orange-200/50',
      addLabel: 'Add Status Option'
    },
    {
      id: 'fields',
      title: 'Form Fields',
      description: 'Custom form field configurations',
      icon: FileText,
      color: 'from-teal-500/10 to-teal-600/5 border-teal-200/50',
      addLabel: 'Add Form Field'
    }
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
        .order('category')
        .order('display_order');

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

  const getCategorySettings = (categoryId: string) => {
    return settings.filter(s => s.category === categoryId);
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAddNew = (categoryId: string) => {
    setActiveCategory(categoryId);
    setEditingItem(null);
    setShowAddForm(true);
  };

  const handleEdit = (item: JobApplicationSetting) => {
    setActiveCategory(item.category);
    setEditingItem(item);
    setShowAddForm(true);
  };

  const handleDelete = async (item: JobApplicationSetting) => {
    try {
      const { error } = await supabase
        .from('job_application_settings')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item deleted successfully",
      });

      await fetchSettings();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (item: JobApplicationSetting) => {
    try {
      const { error } = await supabase
        .from('job_application_settings')
        .update({ is_active: !item.is_active })
        .eq('id', item.id);

      if (error) throw error;

      await fetchSettings();
      toast({
        title: "Success",
        description: `Item ${!item.is_active ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    }
  };

  const renderSettingValue = (setting: JobApplicationSetting) => {
    const value = setting.setting_value;
    
    if (typeof value === 'object') {
      if (setting.category === 'shift') {
        return `${value.label || value.name} (${value.start_time} - ${value.end_time})`;
      } else if (setting.category === 'status') {
        return (
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full border" 
              style={{ backgroundColor: value.status_color || '#64748b' }}
            />
            <span>{value.status_label || value.name}</span>
            {value.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
          </div>
        );
      } else if (value.value) {
        return value.value;
      } else if (value.name) {
        return value.name;
      }
      return setting.setting_key;
    }
    
    return setting.setting_key;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading application settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border-none shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{settings.length}</div>
            <div className="text-sm text-muted-foreground">Total Settings</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-green-500/5 to-green-600/10">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{settings.filter(s => s.is_active).length}</div>
            <div className="text-sm text-muted-foreground">Active Settings</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-orange-500/5 to-orange-600/10">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{categories.length}</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {categories.map((category) => {
          const Icon = category.icon;
          const categorySettings = getCategorySettings(category.id);
          const isExpanded = expandedCategories.has(category.id);
          const activeCount = categorySettings.filter(s => s.is_active).length;
          
          return (
            <Card key={category.id} className="border-none shadow-sm overflow-hidden">
              <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category.id)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center border`}>
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-lg">{category.title}</CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {categorySettings.length} items
                            </Badge>
                            {activeCount > 0 && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                {activeCount} active
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddNew(category.id);
                          }}
                          className="hover-scale"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 pb-6">
                    {categorySettings.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                        <Icon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="font-medium text-lg mb-2">No {category.title} Settings</h3>
                        <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                          Start by adding your first {category.title.toLowerCase()} setting to configure your application forms.
                        </p>
                        <Button
                          onClick={() => handleAddNew(category.id)}
                          variant="outline"
                          className="gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          {category.addLabel}
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {categorySettings.map((setting) => (
                          <div
                            key={setting.id}
                            className={`p-4 rounded-lg border transition-all hover:shadow-sm ${
                              setting.is_active 
                                ? 'bg-background border-border/50' 
                                : 'bg-muted/30 border-muted opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-medium truncate">{setting.setting_key}</h4>
                                  <div className="flex items-center gap-2">
                                    <Badge 
                                      variant={setting.is_active ? "default" : "secondary"} 
                                      className="text-xs"
                                    >
                                      {setting.is_active ? (
                                        <>
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Active
                                        </>
                                      ) : (
                                        <>
                                          <EyeOff className="w-3 h-3 mr-1" />
                                          Inactive
                                        </>
                                      )}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      #{setting.display_order}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {renderSettingValue(setting)}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleActive(setting)}
                                  className="h-8 w-8 p-0"
                                >
                                  {setting.is_active ? (
                                    <Eye className="w-4 h-4" />
                                  ) : (
                                    <EyeOff className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(setting)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(setting)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {editingItem ? 'Edit Setting' : 'Add New Setting'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {editingItem ? 'Update the setting details below' : 'Configure a new application setting'}
              </p>
            </div>

            {activeCategory && (
              <SimpleSettingForm
                category={activeCategory}
                editingItem={editingItem}
                onSave={() => {
                  fetchSettings();
                  setShowAddForm(false);
                  setEditingItem(null);
                  setActiveCategory(null);
                }}
                onCancel={() => {
                  setShowAddForm(false);
                  setEditingItem(null);
                  setActiveCategory(null);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Simplified form component
function SimpleSettingForm({ 
  category, 
  editingItem, 
  onSave, 
  onCancel 
}: {
  category: string;
  editingItem: JobApplicationSetting | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    setting_key: editingItem?.setting_key || '',
    setting_value: editingItem?.setting_value || {},
    display_order: editingItem?.display_order || 0,
    is_active: editingItem?.is_active ?? true,
    setting_type: editingItem?.setting_type || ''
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!formData.setting_key.trim()) {
      toast({
        title: "Validation Error",
        description: "Setting key is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('job_application_settings')
        .upsert({
          id: editingItem?.id || undefined,
          category,
          ...formData,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: editingItem ? "Setting updated successfully" : "Setting created successfully",
      });

      onSave();
    } catch (error) {
      console.error('Error saving setting:', error);
      toast({
        title: "Error",
        description: "Failed to save setting",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderCategorySpecificFields = () => {
    switch (category) {
      case 'shift':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.setting_value.start_time || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    setting_value: { ...formData.setting_value, start_time: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formData.setting_value.end_time || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    setting_value: { ...formData.setting_value, end_time: e.target.value }
                  })}
                />
              </div>
            </div>
            <div>
              <Label>Display Label</Label>
              <Input
                value={formData.setting_value.label || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  setting_value: { ...formData.setting_value, label: e.target.value }
                })}
                placeholder="e.g., Morning (7:00 AM - 3:00 PM)"
              />
            </div>
          </>
        );
      
      case 'status':
        return (
          <>
            <div>
              <Label>Status Label</Label>
              <Input
                value={formData.setting_value.status_label || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  setting_value: { ...formData.setting_value, status_label: e.target.value }
                })}
                placeholder="e.g., Under Review"
              />
            </div>
            <div>
              <Label>Status Color</Label>
              <Input
                type="color"
                value={formData.setting_value.status_color || '#64748b'}
                onChange={(e) => setFormData({
                  ...formData,
                  setting_value: { ...formData.setting_value, status_color: e.target.value }
                })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.setting_value.is_default || false}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  setting_value: { ...formData.setting_value, is_default: checked }
                })}
              />
              <Label>Default Status</Label>
            </div>
          </>
        );
      
      default:
        return (
          <div>
            <Label>Value</Label>
            <Input
              value={formData.setting_value.value || ''}
              onChange={(e) => setFormData({
                ...formData,
                setting_value: { ...formData.setting_value, value: e.target.value }
              })}
              placeholder="Enter the option value"
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Setting Key *</Label>
          <Input
            value={formData.setting_key}
            onChange={(e) => setFormData({ ...formData, setting_key: e.target.value })}
            placeholder="Enter setting key"
          />
        </div>
        <div>
          <Label>Display Order</Label>
          <Input
            type="number"
            min="0"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      {renderCategorySpecificFields()}

      <div className="flex items-center gap-2">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label>Active</Label>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
          <Save className="w-4 h-4 mr-2" />
          {editingItem ? 'Update Setting' : 'Create Setting'}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={saving} className="flex-1">
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
}