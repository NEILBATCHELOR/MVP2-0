import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Plus,
  Save,
  Download,
  Trash2,
  Edit,
  Copy,
  BarChart,
} from "lucide-react";

interface Investor {
  id: string;
  name: string;
  securityType: string;
  subscriptionAmount: number;
  ownershipPercentage: number;
  investmentDate?: string;
  conversionCap?: number;
  conversionDiscount?: number;
  interestRate?: number;
  maturityDate?: string;
  liquidationPreference?: number;
  participationMultiple?: number;
  converted?: boolean;
  conversionRound?: string;
  originalSecurityType?: string;
  tokenAllocation?: number;
  participationAmount?: number;
  preferenceAmount?: number;
  commonDistribution?: number;
}

interface Round {
  id: string;
  name: string;
  preMoneyValuation: number;
  amount: number;
  newInvestors: Investor[];
}

interface ScenarioPlannerProps {
  currentInvestors?: Investor[];
  companyValuation?: number;
  totalShares?: number;
}

const ScenarioPlanner = ({
  currentInvestors = [],
  companyValuation = 5000000,
  totalShares = 10000000,
}: ScenarioPlannerProps) => {
  const [scenarios, setScenarios] = useState<{
    [key: string]: { name: string; rounds: Round[] };
  }>({
    baseline: {
      name: "Baseline Scenario",
      rounds: [],
    },
  });

  const [activeScenario, setActiveScenario] = useState("baseline");
  const [isAddRoundDialogOpen, setIsAddRoundDialogOpen] = useState(false);
  const [newRoundData, setNewRoundData] = useState({
    name: "Series A",
    preMoneyValuation: 10000000,
    amount: 5000000,
    investorCount: 3,
  });

  // Calculate current cap table
  const calculateCurrentCapTable = () => {
    const totalInvestment = currentInvestors.reduce(
      (sum, inv) => sum + inv.subscriptionAmount,
      0,
    );

    return currentInvestors.map((investor) => ({
      ...investor,
      ownershipPercentage:
        (investor.subscriptionAmount / totalInvestment) * 100,
    }));
  };

  // Calculate dilution after a new round with advanced features
  const calculateDilution = (
    roundAmount: number,
    preMoneyValuation: number,
  ) => {
    const postMoneyValuation = preMoneyValuation + roundAmount;
    const dilutionFactor = preMoneyValuation / postMoneyValuation;

    // Handle convertible securities conversion
    const convertibleInvestors = currentInvestors.filter(
      (inv) =>
        inv.securityType === "convertible_note" || inv.securityType === "safe",
    );

    // Calculate which convertibles will convert in this round
    const convertingInvestors = convertibleInvestors.filter((inv) => {
      // Check if valuation triggers conversion
      const conversionCap = inv.conversionCap || Infinity;
      return preMoneyValuation >= conversionCap;
    });

    // Calculate additional shares from convertible securities
    let additionalShares = 0;
    let additionalOwnership = 0;

    convertingInvestors.forEach((inv) => {
      // Calculate conversion terms
      const conversionCap = inv.conversionCap || preMoneyValuation;
      const discountFactor = inv.conversionDiscount
        ? (100 - inv.conversionDiscount) / 100
        : 1;

      // Use the more favorable of cap or discount
      const effectiveValuation = Math.min(
        conversionCap,
        preMoneyValuation * discountFactor,
      );

      // Calculate ownership based on effective valuation
      const ownershipPercentage = inv.subscriptionAmount / effectiveValuation;
      additionalOwnership += ownershipPercentage;

      // Calculate shares based on price per share
      const pricePerShare = preMoneyValuation / totalShares;
      const shares = inv.subscriptionAmount / (pricePerShare * discountFactor);
      additionalShares += shares;
    });

    // Adjust dilution factor to account for converting securities
    const adjustedDilutionFactor =
      preMoneyValuation /
      (postMoneyValuation + additionalOwnership * preMoneyValuation);

    // Create a copy of current investors with diluted ownership
    const dilutedInvestors = currentInvestors.map((investor) => {
      // If this investor is converting, change their security type and recalculate ownership
      if (convertingInvestors.some((conv) => conv.id === investor.id)) {
        // Calculate conversion terms for this specific investor
        const conversionCap = investor.conversionCap || preMoneyValuation;
        const discountFactor = investor.conversionDiscount
          ? (100 - investor.conversionDiscount) / 100
          : 1;

        // Use the more favorable of cap or discount
        const effectiveValuation = Math.min(
          conversionCap,
          preMoneyValuation * discountFactor,
        );

        // Calculate new ownership percentage after conversion
        const newOwnershipPercentage =
          (investor.subscriptionAmount / effectiveValuation) *
          adjustedDilutionFactor;

        return {
          ...investor,
          securityType: "equity",
          ownershipPercentage: newOwnershipPercentage * 100, // Convert to percentage
          converted: true,
          conversionRound: newRoundData.name,
          originalSecurityType: investor.securityType,
        };
      }

      // For non-converting investors, just apply the dilution factor
      return {
        ...investor,
        ownershipPercentage:
          (investor.ownershipPercentage || 0) * adjustedDilutionFactor,
      };
    });

    // Create new investors for this round
    const newInvestorOwnership = (roundAmount / postMoneyValuation) * 100;
    const newInvestorCount = newRoundData.investorCount;
    const newInvestors = Array.from({ length: newInvestorCount }, (_, i) => ({
      id: `new-${Date.now()}-${i + 1}`,
      name: `New Investor ${i + 1}`,
      securityType: "equity",
      subscriptionAmount: roundAmount / newInvestorCount,
      ownershipPercentage: newInvestorOwnership / newInvestorCount,
      investmentDate: new Date().toISOString().split("T")[0],
      round: newRoundData.name,
    }));

    // Calculate new share price and total shares
    const newSharePrice =
      postMoneyValuation /
      (totalShares +
        additionalShares +
        roundAmount / (preMoneyValuation / totalShares));
    const newTotalShares =
      totalShares +
      additionalShares +
      roundAmount / (preMoneyValuation / totalShares);

    return {
      dilutedInvestors,
      newInvestors,
      postMoneyValuation,
      newSharePrice,
      newTotalShares,
      convertedInvestors: convertingInvestors.length,
    };
  };

  const addNewRound = () => {
    const { preMoneyValuation, amount, name } = newRoundData;
    const { newInvestors } = calculateDilution(amount, preMoneyValuation);

    const newRound: Round = {
      id: `round-${Date.now()}`,
      name,
      preMoneyValuation,
      amount,
      newInvestors,
    };

    setScenarios({
      ...scenarios,
      [activeScenario]: {
        ...scenarios[activeScenario],
        rounds: [...scenarios[activeScenario].rounds, newRound],
      },
    });

    setIsAddRoundDialogOpen(false);
  };

  const createNewScenario = () => {
    const newScenarioId = `scenario-${Date.now()}`;
    setScenarios({
      ...scenarios,
      [newScenarioId]: {
        name: `New Scenario ${Object.keys(scenarios).length + 1}`,
        rounds: [],
      },
    });
    setActiveScenario(newScenarioId);
  };

  // Calculate the final cap table after all rounds in the active scenario
  const calculateFinalCapTable = () => {
    let currentValuation = companyValuation;
    let investorsList = [...calculateCurrentCapTable()];

    // Apply each round sequentially
    scenarios[activeScenario].rounds.forEach((round) => {
      const { dilutedInvestors, newInvestors, postMoneyValuation } =
        calculateDilution(round.amount, currentValuation);

      // Update current investors with diluted ownership
      investorsList = dilutedInvestors;

      // Add new investors from this round
      investorsList = [...investorsList, ...newInvestors];

      // Update valuation for next round
      currentValuation = postMoneyValuation;
    });

    return {
      investors: investorsList,
      finalValuation: currentValuation,
    };
  };

  const { investors: finalInvestors, finalValuation } =
    calculateFinalCapTable();

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle>Scenario Planning</CardTitle>
            <CardDescription>
              Model different investment rounds and their impact on cap table
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={activeScenario} onValueChange={setActiveScenario}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select scenario" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(scenarios).map(([id, scenario]) => (
                  <SelectItem key={id} value={id}>
                    {scenario.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={createNewScenario}
              title="Create new scenario"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-muted/20 rounded-md">
          <div>
            <h3 className="font-medium">{scenarios[activeScenario].name}</h3>
            <p className="text-sm text-muted-foreground">
              Current Valuation: ${companyValuation.toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setIsAddRoundDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Add Funding Round</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              <span>Save Scenario</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="rounds">
          <TabsList>
            <TabsTrigger value="rounds">Funding Rounds</TabsTrigger>
            <TabsTrigger value="captable">Resulting Cap Table</TabsTrigger>
            <TabsTrigger value="chart">Ownership Chart</TabsTrigger>
          </TabsList>

          <TabsContent value="rounds" className="space-y-4 pt-4">
            {scenarios[activeScenario].rounds.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Round</TableHead>
                      <TableHead className="text-right">
                        Pre-Money Valuation
                      </TableHead>
                      <TableHead className="text-right">
                        Amount Raised
                      </TableHead>
                      <TableHead className="text-right">
                        Post-Money Valuation
                      </TableHead>
                      <TableHead className="text-right">
                        New Investors
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scenarios[activeScenario].rounds.map((round, index) => (
                      <TableRow key={round.id}>
                        <TableCell className="font-medium">
                          {round.name}
                        </TableCell>
                        <TableCell className="text-right">
                          ${round.preMoneyValuation.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ${round.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          $
                          {(
                            round.preMoneyValuation + round.amount
                          ).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {round.newInvestors.length}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Funding Rounds Yet</h3>
                <p className="text-sm text-muted-foreground max-w-md mt-2 mb-4">
                  Add funding rounds to see how they impact ownership and
                  valuation.
                </p>
                <Button onClick={() => setIsAddRoundDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add First Round
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="captable" className="space-y-4 pt-4">
            <div className="p-4 bg-muted/20 rounded-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-medium">Final Cap Table</h3>
                <p className="text-sm text-muted-foreground">
                  Final Valuation: ${finalValuation.toLocaleString()}
                </p>
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span>Export Cap Table</span>
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investor</TableHead>
                    <TableHead>Security Type</TableHead>
                    <TableHead className="text-right">Investment</TableHead>
                    <TableHead className="text-right">Ownership %</TableHead>
                    <TableHead className="text-right">Value ($)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finalInvestors.map((investor) => (
                    <TableRow key={investor.id}>
                      <TableCell className="font-medium">
                        {investor.name}
                      </TableCell>
                      <TableCell className="capitalize">
                        {investor.securityType.replace("_", " ")}
                      </TableCell>
                      <TableCell className="text-right">
                        ${investor.subscriptionAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {investor.ownershipPercentage.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        $
                        {Math.round(
                          (investor.ownershipPercentage / 100) * finalValuation,
                        ).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent
            value="chart"
            className="h-[400px] flex items-center justify-center pt-4"
          >
            <div className="text-center">
              <BarChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Ownership Visualization</h3>
              <p className="text-sm text-muted-foreground max-w-md mt-2 mb-4">
                In a complete implementation, this would display a chart showing
                ownership percentages before and after each funding round.
              </p>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Chart
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <Dialog
        open={isAddRoundDialogOpen}
        onOpenChange={setIsAddRoundDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Funding Round</DialogTitle>
            <DialogDescription>
              Enter the details of the new funding round to see its impact on
              the cap table.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roundName" className="text-right">
                Round Name
              </Label>
              <Input
                id="roundName"
                value={newRoundData.name}
                onChange={(e) =>
                  setNewRoundData({ ...newRoundData, name: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="preMoneyValuation" className="text-right">
                Pre-Money Valuation
              </Label>
              <Input
                id="preMoneyValuation"
                value={newRoundData.preMoneyValuation}
                onChange={(e) =>
                  setNewRoundData({
                    ...newRoundData,
                    preMoneyValuation: parseFloat(e.target.value) || 0,
                  })
                }
                type="number"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount Raised
              </Label>
              <Input
                id="amount"
                value={newRoundData.amount}
                onChange={(e) =>
                  setNewRoundData({
                    ...newRoundData,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                type="number"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="investorCount" className="text-right">
                Number of Investors
              </Label>
              <Input
                id="investorCount"
                value={newRoundData.investorCount}
                onChange={(e) =>
                  setNewRoundData({
                    ...newRoundData,
                    investorCount: parseInt(e.target.value) || 1,
                  })
                }
                type="number"
                min="1"
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddRoundDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={addNewRound}>
              Add Round
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ScenarioPlanner;
