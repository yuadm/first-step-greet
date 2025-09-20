import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Trash2, Edit, Plus, Settings, Clock, Flag, User, Phone, Award, FileText, Search, Filter, BarChart3, TrendingUp, Eye, EyeOff } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(true);
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
      gradient: 'from-blue-500 via-blue-600 to-cyan-600',
      iconBg: 'bg-blue-500/10',
      borderColor: 'border-blue-200/50'
    },
    { 
      key: 'emergency', 
      label: 'Emergency Contact', 
      description: 'Emergency contact options',
      icon: Phone,
      gradient: 'from-red-500 via-red-600 to-pink-600',
      iconBg: 'bg-red-500/10',
      borderColor: 'border-red-200/50'
    },
    { 
      key: 'shift', 
      label: 'Shifts', 
      description: 'Available shift patterns',
      icon: Clock,
      gradient: 'from-green-500 via-green-600 to-emerald-600',
      iconBg: 'bg-green-500/10',
      borderColor: 'border-green-200/50'
    },
    { 
      key: 'skills', 
      label: 'Skills', 
      description: 'Skills and categories',
      icon: Award,
      gradient: 'from-purple-500 via-purple-600 to-violet-600',
      iconBg: 'bg-purple-500/10',
      borderColor: 'border-purple-200/50'
    },
    { 
      key: 'status', 
      label: 'Status', 
      description: 'Application status options',
      icon: Flag,
      gradient: 'from-orange-500 via-orange-600 to-amber-600',
      iconBg: 'bg-orange-500/10',
      borderColor: 'border-orange-200/50'
    },
    { 
      key: 'steps', 
      label: 'Steps', 
      description: 'Application step configuration',
      icon: Settings,
      gradient: 'from-gray-500 via-gray-600 to-slate-600',
      iconBg: 'bg-gray-500/10',
      borderColor: 'border-gray-200/50'
    },
    { 
      key: 'fields', 
      label: 'Fields', 
      description: 'Form field settings',
      icon: FileText,
      gradient: 'from-teal-500 via-teal-600 to-cyan-600',
      iconBg: 'bg-teal-500/10',
      borderColor: 'border-teal-200/50'
    },
    { 
      key: 'reference', 
      label: 'References', 
      description: 'Reference requirements',
      icon: FileText,
      gradient: 'from-indigo-500 via-indigo-600 to-blue-600',
      iconBg: 'bg-indigo-500/10',
      borderColor: 'border-indigo-200/50'
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
    let categorySettings = settings.filter(s => s.category === category);
    
    if (searchTerm) {
      categorySettings = categorySettings.filter(s => 
        s.setting_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(s.setting_value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (!showInactive) {
      categorySettings = categorySettings.filter(s => s.is_active);
    }
    
    return categorySettings;
  };

  const getCategoryStats = (category: string) => {
    const categorySettings = settings.filter(s => s.category === category);
    const activeCount = categorySettings.filter(s => s.is_active).length;
    const totalCount = categorySettings.length;
    const activePercentage = totalCount > 0 ? (activeCount / totalCount) * 100 : 0;
    
    return { activeCount, totalCount, activePercentage };
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
              className="w-3 h-3 rounded-full shadow-sm" 
              style={{ backgroundColor: value.status_color }}
            />
            <span className="font-medium">{value.status_label}</span>
            {value.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
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
    return (
      <div className="flex justify-center items-center p-16">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading application settings...</p>
        </div>
      </div>
    );
  }

  const getCurrentCategory = () => categories.find(cat => cat.key === activeCategory);
  const currentCategory = getCurrentCategory();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl"></div>
        <Card className="relative border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Job Application Settings
                  </CardTitle>
                  <p className="text-muted-foreground text-lg mt-1">
                    Configure and manage all aspects of your job application system
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {settings.length} Total Settings
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  {settings.filter(s => s.is_active).length} Active
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Controls Section */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search settings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
                <Label className="text-sm font-medium flex items-center gap-2">
                  {showInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  Show Inactive
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-6">
        {/* Enhanced Tab Navigation */}
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto p-1 bg-muted/50">
            {categories.map((category) => {
              const Icon = category.icon;
              const stats = getCategoryStats(category.key);
              
              return (
                <TabsTrigger 
                  key={category.key} 
                  value={category.key}
                  className="flex flex-col items-center gap-2 h-20 p-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200"
                >
                  <div className={`w-8 h-8 rounded-lg ${category.iconBg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{category.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {stats.activeCount}/{stats.totalCount}
                    </div>
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Tab Content */}
        {categories.map((category) => {
          const Icon = category.icon;
          const categorySettings = getCategorySettings(category.key);
          const stats = getCategoryStats(category.key);
          
          return (
            <TabsContent key={category.key} value={category.key} className="space-y-6">
              {/* Category Header */}
              <Card className={`border-2 ${category.borderColor} bg-gradient-to-br from-background to-${category.key}-50/5`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-2xl font-bold">{category.label}</h3>
                          <p className="text-muted-foreground">{category.description}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Active Settings</span>
                            <Progress value={stats.activePercentage} className="w-24 h-2" />
                            <span className="text-sm text-muted-foreground">
                              {stats.activeCount}/{stats.totalCount}
                            </span>
                          </div>
                        </div>
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
                      className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                    >
                      <Plus className="w-4 h-4" />
                      Add {category.label}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Add Form */}
              {showAddForm && formData.category === category.key && (
                <div className="animate-slide-in">
                  <FormRenderer
                    category={category.key}
                    formData={formData}
                    onFormDataChange={setFormData}
                    onSave={handleSave}
                    onCancel={resetForm}
                    isEditing={!!editingId}
                    existingSettings={settings}
                  />
                </div>
              )}

              {/* Settings Grid */}
              <div className="space-y-4">
                {categorySettings.length === 0 ? (
                  <Card className="p-12 text-center border-dashed border-2 border-muted-foreground/20 bg-gradient-to-br from-muted/20 to-muted/5">
                    <div className="space-y-4">
                      <div className={`w-20 h-20 rounded-full ${category.iconBg} flex items-center justify-center mx-auto`}>
                        <Icon className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-xl mb-2">No {category.label} Settings</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          {searchTerm 
                            ? `No settings found matching "${searchTerm}"`
                            : `Start by adding your first ${category.label.toLowerCase()} setting to configure this section.`
                          }
                        </p>
                        {!searchTerm && (
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
                            className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add {category.label}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {categorySettings.map((setting, index) => (
                      <Card 
                        key={setting.id} 
                        className={`group transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                          setting.is_active 
                            ? 'border-primary/20 bg-gradient-to-r from-background to-primary/5' 
                            : 'border-muted opacity-60 bg-muted/20'
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-3">
                                <h4 className="font-semibold text-lg">{setting.setting_key}</h4>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={setting.is_active ? "default" : "secondary"} 
                                    className={`text-xs ${setting.is_active ? 'bg-green-500/10 text-green-700 border-green-200' : ''}`}
                                  >
                                    {setting.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    Order #{setting.display_order}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                {renderSettingValue(setting)}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 ml-6">
                              <Switch
                                checked={setting.is_active}
                                onCheckedChange={() => toggleActive(setting.id, setting.is_active)}
                                className="data-[state=checked]:bg-green-600"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(setting)}
                                className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(setting.id)}
                                className="hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}