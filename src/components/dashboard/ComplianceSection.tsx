import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  UserCheck,
  Shield,
  Globe,
  FileCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { getComplianceData, ComplianceData } from "@/services/dashboard/dashboardDataService";

interface ComplianceSectionProps {
  kycStatus?: "pending" | "completed" | "failed";
  accreditationSettings?: {
    requireAccreditation: boolean;
    minimumInvestment: number;
  };
  jurisdictions?: string[];
  investorCount?: number;
  organizationId?: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const ComplianceSection = ({
  kycStatus: initialKycStatus,
  accreditationSettings: initialAccreditationSettings,
  jurisdictions: initialJurisdictions,
  investorCount: initialInvestorCount,
  organizationId = "default-org",
}: ComplianceSectionProps) => {
  const [loading, setLoading] = useState(
    !initialKycStatus || !initialAccreditationSettings || !initialJurisdictions,
  );
  const [kycStatus, setKycStatus] = useState<
    "pending" | "completed" | "failed" | "not_started"
  >(initialKycStatus || "pending");
  const [accreditationSettings, setAccreditationSettings] = useState<{
    requireAccreditation: boolean;
    minimumInvestment: number;
  }>({
    requireAccreditation:
      initialAccreditationSettings?.requireAccreditation === undefined 
      ? true 
      : initialAccreditationSettings.requireAccreditation,
    minimumInvestment: initialAccreditationSettings?.minimumInvestment || 10000,
  });
  const [jurisdictions, setJurisdictions] = useState<string[]>(
    initialJurisdictions || ["United States", "Canada", "European Union"],
  );
  const [investorCount, setInvestorCount] = useState(
    initialInvestorCount || 12,
  );

  useEffect(() => {
    if (
      initialKycStatus &&
      initialAccreditationSettings &&
      initialJurisdictions &&
      initialInvestorCount
    ) {
      return;
    }

    const fetchComplianceData = async () => {
      setLoading(true);
      try {
        const data = await getComplianceData(organizationId);
        setKycStatus(data.kycStatus);
        setAccreditationSettings(data.accreditationSettings);
        setJurisdictions(data.jurisdictions);
        setInvestorCount(data.investorCount);
      } catch (error) {
        console.error("Error fetching compliance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplianceData();
  }, [
    organizationId,
    initialKycStatus,
    initialAccreditationSettings,
    initialJurisdictions,
    initialInvestorCount,
  ]);
  const [requireAccreditation, setRequireAccreditation] = useState<boolean>(
    accreditationSettings?.requireAccreditation ?? true,
  );
  const [minimumInvestment, setMinimumInvestment] = useState(
    accreditationSettings?.minimumInvestment ?? 10000,
  );
  const [selectedJurisdiction, setSelectedJurisdiction] =
    useState("United States");

  return (
    <div className="w-full h-full bg-white p-6 rounded-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Compliance Dashboard</h2>
        <p className="text-gray-500">
          Manage KYC/AML requirements and investor qualification settings
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading compliance data...</span>
        </div>
      ) : (
        <Tabs defaultValue="kyc" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="kyc" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              KYC/AML Status
            </TabsTrigger>
            <TabsTrigger
              value="accreditation"
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Investor Qualification
            </TabsTrigger>
            <TabsTrigger
              value="jurisdiction"
              className="flex items-center gap-2"
            >
              <Globe className="h-4 w-4" />
              Jurisdiction Rules
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kyc" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>KYC/AML Verification Status</CardTitle>
                <CardDescription>
                  Current status of Know Your Customer and Anti-Money Laundering
                  verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {kycStatus === "completed" ? (
                      <div className="p-2 bg-green-100 rounded-full">
                        <FileCheck className="h-6 w-6 text-green-600" />
                      </div>
                    ) : kycStatus === "failed" ? (
                      <div className="p-2 bg-red-100 rounded-full">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                    ) : (
                      <div className="p-2 bg-yellow-100 rounded-full">
                        <UserCheck className="h-6 w-6 text-yellow-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">
                        {kycStatus === "completed"
                          ? "KYC/AML Verification Complete"
                          : kycStatus === "failed"
                            ? "KYC/AML Verification Failed"
                            : "KYC/AML Verification Pending"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {kycStatus === "completed"
                          ? "All required verifications have been completed."
                          : kycStatus === "failed"
                            ? "There were issues with your verification. Please review and resubmit."
                            : "Your verification is being processed. This may take 1-3 business days."}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={kycStatus === "completed" ? "outline" : "default"}
                  >
                    {kycStatus === "completed"
                      ? "View Details"
                      : "Initiate KYC"}
                  </Button>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">
                    Investor Verification
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">Total Investors</p>
                      <span className="font-bold">{investorCount}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">Verified Investors</p>
                      <span className="font-bold">
                        {Math.floor(investorCount * 0.75)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-medium">Pending Verification</p>
                      <span className="font-bold">
                        {Math.ceil(investorCount * 0.25)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="mr-2">Invite Investors</Button>
                <Button variant="outline">Download Verification Report</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="accreditation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Investor Qualification Settings</CardTitle>
                <CardDescription>
                  Configure accreditation requirements for your investors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Require Accreditation</h3>
                    <p className="text-sm text-gray-500">
                      Investors must provide proof of accreditation status
                    </p>
                  </div>
                  <Switch
                    checked={requireAccreditation}
                    onCheckedChange={(checked) => {
                      const isChecked = checked === true;
                      setRequireAccreditation(isChecked);
                      setAccreditationSettings({
                        ...accreditationSettings,
                        requireAccreditation: isChecked
                      });
                    }}
                  />
                </div>

                <div>
                  <h3 className="font-medium mb-2">
                    Minimum Investment Amount
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">$</span>
                    <Input
                      type="number"
                      value={minimumInvestment}
                      onChange={(e) =>
                        setMinimumInvestment(Number(e.target.value))
                      }
                      className="max-w-xs"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Set the minimum investment threshold for participation
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">
                    Accreditation Documentation
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="income" defaultChecked />
                      <label htmlFor="income">Income Verification</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="networth" defaultChecked />
                      <label htmlFor="networth">Net Worth Verification</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="advisor" defaultChecked />
                      <label htmlFor="advisor">
                        Investment Advisor Certification
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="entity" />
                      <label htmlFor="entity">Entity Certification</label>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="jurisdiction" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Jurisdiction Rules</CardTitle>
                <CardDescription>
                  Configure offering rules based on investor jurisdictions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Allowed Jurisdictions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {jurisdictions.map((jurisdiction) => (
                      <div
                        key={jurisdiction}
                        className="flex items-center gap-2 p-2 border rounded-md"
                      >
                        <input
                          type="checkbox"
                          id={jurisdiction}
                          defaultChecked
                        />
                        <label htmlFor={jurisdiction}>{jurisdiction}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">
                    Configure Jurisdiction Rules
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="jurisdiction"
                        className="block text-sm font-medium mb-1"
                      >
                        Select Jurisdiction
                      </label>
                      <Select
                        value={selectedJurisdiction}
                        onValueChange={setSelectedJurisdiction}
                      >
                        <SelectTrigger className="w-full max-w-xs">
                          <SelectValue placeholder="Select jurisdiction" />
                        </SelectTrigger>
                        <SelectContent>
                          {jurisdictions.map((jurisdiction) => (
                            <SelectItem key={jurisdiction} value={jurisdiction}>
                              {jurisdiction}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">
                        {selectedJurisdiction} Requirements
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p>Holding Period</p>
                          <Select defaultValue="1year">
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="6months">6 Months</SelectItem>
                              <SelectItem value="1year">1 Year</SelectItem>
                              <SelectItem value="2years">2 Years</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between">
                          <p>Investor Limit</p>
                          <Input
                            type="number"
                            defaultValue="2000"
                            className="w-32"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <p>Require Local Entity</p>
                          <Switch
                            defaultChecked={
                              selectedJurisdiction === "European Union"
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="mr-2">Save Rules</Button>
                <Button variant="outline">Export Jurisdiction Report</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ComplianceSection;
