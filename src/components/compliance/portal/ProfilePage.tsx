import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import InvestorOnboardingProgress from "./InvestorOnboardingProgress";
import { useAuth } from "@/hooks/auth";

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Investor Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your investor details, review your compliance status, and track your onboarding progress.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted rounded-lg p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding Progress</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
          <TabsTrigger value="settings">Profile Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Investor Profile Overview</CardTitle>
              <CardDescription>
                Key information about your investor profile and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                  <dd className="text-base">{user?.user_metadata?.name || "Not available"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                  <dd className="text-base">{user?.email || "Not available"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Account Status</dt>
                  <dd className="text-base">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Account Type</dt>
                  <dd className="text-base">Individual Investor</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding">
          <InvestorOnboardingProgress />
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
              <CardDescription>
                Review your compliance status and requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your compliance information is displayed in the Onboarding Progress tab.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your personal details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Profile settings functionality will be available soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage; 