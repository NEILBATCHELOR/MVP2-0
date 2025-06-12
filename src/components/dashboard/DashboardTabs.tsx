import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { FileText, Wallet, Shield, Bell } from "lucide-react";
import DocumentSection from "./DocumentSection";
import WalletSection from "./WalletSection";
import ComplianceSection from "./ComplianceSection";
import NotificationSection from "./NotificationSection";

interface DashboardTabsProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const DashboardTabs = ({
  activeTab = "documents",
  onTabChange = () => {},
}: DashboardTabsProps) => {
  const [currentTab, setCurrentTab] = useState(activeTab);

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    onTabChange(value);
  };

  return (
    <div className="w-full bg-gray-50 rounded-lg p-4">
      <Tabs
        defaultValue={currentTab}
        value={currentTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger
            value="documents"
            className="flex items-center justify-center gap-2 py-3"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger
            value="wallets"
            className="flex items-center justify-center gap-2 py-3"
          >
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Wallet Management</span>
          </TabsTrigger>
          <TabsTrigger
            value="compliance"
            className="flex items-center justify-center gap-2 py-3"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Compliance</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center justify-center gap-2 py-3"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
        </TabsList>

        <div className="bg-white rounded-lg shadow-sm">
          <TabsContent value="documents" className="mt-0">
            <DocumentSection />
          </TabsContent>

          <TabsContent value="wallets" className="mt-0">
            <WalletSection />
          </TabsContent>

          <TabsContent value="compliance" className="mt-0">
            <ComplianceSection />
          </TabsContent>

          <TabsContent value="notifications" className="mt-0">
            <NotificationSection />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default DashboardTabs;
