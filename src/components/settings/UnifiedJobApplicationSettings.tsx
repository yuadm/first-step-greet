import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Settings, Clock, Flag, User, Phone, Award, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FormRenderer } from './forms/FormRenderer';

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
    { 
      key: 'personal', 
      label: 'Personal Info', 
      description: 'Personal information settings',
      icon: User,
      color: 'from-blue-500/10 to-blue-600/5 border-blue-200/50'
    },
    { 
      key: 'emergency', 
      label: 'Emergency Contact', 
      description: 'Emergency contact options',
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
      label: 'Status', 
      description: 'Application status options',
      icon: Flag,
      color: 'from-orange-500/10 to-orange-600/5 border-orange-200/50'
    },
    { 
      key: 'steps', 
      label: 'Steps', 
      description: 'Application step configuration',
      icon: Settings,
      color: 'from-gray-500/10 to-gray-600/5 border-gray-200/50'
    },
    { 
      key: 'fields', 
      label: 'Fields', 
      description: 'Form field settings',
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
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline">{value.label || value.name}</Badge>
            <span className="text-sm text-muted-foreground">
              {value.start_time} - {value.end_time}
            </span>
          </div>
        );
      } else if (setting.category === 'status') {
        return (
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full border" 
              style={{ backgroundColor: value.status_color || '#6b7280' }}
            />
            <span className="font-medium">{value.status_label || value.status_name}</span>
            {value.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
          </div>
        );
      } else if (setting.category === 'steps') {
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{value.display_name || value.step_name}</span>
            <Badge variant={value.is_enabled ? "default" : "secondary"} className="text-xs">
              {value.is_enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        );
      } else if (setting.category === 'personal') {
        const settingTypeLabels = {
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
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {settingTypeLabels[setting.setting_type] || setting.setting_type}
            </Badge>
            <span className="font-medium">{value.value || value.name}</span>
          </div>
        );
      } else if (setting.category === 'emergency') {
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Emergency Contact</Badge>
            <span className="font-medium">{value.value || value.name}</span>
          </div>
        );
      } else if (setting.category === 'skills') {
        const isCategory = setting.setting_type === 'category';
        return (
          <div className="flex items-center gap-2">
            <Badge variant={isCategory ? "default" : "outline"} className="text-xs">
              {isCategory ? 'Category' : 'Skill'}
            </Badge>
            <span className="font-medium">{value.name}</span>
            {value.description && (
              <span className="text-xs text-muted-foreground">- {value.description}</span>
            )}
          </div>
        );
      } else if (setting.category === 'fields') {
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{value.step_name}</Badge>
            <span className="font-medium">{value.field_label || value.field_name}</span>
            {value.is_required && <Badge variant="secondary" className="text-xs">Required</Badge>}
          </div>
        );
      } else if (setting.category === 'reference') {
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Reference</Badge>
            <span className="font-medium">{JSON.stringify(value)}</span>
          </div>
        );
      }
      
      // Fallback for any other complex objects
      if (value.name) return value.name;
      if (value.value) return value.value;
      if (value.label) return value.label;
      return JSON.stringify(value);
    }
    
    return setting.setting_key;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading settings...</div>;
  }

  const getCurrentCategory = () => categories.find(cat => cat.key === activeCategory);

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
                  <Button
                    onClick={() => {
                      setFormData({ 
                        category: category.key,
                        setting_type: '',
                        setting_key: '',
                        setting_value: {},
                        display_order: 0,
                        is_active: true
                      });
                      setShowAddForm(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add {category.label}
                  </Button>
                </div>

                {showAddForm && formData.category === category.key && (
                  <FormRenderer
                    category={category.key}
                    formData={formData}
                    onFormDataChange={setFormData}
                    onSave={handleSave}
                    onCancel={resetForm}
                    isEditing={!!editingId}
                    existingSettings={settings}
                  />
                )}

                <div className="grid gap-4">
                  {categorySettings.length === 0 ? (
                    <Card className="p-8 text-center border-dashed">
                      <Icon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-medium text-lg mb-2">No {category.label} Settings</h3>
                      <p className="text-muted-foreground mb-4">
                        Start by adding your first {category.label.toLowerCase()} setting.
                      </p>
                      <Button
                        onClick={() => {
                          setFormData({ 
                            category: category.key,
                            setting_type: '',
                            setting_key: '',
                            setting_value: {},
                            display_order: 0,
                            is_active: true
                          });
                          setShowAddForm(true);
                        }}
                        variant="outline"
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add {category.label}
                      </Button>
                    </Card>
                  ) : (
                    categorySettings.map((setting) => (
                      <Card key={setting.id} className={`p-4 transition-all hover:shadow-md ${setting.is_active ? 'border-primary/20' : 'border-muted opacity-60'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium">{setting.setting_key}</h4>
                              <Badge variant={setting.is_active ? "default" : "secondary"} className="text-xs">
                                {setting.is_active ? "Active" : "Inactive"}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                #{setting.display_order}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {renderSettingValue(setting)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={setting.is_active}
                              onCheckedChange={() => toggleActive(setting.id, setting.is_active)}
                            />
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