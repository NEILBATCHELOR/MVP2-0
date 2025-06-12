import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, BarChart, TrendingUp, Download, Plus } from "lucide-react";

interface Investor {
  id: string;
  name: string;
  securityType: string;
  subscriptionAmount: number;
  conversionCap?: number;
  conversionDiscount?: number;
  interestRate?: number;
  maturityDate?: string;
  investmentDate?: string;
  liquidationPreference?: number;
  participationMultiple?: number;
  converted?: boolean;
  ownershipPercentage?: number;
  originalSecurityType?: string;
  participationAmount?: number;
  preferenceAmount?: number;
  commonDistribution?: number;
  tokenAllocation?: number;
}

interface WaterfallModelProps {
  investors?: Investor[];
  totalInvestment?: number;
  companyValuation?: number;
}

const WaterfallModel = ({
  investors = [],
  totalInvestment = 0,
  companyValuation = 0,
}: WaterfallModelProps) => {
  const [exitValue, setExitValue] = useState("10000000");
  const [selectedScenario, setSelectedScenario] = useState("moderate");
  const [activeTab, setActiveTab] = useState("distribution");

  // Calculate distribution based on exit value and investor terms
  const calculateDistribution = () => {
    const exitValueNum = parseFloat(exitValue);
    if (isNaN(exitValueNum) || exitValueNum <= 0) return [];

    // First, calculate the total amount to be distributed to preference holders
    let preferencePool = 0;
    let remainingExitValue = exitValueNum;

    // Step 1: Calculate liquidation preferences
    const investorsWithPreferences = investors.filter(
      (investor) =>
        (investor.securityType === "equity" &&
          investor.liquidationPreference) ||
        investor.securityType === "convertible_note" ||
        investor.securityType === "safe",
    );

    // Calculate preference amounts
    const investorsWithPreferenceAmounts = investorsWithPreferences.map(
      (investor) => {
        let preferenceAmount = 0;

        if (
          investor.securityType === "equity" &&
          investor.liquidationPreference
        ) {
          // For preferred equity, apply the liquidation preference multiple
          preferenceAmount =
            investor.subscriptionAmount * (investor.liquidationPreference || 1);
        } else if (
          investor.securityType === "convertible_note" ||
          investor.securityType === "safe"
        ) {
          // For convertible securities, apply the conversion cap and discount
          const conversionCap = investor.conversionCap || exitValueNum;
          const discountFactor = investor.conversionDiscount
            ? (100 - investor.conversionDiscount) / 100
            : 1;

          // Use the more favorable of cap or discount for conversion
          const effectiveValuation = Math.min(
            conversionCap,
            exitValueNum * discountFactor,
          );

          // Calculate ownership based on effective valuation
          const ownershipPercentage =
            investor.subscriptionAmount / effectiveValuation;

          // For convertible notes, also add interest if applicable
          if (
            investor.securityType === "convertible_note" &&
            investor.interestRate
          ) {
            const maturityDate = investor.maturityDate
              ? new Date(investor.maturityDate)
              : new Date();
            const investmentDate = new Date(investor.investmentDate);
            const yearsElapsed =
              (maturityDate.getTime() - investmentDate.getTime()) /
              (1000 * 60 * 60 * 24 * 365);
            const interest =
              investor.subscriptionAmount *
              (investor.interestRate / 100) *
              Math.min(yearsElapsed, 1);
            preferenceAmount = investor.subscriptionAmount + interest;
          } else {
            preferenceAmount = investor.subscriptionAmount;
          }

          // Compare conversion value with preference amount
          const conversionValue = exitValueNum * ownershipPercentage;
          if (conversionValue > preferenceAmount) {
            // Convert to equity if it's more favorable
            preferenceAmount = 0; // Will be handled in equity distribution
            investor.converted = true;
            investor.ownershipPercentage = ownershipPercentage;
          }
        }

        return {
          ...investor,
          preferenceAmount,
          converted: investor.converted || false,
        };
      },
    );

    // Calculate total preference pool
    preferencePool = investorsWithPreferenceAmounts.reduce(
      (sum, inv) => sum + inv.preferenceAmount,
      0,
    );

    // Adjust if preference pool exceeds exit value
    if (preferencePool > exitValueNum) {
      // Pro-rata reduction of preferences
      const reductionFactor = exitValueNum / preferencePool;
      investorsWithPreferenceAmounts.forEach((inv) => {
        inv.preferenceAmount *= reductionFactor;
      });
      preferencePool = exitValueNum;
    }

    // Remaining value for equity distribution
    remainingExitValue = exitValueNum - preferencePool;

    // Step 2: Calculate participation rights for preferred equity
    let participationPool = 0;
    if (remainingExitValue > 0) {
      const participatingInvestors = investorsWithPreferenceAmounts.filter(
        (inv) => inv.securityType === "equity" && inv.participationMultiple,
      );

      participatingInvestors.forEach((inv) => {
        // Calculate participation amount based on ownership percentage and participation cap
        const baseOwnership = inv.subscriptionAmount / totalInvestment;
        const maxParticipation =
          inv.subscriptionAmount * (inv.participationMultiple || 0);
        const participationAmount = Math.min(
          baseOwnership * remainingExitValue,
          maxParticipation,
        );

        inv.participationAmount = participationAmount;
        participationPool += participationAmount;
      });

      // Adjust if participation exceeds remaining value
      if (participationPool > remainingExitValue) {
        const reductionFactor = remainingExitValue / participationPool;
        participatingInvestors.forEach((inv) => {
          inv.participationAmount *= reductionFactor;
        });
        participationPool = remainingExitValue;
      }
    }

    // Final remaining value for common equity
    remainingExitValue -= participationPool;

    // Step 3: Distribute remaining value to common equity and converted securities
    const commonInvestors = [
      ...investors.filter(
        (inv) => inv.securityType === "equity" && !inv.liquidationPreference,
      ),
      ...investorsWithPreferenceAmounts.filter((inv) => inv.converted),
    ];

    const totalCommonOwnership = commonInvestors.reduce(
      (sum, inv) =>
        sum +
        (inv.ownershipPercentage || inv.subscriptionAmount / totalInvestment),
      0,
    );

    // Normalize ownership percentages
    if (totalCommonOwnership > 0) {
      commonInvestors.forEach((inv) => {
        const normalizedOwnership =
          (inv.ownershipPercentage ||
            inv.subscriptionAmount / totalInvestment) / totalCommonOwnership;
        inv.commonDistribution = normalizedOwnership * remainingExitValue;
      });
    }

    // Step 4: Combine all distributions for final result
    return investors.map((investor) => {
      // Find this investor in our calculated arrays
      const withPreference = investorsWithPreferenceAmounts.find(
        (inv) => inv.id === investor.id,
      );
      const asCommon = commonInvestors.find((inv) => inv.id === investor.id);

      let totalReturn = 0;

      // Add preference amount if applicable
      if (withPreference && !withPreference.converted) {
        totalReturn += withPreference.preferenceAmount || 0;
        // Add participation if applicable
        if (withPreference.participationAmount) {
          totalReturn += withPreference.participationAmount;
        }
      }

      // Add common equity distribution if applicable
      if (asCommon) {
        totalReturn += asCommon.commonDistribution || 0;
      }

      // For token securities, calculate based on token allocation
      if (investor.securityType === "token" && investor.tokenAllocation) {
        // Calculate total token allocation
        const totalTokenAllocation = investors.reduce(
          (sum, inv) => sum + (inv.tokenAllocation || 0),
          0
        );
        
        // Distribute based on proportion of tokens
        totalReturn = totalTokenAllocation > 0 
          ? (investor.tokenAllocation / totalTokenAllocation) * exitValueNum
          : 0;
      }

      return {
        ...investor,
        return: totalReturn,
        multiple: totalReturn / investor.subscriptionAmount,
        percentOfExit: (totalReturn / exitValueNum) * 100,
      };
    });
  };

  const distribution = calculateDistribution();
  const totalReturn = distribution.reduce((sum, inv) => sum + inv.return, 0);

  // Predefined scenarios
  const scenarios = {
    conservative: "5000000",
    moderate: "10000000",
    optimistic: "25000000",
    homerun: "50000000",
  };

  const handleScenarioChange = (value: string) => {
    setSelectedScenario(value);
    setExitValue(scenarios[value as keyof typeof scenarios]);
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle>Waterfall Model</CardTitle>
        <CardDescription>
          Visualize how proceeds would be distributed in different exit
          scenarios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="exitValue">Exit Value ($)</Label>
            <Input
              id="exitValue"
              value={exitValue}
              onChange={(e) => setExitValue(e.target.value)}
              placeholder="Enter exit value"
              type="text"
              inputMode="numeric"
            />
          </div>
          <div className="space-y-2">
            <Label>Scenario</Label>
            <Select
              value={selectedScenario}
              onValueChange={handleScenarioChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select scenario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">Conservative ($5M)</SelectItem>
                <SelectItem value="moderate">Moderate ($10M)</SelectItem>
                <SelectItem value="optimistic">Optimistic ($25M)</SelectItem>
                <SelectItem value="homerun">Home Run ($50M)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full">
              <TrendingUp className="mr-2 h-4 w-4" />
              Calculate Returns
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="distribution">
              <BarChart className="mr-2 h-4 w-4" />
              Distribution Table
            </TabsTrigger>
            <TabsTrigger value="chart">
              <PieChart className="mr-2 h-4 w-4" />
              Distribution Chart
            </TabsTrigger>
          </TabsList>

          <TabsContent value="distribution" className="space-y-4">
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">
                        Investor
                      </th>
                      <th className="h-10 px-4 text-left font-medium">
                        Security Type
                      </th>
                      <th className="h-10 px-4 text-right font-medium">
                        Investment
                      </th>
                      <th className="h-10 px-4 text-right font-medium">
                        Return
                      </th>
                      <th className="h-10 px-4 text-right font-medium">
                        Multiple
                      </th>
                      <th className="h-10 px-4 text-right font-medium">
                        % of Exit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {distribution.map((item, index) => (
                      <tr
                        key={item.id}
                        className={index % 2 === 0 ? "bg-white" : "bg-muted/20"}
                      >
                        <td className="p-4">{item.name}</td>
                        <td className="p-4 capitalize">
                          {item.securityType.replace("_", " ")}
                        </td>
                        <td className="p-4 text-right">
                          ${item.subscriptionAmount.toLocaleString()}
                        </td>
                        <td className="p-4 text-right">
                          ${Math.round(item.return).toLocaleString()}
                        </td>
                        <td className="p-4 text-right">
                          {item.multiple.toFixed(2)}x
                        </td>
                        <td className="p-4 text-right">
                          {(
                            (item.return / parseFloat(exitValue)) *
                            100
                          ).toFixed(2)}
                          %
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t bg-muted/50 font-medium">
                      <td className="p-4" colSpan={2}>
                        Total
                      </td>
                      <td className="p-4 text-right">
                        ${totalInvestment.toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        ${Math.round(totalReturn).toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        {(totalReturn / totalInvestment).toFixed(2)}x
                      </td>
                      <td className="p-4 text-right">
                        {((totalReturn / parseFloat(exitValue)) * 100).toFixed(
                          2,
                        )}
                        %
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span>Export Results</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent
            value="chart"
            className="h-[400px] flex items-center justify-center"
          >
            <div className="text-center">
              <PieChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Chart Visualization</h3>
              <p className="text-sm text-muted-foreground max-w-md mt-2 mb-4">
                In a complete implementation, this would display a pie chart
                showing the distribution of proceeds among investors.
              </p>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Chart
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WaterfallModel;
