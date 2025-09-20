
import { useState } from "react";
import { 
  Calendar, 
  FileText, 
  Shield, 
  Building2, 
  Briefcase, 
  Search, 
  Settings,
  Sparkles,
  Users,
  Clock,
  Flag,
  User,
  Phone,
  Award,
  MapPin
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompanySettings } from "./CompanySettings";
import { LeaveSettings } from "./LeaveSettings";
import { DocumentSettings } from "./DocumentSettings";
import { ComplianceSettings } from "./ComplianceSettings";
import { BranchSettings } from "./BranchSettings";
import { JobPositionSettings } from "./JobPositionSettings";
import { ModernApplicationSettings } from "./ModernApplicationSettings";

export function SettingsContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("company");

  const settingsTabs = [
    {
      id: "company",
      label: "Company",
      shortLabel: "Company",
      icon: Building2,
      color: "from-blue-500/10 to-blue-600/5",
      description: "Company information, branding, and basic settings",
      keywords: ["company", "logo", "name", "address", "contact", "branding"]
    },
    {
      id: "applications",
      label: "Job Applications",
      shortLabel: "Apps",
      icon: Briefcase,
      color: "from-purple-500/10 to-purple-600/5",
      description: "Job application forms, steps, and workflow configuration",
      keywords: ["application", "job", "form", "workflow", "steps", "status"]
    },
    {
      id: "branches",
      label: "Branches & Locations",
      shortLabel: "Branches",
      icon: MapPin,
      color: "from-green-500/10 to-green-600/5",
      description: "Manage office locations and branch information",
      keywords: ["branch", "location", "office", "site", "workplace"]
    },
    {
      id: "compliance",
      label: "Compliance & Training",
      shortLabel: "Compliance",
      icon: Shield,
      color: "from-red-500/10 to-red-600/5",
      description: "Training requirements, certifications, and compliance tracking",
      keywords: ["compliance", "training", "certificate", "requirement", "audit"]
    },
    {
      id: "documents",
      label: "Document Management",
      shortLabel: "Documents",
      icon: FileText,
      color: "from-orange-500/10 to-orange-600/5",
      description: "Document templates, storage, and management settings",
      keywords: ["document", "template", "file", "storage", "pdf", "upload"]
    },
    {
      id: "leave",
      label: "Leave & Time Off",
      shortLabel: "Leave",
      icon: Calendar,
      color: "from-teal-500/10 to-teal-600/5",
      description: "Holiday policies, leave types, and time-off management",
      keywords: ["leave", "holiday", "vacation", "time off", "absence", "pto"]
    }
  ];

  const filteredTabs = settingsTabs.filter(tab => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      tab.label.toLowerCase().includes(query) ||
      tab.description.toLowerCase().includes(query) ||
      tab.keywords.some(keyword => keyword.toLowerCase().includes(query))
    );
  });

  const quickActions = [
    { icon: Users, label: "Add Employee", action: () => {} },
    { icon: MapPin, label: "Add Branch", action: () => {} },
    { icon: FileText, label: "Upload Document", action: () => {} },
    { icon: Settings, label: "System Config", action: () => {} }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Modern Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 border-b border-border/50">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="relative px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                <Settings className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  System Settings
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                  Configure your HR platform and manage your organization
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            {/* Modern Tab Navigation */}
            <div className="flex items-center justify-between mb-8">
              <TabsList className="bg-background/50 backdrop-blur-sm border border-border/50 p-1 h-auto rounded-xl">
                {filteredTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-3 flex items-center gap-2 transition-all"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.shortLabel}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* Quick Actions */}
              <div className="hidden lg:flex items-center gap-2">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={action.action}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-background/50 hover:bg-background/80 border border-border/50 rounded-lg transition-all hover:shadow-sm"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            {filteredTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsContent key={tab.id} value={tab.id} className="space-y-6">
                  {/* Tab Header */}
                  <Card className="border-none shadow-sm bg-gradient-to-r from-background to-muted/10">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tab.color} flex items-center justify-center border`}>
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-bold">{tab.label}</h2>
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{tab.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tab Content */}
                  <div className="space-y-6">
                    {tab.id === "company" && <CompanySettings />}
                    {tab.id === "applications" && <ModernApplicationSettings />}
                    {tab.id === "branches" && <BranchSettings />}
                    {tab.id === "compliance" && <ComplianceSettings />}
                    {tab.id === "documents" && <DocumentSettings />}
                    {tab.id === "leave" && <LeaveSettings />}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
