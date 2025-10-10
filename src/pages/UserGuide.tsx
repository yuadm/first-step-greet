import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, BookOpen } from "lucide-react";
import { generateUserGuidePDF } from "@/lib/user-guide-pdf";
import { toast } from "sonner";

export default function UserGuide() {
  const handleDownloadGuide = () => {
    try {
      toast.info("Generating user guide PDF...", {
        description: "This may take a moment. Please wait.",
      });

      const doc = generateUserGuidePDF();
      doc.save('HR-Management-System-User-Guide.pdf');
      
      toast.success("User guide downloaded successfully!", {
        description: "The PDF has been saved to your downloads folder.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate user guide", {
        description: "Please try again or contact support.",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          User Guide
        </h1>
        <p className="text-muted-foreground">
          Comprehensive step-by-step documentation for the HR Management System
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Complete User Guide
          </CardTitle>
          <CardDescription>
            Download the full user manual with detailed instructions for all features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">What's Included:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Complete system overview and navigation guide</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Step-by-step instructions for all modules (Employees, Leaves, Documents, Compliance, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>User roles and permissions explained in detail</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Best practices for data management and workflows</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Comprehensive troubleshooting section</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Quick reference guide and permission matrix</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Employee portal instructions</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                📚 150+ Page Comprehensive Manual
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                This guide covers everything from basic navigation to advanced features. 
                Perfect for new users and as a reference for experienced administrators.
              </p>
              <Button onClick={handleDownloadGuide} size="lg" className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Download Complete User Guide (PDF)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Chapter 2:</strong> Getting Started</p>
            <p><strong>Chapter 3:</strong> Employee Management</p>
            <p><strong>Chapter 5:</strong> Leave Management</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">For Administrators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Chapter 11:</strong> Settings & Configuration</p>
            <p><strong>Chapter 12:</strong> User Management</p>
            <p><strong>Chapter 14:</strong> Best Practices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">For Employees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Chapter 13:</strong> Employee Portal</p>
            <p>Self-service leave requests, document viewing, and more</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Chapter 15:</strong> Troubleshooting</p>
            <p><strong>Chapter 16:</strong> Quick Reference</p>
            <p>Common solutions and quick answers</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
        <CardHeader>
          <CardTitle className="text-orange-900 dark:text-orange-100">
            📝 Note About Screenshots
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-orange-800 dark:text-orange-200">
          <p>
            This guide includes detailed written instructions for every feature. 
            For visual references, please use the system itself alongside this guide. 
            The step-by-step instructions are designed to be followed directly in the application.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
