import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
import { supabase } from "@/infrastructure/database/client";
import { useToast } from "@/components/ui/use-toast";
import { Investor, InvestorDocument } from "@/types/core/centralModels";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProfileSettingsSectionProps {
  investor: Investor;
  documents: InvestorDocument[];
  onUpdate: () => void;
}

const ProfileSettingsSection: React.FC<ProfileSettingsSectionProps> = ({
  investor,
  documents,
  onUpdate,
}) => {
  const [formData, setFormData] = useState({
    name: investor.name || "",
    email: investor.email || "",
    type: investor.type || "individual",
    taxResidency: investor.taxResidency || "",
    taxIdNumber: investor.taxIdNumber || "",
    accreditationType: investor.accreditationType || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("investors")
        .update({
          name: formData.name,
          email: formData.email,
          type: formData.type,
          tax_residency: formData.taxResidency,
          tax_id_number: formData.taxIdNumber,
          accreditation_type: formData.accreditationType,
        })
        .eq("investor_id", investor.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your investor profile has been successfully updated.",
      });

      onUpdate();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      // Upload file to storage
      const fileName = `${investor.id}/${documentType}/${Math.random().toString(36).substring(2)}_${file.name}`;
      const { data: fileData, error: fileError } = await supabase.storage
        .from("investor-documents")
        .upload(fileName, file);

      if (fileError) throw fileError;

      // Get public URL for the file
      const { data: urlData } = supabase.storage
        .from("investor-documents")
        .getPublicUrl(fileName);

      // Insert document record
      const { error: docError } = await supabase.from("documents").insert({
        name: file.name,
        type: documentType,
        status: "pending",
        file_path: fileName,
        file_url: urlData.publicUrl,
        entity_id: investor.id,
        entity_type: "investor",
        metadata: {
          original_name: file.name,
          size: file.size,
          content_type: file.type,
          description: `Uploaded document for ${documentType}`,
        },
      });

      if (docError) throw docError;

      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded and is pending review.",
      });

      onUpdate();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your document. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Manage your investor profile and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Investor Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleSelectChange("type", value)}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select investor type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="entity">Entity</SelectItem>
                      <SelectItem value="joint">Joint</SelectItem>
                      <SelectItem value="trust">Trust</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accreditation-type">Accreditation Type</Label>
                  <Select
                    value={formData.accreditationType}
                    onValueChange={(value) => handleSelectChange("accreditationType", value)}
                  >
                    <SelectTrigger id="accreditation-type">
                      <SelectValue placeholder="Select accreditation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="net_worth">Net Worth</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="entity">Entity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax-residency">Tax Residency</Label>
                  <Input
                    id="tax-residency"
                    name="taxResidency"
                    value={formData.taxResidency}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax-id">Tax ID Number</Label>
                  <Input
                    id="tax-id"
                    name="taxIdNumber"
                    value={formData.taxIdNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                Edit Profile
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="documents">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Identity Documents</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <p className="font-medium mb-2">Government ID</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Passport, driver's license, or ID card
                    </p>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        documents.some(d => d.documentType === "government_id" && d.status === "APPROVED")
                          ? "bg-green-100 text-green-800"
                          : documents.some(d => d.documentType === "government_id")
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-800"
                      }`}>
                        {documents.some(d => d.documentType === "government_id" && d.status === "APPROVED")
                          ? "Approved"
                          : documents.some(d => d.documentType === "government_id")
                            ? "Pending"
                            : "Required"}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("gov-id-upload")?.click()}
                      >
                        {documents.some(d => d.documentType === "government_id") ? "Update" : "Upload"}
                      </Button>
                      <input
                        id="gov-id-upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, "government_id")}
                      />
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <p className="font-medium mb-2">Proof of Address</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Utility bill or bank statement
                    </p>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        documents.some(d => d.documentType === "proof_of_address" && d.status === "APPROVED")
                          ? "bg-green-100 text-green-800"
                          : documents.some(d => d.documentType === "proof_of_address")
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-800"
                      }`}>
                        {documents.some(d => d.documentType === "proof_of_address" && d.status === "APPROVED")
                          ? "Approved"
                          : documents.some(d => d.documentType === "proof_of_address")
                            ? "Pending"
                            : "Required"}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("address-upload")?.click()}
                      >
                        {documents.some(d => d.documentType === "proof_of_address") ? "Update" : "Upload"}
                      </Button>
                      <input
                        id="address-upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, "proof_of_address")}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Financial Documents</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <p className="font-medium mb-2">Accreditation Proof</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Documentation proving accredited status
                    </p>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        documents.some(d => d.documentType === "accreditation_proof" && d.status === "APPROVED")
                          ? "bg-green-100 text-green-800"
                          : documents.some(d => d.documentType === "accreditation_proof")
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-800"
                      }`}>
                        {documents.some(d => d.documentType === "accreditation_proof" && d.status === "APPROVED")
                          ? "Approved"
                          : documents.some(d => d.documentType === "accreditation_proof")
                            ? "Pending"
                            : "Required"}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("accreditation-upload")?.click()}
                      >
                        {documents.some(d => d.documentType === "accreditation_proof") ? "Update" : "Upload"}
                      </Button>
                      <input
                        id="accreditation-upload"
                        type="file"
                        className="hidden"
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(e, "accreditation_proof")}
                      />
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <p className="font-medium mb-2">Tax Documents</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      W-8BEN, W-9, or equivalent forms
                    </p>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        documents.some(d => d.documentType === "tax_document" && d.status === "APPROVED")
                          ? "bg-green-100 text-green-800"
                          : documents.some(d => d.documentType === "tax_document")
                            ? "bg-amber-100 text-amber-800"
                            : "bg-amber-100 text-amber-800"
                      }`}>
                        {documents.some(d => d.documentType === "tax_document" && d.status === "APPROVED")
                          ? "Approved"
                          : documents.some(d => d.documentType === "tax_document")
                            ? "Pending"
                            : "Required"}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("tax-upload")?.click()}
                      >
                        {documents.some(d => d.documentType === "tax_document") ? "Update" : "Upload"}
                      </Button>
                      <input
                        id="tax-upload"
                        type="file"
                        className="hidden"
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(e, "tax_document")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preferences">
            <div className="p-4 text-center">
              <p className="text-muted-foreground">
                Investment preferences will be available once your account is fully approved.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProfileSettingsSection; 