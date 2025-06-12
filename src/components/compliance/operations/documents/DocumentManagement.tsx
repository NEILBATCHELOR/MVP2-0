import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DocumentManagement = () => {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="all">All Documents</TabsTrigger>
              <TabsTrigger value="pending">Pending Review</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">All Documents</h3>
                {/* Add document list with filters */}
              </div>
            </TabsContent>

            <TabsContent value="pending">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pending Review</h3>
                {/* Add pending documents list */}
              </div>
            </TabsContent>

            <TabsContent value="approved">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Approved Documents</h3>
                {/* Add approved documents list */}
              </div>
            </TabsContent>

            <TabsContent value="rejected">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Rejected Documents</h3>
                {/* Add rejected documents list */}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentManagement;