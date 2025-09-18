import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Settings } from "lucide-react";
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

export function UnifiedJobApplicationSettings() {
  const [settings, setSettings] = useState<JobApplicationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('personal');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    category: 'personal',
    setting_type: '',
    setting_key: '',
    setting_value: {},
    display_order: 0,
    is_active: true
  });
  const { toast } = useToast();

  const categories = [
    { key: 'personal', label: 'Personal Info', description: 'Personal information settings' },
    { key: 'emergency', label: 'Emergency Contact', description: 'Emergency contact options' },
    { key: 'shift', label: 'Shifts', description: 'Available shift patterns' },
    { key: 'skills', label: 'Skills', description: 'Skills and categories' },
    { key: 'status', label: 'Status', description: 'Application status options' },
    { key: 'steps', label: 'Steps', description: 'Application step configuration' },
    { key: 'fields', label: 'Fields', description: 'Form field settings' },
    { key: 'reference', label: 'References', description: 'Reference requirements' },
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

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('job_application_settings')
        .upsert({
          id: editingId || undefined,
          ...formData,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: editingId ? "Setting updated successfully" : "Setting created successfully",
      });

      await fetchSettings();
      resetForm();
    } catch (error) {
      console.error('Error saving setting:', error);
      toast({
        title: "Error",
        description: "Failed to save setting",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('job_application_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Setting deleted successfully",
      });

      await fetchSettings();
    } catch (error) {
      console.error('Error deleting setting:', error);
      toast({
        title: "Error",
        description: "Failed to delete setting",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (setting: JobApplicationSetting) => {
    setEditingId(setting.id);
    setFormData({
      category: setting.category,
      setting_type: setting.setting_type || '',
      setting_key: setting.setting_key,
      setting_value: setting.setting_value,
      display_order: setting.display_order,
      is_active: setting.is_active
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({
      category: activeCategory,
      setting_type: '',
      setting_key: '',
      setting_value: {},
      display_order: 0,
      is_active: true
    });
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

  const getCategorySettings = (category: string) => {
    return settings.filter(s => s.category === category);
  };

  const renderSettingValue = (setting: JobApplicationSetting) => {
    const value = setting.setting_value;
    
    if (typeof value === 'object') {
      if (setting.category === 'shift') {
        return `${value.label} (${value.start_time} - ${value.end_time})`;
      } else if (setting.category === 'status') {
        return (
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: value.status_color }}
            />
            {value.status_label}
            {value.is_default && <Badge variant="secondary">Default</Badge>}
          </div>
        );
      } else if (setting.category === 'steps') {
        return `${value.display_name} (${value.is_enabled ? 'Enabled' : 'Disabled'})`;
      } else if (value.value) {
        return value.value;
      } else if (value.name) {
        return value.name;
      }
      return JSON.stringify(value);
    }
    
    return setting.setting_key;
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

          {categories.map((category) => (
            <TabsContent key={category.key} value={category.key} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{category.label}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
                <Button
                  onClick={() => {
                    setFormData({ ...formData, category: category.key });
                    setShowAddForm(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add {category.label}
                </Button>
              </div>

              {showAddForm && formData.category === category.key && (
                <Card className="border-dashed">
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="setting_key">Setting Key</Label>
                        <Input
                          id="setting_key"
                          value={formData.setting_key}
                          onChange={(e) => setFormData({ ...formData, setting_key: e.target.value })}
                          placeholder="Enter setting key"
                        />
                      </div>
                      <div>
                        <Label htmlFor="display_order">Display Order</Label>
                        <Input
                          id="display_order"
                          type="number"
                          value={formData.display_order}
                          onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="setting_value">Setting Value (JSON)</Label>
                      <Textarea
                        id="setting_value"
                        value={JSON.stringify(formData.setting_value, null, 2)}
                        onChange={(e) => {
                          try {
                            setFormData({ ...formData, setting_value: JSON.parse(e.target.value) });
                          } catch (error) {
                            // Invalid JSON, keep the raw value
                          }
                        }}
                        placeholder='{"key": "value"}'
                        rows={4}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label>Active</Label>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleSave}>
                        {editingId ? 'Update' : 'Create'}
                      </Button>
                      <Button variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getCategorySettings(category.key).map((setting) => (
                      <TableRow key={setting.id}>
                        <TableCell className="font-medium">{setting.setting_key}</TableCell>
                        <TableCell>{renderSettingValue(setting)}</TableCell>
                        <TableCell>{setting.display_order}</TableCell>
                        <TableCell>
                          <Switch
                            checked={setting.is_active}
                            onCheckedChange={() => toggleActive(setting.id, setting.is_active)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(setting)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(setting.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
