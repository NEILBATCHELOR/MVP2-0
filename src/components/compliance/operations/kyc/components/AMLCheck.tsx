import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, RefreshCw, Shield } from "lucide-react";
import { AMLService } from '../services/amlService';
import type { AMLCheck as AMLCheckType, VerificationStatus } from '@/types/domain/identity/onfido';
import type { ComplianceCheck } from '@/types/domain/compliance/compliance';

interface AMLCheckProps {
  investorId: string;
  investorData?: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    nationality?: string;
  };
  onComplete: (result: ComplianceCheck) => void;
  onError: (error: Error) => void;
}

export const AMLCheck: React.FC<AMLCheckProps> = ({
  investorId,
  investorData,
  onComplete,
  onError,
}) => {
  const [activeTab, setActiveTab] = useState('sanction');
  const [isLoading, setIsLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<AMLCheckType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<'onfido' | 'refinitiv' | 'complyadvantage'>('onfido');

  const runCheck = async (checkType: 'sanction' | 'pep' | 'adverse_media' | 'full') => {
    if (!investorData) {
      setError('Missing investor data');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const amlService = AMLService.getInstance();
      
      const result = await amlService.runAMLCheck({
        investorId,
        firstName: investorData.firstName,
        lastName: investorData.lastName,
        dateOfBirth: investorData.dateOfBirth,
        nationality: investorData.nationality,
        checkType,
        provider
      });
      
      setCheckResult(result);
      
      // Create a compliance check record
      const complianceCheck: ComplianceCheck = {
        id: crypto.randomUUID(),
        type: 'AML',
        status: result.status === 'match' ? 'FAILED' : 
                result.status === 'possible_match' ? 'IN_PROGRESS' : 'COMPLETED',
        result: result.status === 'no_match' ? 'PASS' : 
                result.status === 'match' ? 'FAIL' : 'REVIEW_REQUIRED',
        details: {
          provider,
          checkType,
          checkId: result.id,
          result: result.result,
          details: result.details
        },
        createdAt: new Date(),
      };
      
      onComplete(complianceCheck);
      
      // Update investor compliance status
      await amlService.updateInvestorComplianceForAML(
        investorId, 
        result.status === 'match' ? 'FAILED' : 
        result.status === 'possible_match' ? 'IN_PROGRESS' : 'COMPLETED'
      );
      
    } catch (err) {
      console.error('AML check error:', err);
      setError(err instanceof Error ? err.message : 'Failed to run AML check');
      onError(err instanceof Error ? err : new Error('Failed to run AML check'));
    } finally {
      setIsLoading(false);
    }
  };

  const getResultDisplay = () => {
    if (!checkResult) return null;
    
    switch (checkResult.result) {
      case 'no_match':
        return (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">No Matches Found</h3>
              <p className="text-muted-foreground">
                The AML check did not find any matches in the {activeTab} lists.
              </p>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Clear
            </Badge>
          </div>
        );
      case 'match':
        return (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <AlertCircle className="h-16 w-16 text-red-600" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">Match Found</h3>
              <p className="text-muted-foreground">
                The AML check found matches in the {activeTab} lists.
              </p>
            </div>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              Match
            </Badge>
            {checkResult.details && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Match details</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 text-sm">
                    {typeof checkResult.details === 'object' 
                      ? Object.entries(checkResult.details).map(([key, value]) => (
                          <div key={key} className="mb-1">
                            <span className="font-medium">{key}: </span>
                            <span>{value as string}</span>
                          </div>
                        ))
                      : checkResult.details}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        );
      case 'possible_match':
        return (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <Shield className="h-16 w-16 text-yellow-600" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">Possible Match</h3>
              <p className="text-muted-foreground">
                The AML check found possible matches that require review.
              </p>
            </div>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Review Required
            </Badge>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AML Compliance Check</CardTitle>
        <CardDescription>
          Check against global sanction lists, PEP lists, and adverse media
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="sanction">Sanctions</TabsTrigger>
            <TabsTrigger value="pep">PEPs</TabsTrigger>
            <TabsTrigger value="adverse_media">Adverse Media</TabsTrigger>
            <TabsTrigger value="full">Full Check</TabsTrigger>
          </TabsList>
          
          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <Button
                variant={provider === 'onfido' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setProvider('onfido')}
              >
                Onfido
              </Button>
              <Button
                variant={provider === 'refinitiv' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setProvider('refinitiv')}
              >
                Refinitiv
              </Button>
              <Button
                variant={provider === 'complyadvantage' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setProvider('complyadvantage')}
              >
                ComplyAdvantage
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {provider === 'onfido' 
                ? 'Onfido provides checks against global watchlists and sanctions.'
                : provider === 'refinitiv'
                ? 'Refinitiv World-Check offers comprehensive risk intelligence data.'
                : 'ComplyAdvantage uses AI to identify financial crime risks.'}
            </p>
          </div>
          
          {activeTab === 'sanction' && (
            <TabsContent value="sanction" className="space-y-4 pt-4">
              <p className="text-sm mb-4">
                Run a check against global sanctions lists to ensure compliance with financial regulations.
              </p>
              
              {!checkResult ? (
                <div className="flex justify-center mt-4">
                  <Button 
                    onClick={() => runCheck('sanction')} 
                    disabled={isLoading || !investorData}
                  >
                    {isLoading ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Running Check...
                      </>
                    ) : (
                      'Run Sanctions Check'
                    )}
                  </Button>
                </div>
              ) : (
                getResultDisplay()
              )}
            </TabsContent>
          )}
          
          {activeTab === 'pep' && (
            <TabsContent value="pep" className="space-y-4 pt-4">
              <p className="text-sm mb-4">
                Check if the investor is a Politically Exposed Person (PEP) requiring enhanced due diligence.
              </p>
              
              {!checkResult ? (
                <div className="flex justify-center mt-4">
                  <Button 
                    onClick={() => runCheck('pep')} 
                    disabled={isLoading || !investorData}
                  >
                    {isLoading ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Running Check...
                      </>
                    ) : (
                      'Run PEP Check'
                    )}
                  </Button>
                </div>
              ) : (
                getResultDisplay()
              )}
            </TabsContent>
          )}
          
          {activeTab === 'adverse_media' && (
            <TabsContent value="adverse_media" className="space-y-4 pt-4">
              <p className="text-sm mb-4">
                Scan for adverse media mentions and negative news that may indicate risk.
              </p>
              
              {!checkResult ? (
                <div className="flex justify-center mt-4">
                  <Button 
                    onClick={() => runCheck('adverse_media')} 
                    disabled={isLoading || !investorData}
                  >
                    {isLoading ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Running Check...
                      </>
                    ) : (
                      'Run Adverse Media Check'
                    )}
                  </Button>
                </div>
              ) : (
                getResultDisplay()
              )}
            </TabsContent>
          )}
          
          {activeTab === 'full' && (
            <TabsContent value="full" className="space-y-4 pt-4">
              <p className="text-sm mb-4">
                Comprehensive check covering sanctions, PEP status, and adverse media in one go.
              </p>
              
              {!checkResult ? (
                <div className="flex justify-center mt-4">
                  <Button 
                    onClick={() => runCheck('full')} 
                    disabled={isLoading || !investorData}
                  >
                    {isLoading ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Running Full Check...
                      </>
                    ) : (
                      'Run Full AML Check'
                    )}
                  </Button>
                </div>
              ) : (
                getResultDisplay()
              )}
            </TabsContent>
          )}
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {checkResult && (
            <div className="flex justify-center mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setCheckResult(null);
                  setError(null);
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Run Another Check
              </Button>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AMLCheck;