import { useState } from "react";
import { Calendar, FileText, Shield, Building2, Briefcase, Sparkles } from "lucide-react";
import { CompanySettings } from "./CompanySettings";
import { LeaveSettings } from "./LeaveSettings";
import { DocumentSettings } from "./DocumentSettings";
import { ComplianceSettings } from "./ComplianceSettings";
import { BranchSettings } from "./BranchSettings";
import { JobPositionSettings } from "./JobPositionSettings";
import { ApplicationSettings } from "./ApplicationSettings";
import { SettingsHero } from "./redesign/SettingsHero";
import { SettingsSidebar } from "./redesign/SettingsSidebar";

export function SettingsContent() {
  const [activeTab, setActiveTab] = useState("company");

  const renderContent = () => {
    switch (activeTab) {
      case "company":
        return <CompanySettings />;
      case "applications":
        return <ApplicationSettings />;
      case "branches":
        return <BranchSettings />;
      case "compliance":
        return <ComplianceSettings />;
      case "documents":
        return <DocumentSettings />;
      case "leave":
        return <LeaveSettings />;
      case "positions":
        return <JobPositionSettings />;
      default:
        return <CompanySettings />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <SettingsHero />

      {/* Main Content */}
      <div className="flex gap-6 px-8 pb-8">
        {/* Sidebar Navigation */}
        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="animate-fade-in">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
