import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useDropzone } from 'react-dropzone';
import { createWorker } from 'tesseract.js';
import { FileText, Upload, CheckCircle, XCircle, AlertTriangle, Zap, Scan, FileSearch, Settings } from 'lucide-react';
import { KycDocumentType } from '@/types/domain/compliance/compliance';
import { DocumentAnalysisService } from '../services/documentAnalysisService';

interface SmartDocumentProcessorProps {
  investorId?: string;
  onProcessComplete: (result: {
    success: boolean;
    documentType?: KycDocumentType;
    extractedData?: Record<string, any>;
    confidence: number;
    warnings?: string[];
    documentId?: string;
    fileUrl?: string;
  }) => void;
  onError: (error: Error) => void;
}

export const SmartDocumentProcessor: React.FC<SmartDocumentProcessorProps> = ({
  investorId,
  onProcessComplete,
  onError,
}) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [processingResult, setProcessingResult] = useState<{
    success: boolean;
    documentType?: KycDocumentType;
    extractedData?: Record<string, any>;
    confidence: number;
    warnings?: string[];
    documentId?: string;
    fileUrl?: string;
  } | null>(null);
  const [ocrText, setOcrText] = useState<string>('');
  const [ocrConfidence, setOcrConfidence] = useState<number>(0);
  const workerRef = useRef<Tesseract.Worker | null>(null);

  // Initialize Tesseract worker
  useEffect(() => {
    const initWorker = async () => {
      workerRef.current = await createWorker('eng');
    };
    
    initWorker();
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setActiveTab('analyze');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'application/pdf': [],
    },
    maxFiles: 1,
  });

  // Perform OCR on the image
  const performOcr = async () => {
    if (!file || !workerRef.current) return;
    
    try {
      setProcessingStep('Performing OCR...');
      setProcessingProgress(20);
      
      // If PDF, we would need to convert to images first
      // For simplicity, we'll assume it's an image
      const result = await workerRef.current.recognize(file);
      
      setOcrText(result.data.text);
      setOcrConfidence(result.data.confidence);
      setProcessingProgress(40);
    } catch (error) {
      console.error('OCR error:', error);
      onError(error instanceof Error ? error : new Error('OCR processing failed'));
    }
  };

  // Analyze document type
  const analyzeDocumentType = async () => {
    try {
      setProcessingStep('Analyzing document type...');
      setProcessingProgress(60);
      
      // Mock document type analysis based on OCR text
      // In a real implementation, this would use ML to determine document type
      let documentType: KycDocumentType = 'OTHER';
      
      const lowerText = ocrText.toLowerCase();
      
      if (lowerText.includes('passport') || lowerText.includes('nationality')) {
        documentType = 'PASSPORT';
      } else if (lowerText.includes('driver') || lowerText.includes('driving licence')) {
        documentType = 'DRIVERS_LICENSE';
      } else if (lowerText.includes('identity card') || lowerText.includes('national id')) {
        documentType = 'ID_CARD';
      } else if (lowerText.includes('utility') || lowerText.includes('electric') || lowerText.includes('water bill')) {
        documentType = 'UTILITY_BILL';
      }
      
      setProcessingProgress(80);
      return documentType;
    } catch (error) {
      console.error('Document type analysis error:', error);
      throw error;
    }
  };

  // Extract data from document
  const extractDocumentData = async (documentType: KycDocumentType) => {
    try {
      setProcessingStep('Extracting information...');
      
      // Mock data extraction based on document type and OCR text
      // In a real implementation, this would use named entity recognition
      const extractedData: Record<string, any> = {};
      const lowerText = ocrText.toLowerCase();
      
      // Extract name (very simplified - would be more sophisticated in real implementation)
      const nameMatch = ocrText.match(/name:?\s*([A-Za-z\s]+)/i);
      if (nameMatch && nameMatch[1]) {
        extractedData.name = nameMatch[1].trim();
      }
      
      // Extract date of birth
      const dobMatch = ocrText.match(/birth:?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i);
      if (dobMatch && dobMatch[1]) {
        extractedData.dateOfBirth = dobMatch[1];
      }
      
      // Extract document number based on type
      if (documentType === 'PASSPORT') {
        const passportMatch = ocrText.match(/passport no:?\s*([A-Z0-9]+)/i);
        if (passportMatch && passportMatch[1]) {
          extractedData.documentNumber = passportMatch[1];
        }
      } else if (documentType === 'DRIVERS_LICENSE') {
        const licenseMatch = ocrText.match(/license no:?\s*([A-Z0-9]+)/i);
        if (licenseMatch && licenseMatch[1]) {
          extractedData.documentNumber = licenseMatch[1];
        }
      }
      
      // Extract expiry date
      const expiryMatch = ocrText.match(/expiry:?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i);
      if (expiryMatch && expiryMatch[1]) {
        extractedData.expiryDate = expiryMatch[1];
      }
      
      setProcessingProgress(90);
      return extractedData;
    } catch (error) {
      console.error('Data extraction error:', error);
      throw error;
    }
  };

  // Check for potential issues
  const checkForWarnings = async (documentType: KycDocumentType, extractedData: Record<string, any>) => {
    try {
      setProcessingStep('Validating document...');
      
      const warnings: string[] = [];
      
      // Check for poor image quality based on OCR confidence
      if (ocrConfidence < 70) {
        warnings.push('Low image quality detected. Please upload a clearer image.');
      }
      
      // Check for missing essential fields
      if (documentType === 'PASSPORT' || documentType === 'ID_CARD') {
        if (!extractedData.name) {
          warnings.push('Could not detect name on document.');
        }
        
        if (!extractedData.dateOfBirth) {
          warnings.push('Could not detect date of birth on document.');
        }
        
        if (!extractedData.documentNumber) {
          warnings.push('Could not detect document number.');
        }
      }
      
      // Check for expired documents
      if (extractedData.expiryDate) {
        const expiryParts = extractedData.expiryDate.split(/[\/\.\-]/);
        if (expiryParts.length === 3) {
          let year = parseInt(expiryParts[2]);
          // Fix two-digit years
          if (year < 100) {
            year += year < 50 ? 2000 : 1900;
          }
          
          const month = parseInt(expiryParts[1]) - 1;
          const day = parseInt(expiryParts[0]);
          
          const expiryDate = new Date(year, month, day);
          const today = new Date();
          
          if (expiryDate < today) {
            warnings.push('Document appears to be expired.');
          }
        }
      }
      
      setProcessingProgress(95);
      return warnings;
    } catch (error) {
      console.error('Warning check error:', error);
      throw error;
    }
  };

  // Upload processed document
  const uploadDocument = async (documentType: KycDocumentType) => {
    if (!file || !investorId) return null;
    
    try {
      setProcessingStep('Uploading document...');
      
      // Create FormData for the upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('investorId', investorId);
      formData.append('documentType', documentType);
      
      // In a real implementation, this would use a proper API endpoint
      // For this example, we'll mock the response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockResponse = {
        documentId: `doc_${Math.random().toString(36).substring(2, 9)}`,
        fileUrl: URL.createObjectURL(file)
      };
      
      setProcessingProgress(100);
      return mockResponse;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  // Process the document
  const processDocument = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setProcessingProgress(0);
    
    try {
      // Step 1: Perform OCR
      await performOcr();
      
      // Step 2: Analyze document type
      const documentType = await analyzeDocumentType();
      
      // Step 3: Extract data
      const extractedData = await extractDocumentData(documentType);
      
      // Step 4: Check for warnings
      const warnings = await checkForWarnings(documentType, extractedData);
      
      // Step 5: Upload document if investor ID provided
      let uploadResult = null;
      if (investorId) {
        uploadResult = await uploadDocument(documentType);
      }
      
      // Determine overall success based on warnings
      const success = warnings.length === 0 || (warnings.length > 0 && warnings.every(w => !w.includes('expired')));
      
      const result = {
        success,
        documentType,
        extractedData,
        confidence: ocrConfidence,
        warnings,
        documentId: uploadResult?.documentId,
        fileUrl: uploadResult?.fileUrl,
      };
      
      setProcessingResult(result);
      onProcessComplete(result);
      setActiveTab('result');
    } catch (error) {
      console.error('Document processing error:', error);
      setProcessingResult({
        success: false,
        confidence: 0,
        warnings: ['Document processing failed. Please try again.']
      });
      onError(error instanceof Error ? error : new Error('Document processing failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset the processor
  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setOcrText('');
    setOcrConfidence(0);
    setProcessingResult(null);
    setActiveTab('upload');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Smart Document Processor</CardTitle>
        <CardDescription>
          Upload and automatically analyze documents for verification
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="upload" disabled={isProcessing}>Upload</TabsTrigger>
            <TabsTrigger value="analyze" disabled={!file || isProcessing}>Analyze</TabsTrigger>
            <TabsTrigger value="result" disabled={!processingResult}>Result</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="p-4">
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-10 w-10 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-sm">Drop the file here...</p>
                ) : (
                  <>
                    <p className="text-sm font-medium">Drag & drop a document or click to browse</p>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: .jpg, .jpeg, .png, .pdf
                    </p>
                  </>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="analyze" className="space-y-4">
            {file && preview && (
              <div className="space-y-4">
                <div className="aspect-[3/4] max-h-[400px] overflow-hidden rounded-md border">
                  {preview.startsWith('data:application/pdf') ? (
                    <div className="flex h-full items-center justify-center bg-muted/20">
                      <FileText className="h-16 w-16 text-muted-foreground" />
                      <p className="ml-2 text-muted-foreground">PDF Preview</p>
                    </div>
                  ) : (
                    <img 
                      src={preview} 
                      alt="Document preview" 
                      className="h-full w-full object-contain"
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Document Details</Label>
                    <Badge variant="outline">{file.type}</Badge>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-sm">
                      <span className="font-medium">Name:</span> {file.name}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Size:</span> {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                
                {isProcessing ? (
                  <div className="space-y-4 rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Spinner className="mr-2 h-4 w-4" />
                        <p className="font-medium">{processingStep}</p>
                      </div>
                      <span className="text-sm">{processingProgress}%</span>
                    </div>
                    <Progress value={processingProgress} className="h-2" />
                  </div>
                ) : (
                  <Button className="w-full" onClick={processDocument}>
                    <Zap className="mr-2 h-4 w-4" />
                    Process Document
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="result" className="space-y-4">
            {processingResult && (
              <div className="space-y-6">
                <div className="flex items-center justify-between rounded-md border p-4">
                  <div className="flex items-center">
                    {processingResult.success ? (
                      <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="mr-2 h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium">
                        {processingResult.success 
                          ? 'Document Processed Successfully' 
                          : 'Document Processing Issues'
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {processingResult.documentType 
                          ? `Identified as: ${processingResult.documentType.replace(/_/g, ' ')}` 
                          : 'Document type could not be determined'
                        }
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    Confidence: {Math.round(processingResult.confidence)}%
                  </Badge>
                </div>
                
                {processingResult.warnings && processingResult.warnings.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Warnings</AlertTitle>
                    <AlertDescription>
                      <ul className="ml-5 list-disc text-sm">
                        {processingResult.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                
                {processingResult.extractedData && Object.keys(processingResult.extractedData).length > 0 && (
                  <div className="space-y-2">
                    <Label>Extracted Information</Label>
                    <div className="rounded-md border divide-y">
                      {Object.entries(processingResult.extractedData).map(([key, value]) => (
                        <div key={key} className="flex p-3">
                          <span className="w-1/3 font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="w-2/3">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {ocrText && (
                  <div className="space-y-2 border-t pt-4">
                    <Label className="text-muted-foreground">Raw OCR Text</Label>
                    <div className="max-h-40 overflow-auto rounded-md bg-muted p-3 text-xs">
                      <pre className="whitespace-pre-wrap break-words">{ocrText}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          {processingResult && (
            <p className="text-xs text-muted-foreground">
              Document ID: {processingResult.documentId || 'Not saved'}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {activeTab !== 'upload' && (
            <Button variant="outline" onClick={handleReset}>
              Process Another Document
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default SmartDocumentProcessor;