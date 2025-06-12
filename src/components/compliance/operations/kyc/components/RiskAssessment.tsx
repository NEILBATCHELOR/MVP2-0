import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, ClipboardList, AlertCircle, AlertTriangle, BarChart4, History, Shield } from "lucide-react";
import { RiskAssessmentService } from '../services/riskAssessmentService';
import type { RiskAssessment as RiskAssessmentType, RiskLevel } from '@/types/domain/identity/onfido';

interface RiskAssessmentProps {
  investorId: string;
  investorData?: {
    investorType: string;
    nationality: string;
    residenceCountry: string;
    politicalExposure?: boolean;
    sourceOfFunds?: string;
    industryType?: string;
    transactionVolume?: number;
  };
  onComplete?: (riskAssessment: RiskAssessmentType) => void;
}

interface RiskFactor {
  factor: string;
  weight: number;
  score: number;
  description?: string;
  category: 'identity' | 'geography' | 'activity' | 'legal' | 'financial';
}

export const RiskAssessment: React.FC<RiskAssessmentProps> = ({
  investorId,
  investorData,
  onComplete
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessmentType | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRiskLevel, setReviewRiskLevel] = useState<RiskLevel>('medium');
  const [highRiskFactors, setHighRiskFactors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

  // Fetch existing risk assessment on mount
  useEffect(() => {
    if (investorId) {
      fetchRiskAssessment();
    } else {
      setIsFetching(false);
    }
  }, [investorId]);

  const fetchRiskAssessment = async () => {
    setIsFetching(true);
    setError(null);
    
    try {
      const riskService = RiskAssessmentService.getInstance();
      const assessment = await riskService.getRiskAssessment(investorId, 'investor');
      
      if (assessment) {
        setRiskAssessment(assessment);
      }
    } catch (err) {
      console.error('Error fetching risk assessment:', err);
      setError('Failed to load risk assessment data');
    } finally {
      setIsFetching(false);
    }
  };

  const calculateRiskScore = async () => {
    if (!investorData) {
      setError('Missing investor data');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const riskService = RiskAssessmentService.getInstance();
      
      const assessment = await riskService.calculateRiskScore({
        investorId,
        investorType: investorData.investorType,
        nationality: investorData.nationality,
        residenceCountry: investorData.residenceCountry,
        politicalExposure: investorData.politicalExposure,
        sourceOfFunds: investorData.sourceOfFunds,
        industryType: investorData.industryType,
        transactionVolume: investorData.transactionVolume,
        highRiskFactors
      });
      
      setRiskAssessment(assessment);
      
      if (onComplete) {
        onComplete(assessment);
      }
      
    } catch (err) {
      console.error('Error calculating risk score:', err);
      setError(err instanceof Error ? err.message : 'Failed to calculate risk score');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReview = async () => {
    if (!riskAssessment) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const riskService = RiskAssessmentService.getInstance();
      
      const updatedAssessment = await riskService.addRiskReview({
        assessmentId: riskAssessment.id,
        reviewedBy: 'current-user', // In production, this would come from auth context
        riskLevel: reviewRiskLevel,
        comments: reviewComment
      });
      
      setRiskAssessment(updatedAssessment);
      setShowReviewForm(false);
      setReviewComment('');
      
      if (onComplete) {
        onComplete(updatedAssessment);
      }
      
    } catch (err) {
      console.error('Error adding review:', err);
      setError(err instanceof Error ? err.message : 'Failed to add review');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskLevelBadge = (level: RiskLevel) => {
    switch (level) {
      case 'low':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Low Risk
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Medium Risk
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            High Risk
          </Badge>
        );
      default:
        return null;
    }
  };

  const getFactorCategoryIcon = (category: string) => {
    switch (category) {
      case 'identity':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'geography':
        return <BarChart4 className="h-4 w-4 text-purple-500" />;
      case 'activity':
        return <History className="h-4 w-4 text-orange-500" />;
      case 'legal':
        return <ClipboardList className="h-4 w-4 text-indigo-500" />;
      case 'financial':
        return <AlertTriangle className="h-4 w-4 text-teal-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isFetching) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Assessment</CardTitle>
        <CardDescription>
          Evaluate investor risk profile based on multiple factors
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!riskAssessment ? (
          // Risk assessment calculation form
          <>
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">High Risk Indicators</h3>
                <p className="text-sm text-muted-foreground">
                  Select any high-risk factors that apply to this investor
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'pep', label: 'Politically Exposed Person' },
                    { id: 'high_risk_country', label: 'High Risk Country' },
                    { id: 'high_value', label: 'High Value Transactions' },
                    { id: 'complex_structure', label: 'Complex Ownership Structure' },
                    { id: 'high_risk_industry', label: 'High Risk Industry' },
                    { id: 'adverse_media', label: 'Adverse Media Mentions' },
                    { id: 'sanctions', label: 'Sanctions List Match' },
                    { id: 'suspicious_activity', label: 'Suspicious Transaction Activity' }
                  ].map(item => (
                    <div key={item.id} className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id={item.id}
                        className="rounded border-gray-300 text-primary h-5 w-5 mt-0.5"
                        checked={highRiskFactors.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setHighRiskFactors(prev => [...prev, item.id]);
                          } else {
                            setHighRiskFactors(prev => prev.filter(f => f !== item.id));
                          }
                        }}
                      />
                      <label htmlFor={item.id} className="text-sm font-medium flex-1">
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 flex justify-center">
                <Button 
                  onClick={calculateRiskScore}
                  disabled={isLoading || !investorData}
                  className="w-full max-w-xs"
                >
                  {isLoading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <BarChart4 className="mr-2 h-4 w-4" />
                      Calculate Risk Score
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          // Risk assessment results
          <>
            <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">Risk Profile</h3>
                  {getRiskLevelBadge(riskAssessment.riskLevel)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Assessment date: {new Date(riskAssessment.assessmentDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Next review: {new Date(riskAssessment.nextReviewDate).toLocaleDateString()}
                </p>
              </div>
              
              <div className="p-4 border rounded-lg flex flex-col items-center">
                <span className="text-sm text-muted-foreground">Risk Score</span>
                <span className={`text-3xl font-bold ${getRiskScoreColor(riskAssessment.totalScore)}`}>
                  {riskAssessment.totalScore}
                </span>
                <span className="text-xs text-muted-foreground">(0-100)</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium">Risk Factors</h3>
                <div className="flex gap-2">
                  <Button 
                    variant={activeTab === 'current' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setActiveTab('current')}
                  >
                    Current
                  </Button>
                  <Button 
                    variant={activeTab === 'history' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setActiveTab('history')}
                  >
                    History
                  </Button>
                </div>
              </div>
              
              {activeTab === 'current' && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Factor</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Impact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {riskAssessment.factors.map((factor, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{factor.factor}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getFactorCategoryIcon(factor.category)}
                              <span className="capitalize">{factor.category}</span>
                            </div>
                          </TableCell>
                          <TableCell>{factor.weight}%</TableCell>
                          <TableCell>{factor.score}</TableCell>
                          <TableCell>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${factor.score < 3 ? 'bg-green-500' : factor.score < 7 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                style={{ width: `${Math.min(100, factor.score * 10)}%` }}
                              ></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {activeTab === 'history' && riskAssessment.reviewHistory && riskAssessment.reviewHistory.length > 0 && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Reviewer</TableHead>
                        <TableHead>Risk Level</TableHead>
                        <TableHead>Comments</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {riskAssessment.reviewHistory.map((review, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(review.date).toLocaleDateString()}</TableCell>
                          <TableCell>{review.reviewedBy}</TableCell>
                          <TableCell>{getRiskLevelBadge(review.riskLevel)}</TableCell>
                          <TableCell>{review.comments || 'No comments'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {activeTab === 'history' && (!riskAssessment.reviewHistory || riskAssessment.reviewHistory.length === 0) && (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No review history found</p>
                </div>
              )}
            </div>
            
            {showReviewForm ? (
              <div className="mt-6 p-4 border rounded-md space-y-4">
                <h3 className="text-base font-medium">Add Review</h3>
                <div className="space-y-2">
                  <Label>Risk Level Assessment</Label>
                  <Select value={reviewRiskLevel} onValueChange={(value) => setReviewRiskLevel(value as RiskLevel)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select risk level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Risk Level</SelectLabel>
                        <SelectItem value="low">Low Risk</SelectItem>
                        <SelectItem value="medium">Medium Risk</SelectItem>
                        <SelectItem value="high">High Risk</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Comments</Label>
                  <Textarea 
                    placeholder="Add your review comments here..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddReview} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Saving...
                      </>
                    ) : (
                      'Submit Review'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex justify-center">
                <Button onClick={() => setShowReviewForm(true)}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Add Review
                </Button>
              </div>
            )}
          </>
        )}
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default RiskAssessment;