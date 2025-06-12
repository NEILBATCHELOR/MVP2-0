import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BulkWalletGeneration } from "../wallets";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function WalletOperationsPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Investor Wallet Operations</h1>
          <p className="text-muted-foreground">
            Manage and generate wallets for investors
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate("/compliance/operations/dashboard")}
        >
          Back to Operations
        </Button>
      </div>

      <Tabs defaultValue="bulk" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="bulk">Bulk Wallet Generation</TabsTrigger>
          <TabsTrigger value="management">Wallet Management</TabsTrigger>
        </TabsList>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Generate Wallets for Investors</CardTitle>
              <CardDescription>
                Create Ethereum wallets for investors who don't have one yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BulkWalletGeneration />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Management</CardTitle>
              <CardDescription>
                View and manage existing investor wallets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Wallet management features coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}