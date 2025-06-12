import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { 
  NotificationSettings,
  EmailPreferences,
  NotificationDemo 
} from "@/components/redemption/notifications";

interface NotificationSettingsPageProps {
  onBack: () => void;
}

const NotificationSettingsPage = ({
  onBack,
}: NotificationSettingsPageProps) => {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onBack} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Notification Settings</h1>
      </div>

      <Tabs defaultValue="general" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="email">Email Preferences</TabsTrigger>
          <TabsTrigger value="test">Test Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <EmailPreferences />
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">
              Test Notification System
            </h2>
            <p className="text-gray-600 mb-6">
              Use these buttons to test different types of notifications. This
              will help you understand how notifications appear in the system.
            </p>
            <NotificationDemo />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationSettingsPage;
