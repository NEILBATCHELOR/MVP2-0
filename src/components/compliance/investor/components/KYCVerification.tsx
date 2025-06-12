import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../context/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Shield,
} from 'lucide-react';

interface DocumentUpload {
  id: string;
  file: File;
  type: string;
  status: 'uploading' | 'processing' | 'verified' | 'rejected';
  progress: number;
}

const requiredDocuments = [
  {
    type: 'government_id',
    title: 'Government-Issued ID',
    description: 'Passport, driver\'s license, or national ID card',
    required: true,
    acceptedFormats: ['PDF', 'JPG', 'PNG'],
  },
  {
    type: 'proof_of_address',
    title: 'Proof of Address',
    description: 'Utility bill, bank statement (less than 3 months old)',
    required: true,
    acceptedFormats: ['PDF', 'JPG', 'PNG'],
  },
  {
    type: 'accreditation_proof',
    title: 'Accreditation Proof',
    description: 'Documentation proving accredited investor status',
    required: true,
    acceptedFormats: ['PDF'],
  },
  {
    type: 'source_of_wealth',
    title: 'Source of Wealth Statement',
    description: 'Documentation explaining source of investment funds',
    required: true,
    acceptedFormats: ['PDF'],
  },
  {
    type: 'tax_documents',
    title: 'Tax Documents',
    description: 'W-8BEN, W-9, or equivalent tax forms',
    required: true,
    acceptedFormats: ['PDF'],
  },
];

export const KYCVerification: React.FC = () => {
  const navigate = useNavigate();
  const { state, updateComplianceStatus, isDevelopmentMode } = useOnboarding();
  const [uploads, setUploads] = useState<DocumentUpload[]>([]);
  const [sourceOfWealth, setSourceOfWealth] = useState({
    primary: '',
    description: '',
  });

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    documentType: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create new upload
    const upload: DocumentUpload = {
      id: Math.random().toString(36).substr(2, 9),
      file,
      type: documentType,
      status: 'uploading',
      progress: 0,
    };

    setUploads((prev) => [...prev, upload]);

    // In development mode, skip the upload simulation and mark as verified immediately
    if (isDevelopmentMode) {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === upload.id
            ? { ...u, status: 'verified', progress: 100 }
            : u
        )
      );
      return;
    }

    // Regular upload simulation for non-development mode
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress <= 100) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id ? { ...u, progress } : u
          )
        );
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === upload.id
                ? { ...u, status: 'processing', progress: 100 }
                : u
            )
          );
          setTimeout(() => {
            setUploads((prev) =>
              prev.map((u) =>
                u.id === upload.id
                  ? { ...u, status: 'verified' }
                  : u
              )
            );
          }, 2000);
        }, 1000);
      }
    }, 500);
  };

  const getDocumentStatus = (type: string) => {
    const upload = uploads.find((u) => u.type === type);
    return upload?.status || 'not_uploaded';
  };

  const handleSubmit = async () => {
    // In development mode, skip validation and proceed
    if (isDevelopmentMode) {
      updateComplianceStatus({
        kycStatus: 'in_progress',
        accreditationStatus: 'pending_review',
        taxDocumentationStatus: 'pending_review',
        overallProgress: 60,
      });
      navigate('/compliance/investor-onboarding/wallet-setup');
      return;
    }

    // Regular validation and submission
    updateComplianceStatus({
      kycStatus: 'in_progress',
      accreditationStatus: 'pending_review',
      taxDocumentationStatus: 'pending_review',
      overallProgress: 60,
    });

    navigate('/compliance/investor-onboarding/wallet-setup');
  };

  const isComplete = isDevelopmentMode || (
    uploads.length === requiredDocuments.length &&
    uploads.every((u) => u.status === 'verified') &&
    sourceOfWealth.primary &&
    sourceOfWealth.description
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">KYC & AML Verification</h2>
        <p className="text-gray-500 mt-2">
          Complete your Know Your Customer (KYC) and Anti-Money Laundering (AML) verification
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Verification</CardTitle>
          <CardDescription>
            Please upload all required documents to proceed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {requiredDocuments.map((doc) => (
            <div
              key={doc.type}
              className="flex items-start space-x-4 p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <h3 className="font-medium">{doc.title}</h3>
                  {doc.required && (
                    <span className="text-xs text-red-500">Required</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{doc.description}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <p className="text-xs text-gray-400">
                    Accepted formats: {doc.acceptedFormats.join(', ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {getDocumentStatus(doc.type) === 'not_uploaded' ? (
                  <div>
                    <Input
                      type="file"
                      className="hidden"
                      id={`upload-${doc.type}`}
                      accept={doc.acceptedFormats
                        .map((format) => `.${format.toLowerCase()}`)
                        .join(',')}
                      onChange={(e) => handleFileUpload(e, doc.type)}
                    />
                    <Label htmlFor={`upload-${doc.type}`}>
                      <Button variant="outline" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </span>
                      </Button>
                    </Label>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    {getDocumentStatus(doc.type) === 'verified' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : getDocumentStatus(doc.type) === 'rejected' ? (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    ) : (
                      <div className="w-20">
                        <Progress
                          value={
                            uploads.find((u) => u.type === doc.type)?.progress
                          }
                        />
                      </div>
                    )}
                    <span className="text-sm">
                      {getDocumentStatus(doc.type) === 'verified'
                        ? 'Verified'
                        : getDocumentStatus(doc.type) === 'rejected'
                        ? 'Rejected'
                        : getDocumentStatus(doc.type) === 'processing'
                        ? 'Processing'
                        : 'Uploading'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Source of Wealth Declaration</CardTitle>
          <CardDescription>
            Provide information about the source of your investment funds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Primary Source of Wealth</Label>
            <Select
              value={sourceOfWealth.primary}
              onValueChange={(value) =>
                setSourceOfWealth((prev) => ({ ...prev, primary: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source of wealth" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employment">Employment Income</SelectItem>
                <SelectItem value="business">Business Income</SelectItem>
                <SelectItem value="inheritance">Inheritance</SelectItem>
                <SelectItem value="investment">Investment Returns</SelectItem>
                <SelectItem value="property">Property Sale</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Detailed Description</Label>
            <Textarea
              value={sourceOfWealth.description}
              onChange={(e) =>
                setSourceOfWealth((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Please provide details about your source of wealth..."
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your application will be automatically approved after compliance review.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={!isComplete}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default KYCVerification;