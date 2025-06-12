import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Loader2, 
  Plus, 
  X, 
  Shield, 
  Globe, 
  Users, 
  FileWarning, 
  CheckCircle, 
  ArrowUpRight,
  ArrowRight
} from 'lucide-react';
import { restrictionService } from '@/services/integrations/restrictionService';
import { sanctionsService } from '@/services/integrations/sanctionsService';
import type { RestrictionRule, RestrictionRuleFormData, RestrictionStats } from './types';
import { regionCountries } from '@/utils/compliance/countries';
import { investorTypeCategories } from '@/utils/compliance/investorTypes';
import { cn } from '@/utils';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface RestrictionManagerProps {
  onCreateRule?: (rule: RestrictionRuleFormData) => Promise<void>;
  onToggleRule?: (ruleId: string, active: boolean) => Promise<void>;
  onDeleteRule?: (ruleId: string) => Promise<void>;
  onError?: (error: Error | string) => void;
}

export default function RestrictionManager({
  onCreateRule,
  onToggleRule,
  onDeleteRule,
  onError
}: RestrictionManagerProps = {}) {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<RestrictionRule[]>([]);
  const [stats, setStats] = useState<RestrictionStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'COUNTRY' | 'INVESTOR_TYPE'>('COUNTRY');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSanctionsList, setSelectedSanctionsList] = useState<string>('');

  // Flatten countries and investor types for easier handling
  const allCountries = regionCountries.flatMap(region => region.countries);
  const allInvestorTypes = investorTypeCategories.flatMap(category => category.types);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [rulesData, statsData] = await Promise.all([
        restrictionService.getRestrictions(),
        restrictionService.getStatistics()
      ]);
      
      // Convert string dates to Date objects to match the expected RestrictionRule type
      const formattedRules = rulesData.map(rule => ({
        ...rule,
        createdAt: new Date(rule.createdAt),
        updatedAt: new Date(rule.updatedAt)
      }));
      
      setRules(formattedRules);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRules(e: React.FormEvent) {
    e.preventDefault();
    if (selectedValues.length === 0) {
      const errorMessage = 'Please select at least one item to restrict';
      setError(errorMessage);
      onError?.(errorMessage);
      return;
    }
    
    try {
      const creationPromises = selectedValues.map(value => {
        const rule = {
          type: selectedType,
          value,
          reason
        };
        
        if (onCreateRule) {
          return onCreateRule(rule);
        }
        return restrictionService.createRestriction(rule);
      });
      
      await Promise.all(creationPromises);
      setSelectedValues([]);
      setReason('');
      await loadData(); // Refresh stats
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create rules';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }

  async function handleToggleRule(ruleId: string, active: boolean) {
    try {
      if (onToggleRule) {
        await onToggleRule(ruleId, active);
      } else {
        await restrictionService.toggleRestriction(ruleId, active);
      }
      setRules(prev => prev.map(rule => 
        rule.id === ruleId ? { ...rule, active } : rule
      ));
      await loadData(); // Refresh stats
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle rule';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }

  async function handleDeleteRule(ruleId: string) {
    try {
      if (onDeleteRule) {
        await onDeleteRule(ruleId);
      } else {
        await restrictionService.deleteRestriction(ruleId);
      }
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
      await loadData(); // Refresh stats
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete rule';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }

  function handleSelectAll() {
    if (selectedType === 'COUNTRY') {
      setSelectedValues(allCountries.map(c => c.id));
    } else {
      setSelectedValues(allInvestorTypes.map(t => t.id));
    }
  }

  function handleDeselectAll() {
    setSelectedValues([]);
  }

  function handleItemToggle(value: string) {
    setSelectedValues(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  }

  function handleSanctionsListChange(listId: string) {
    setSelectedSanctionsList(listId);
    if (listId) {
      const countriesIds = sanctionsService.mapSanctionedCountriesToIds(listId);
      setSelectedValues(countriesIds);
      setReason(sanctionsService.generateRestrictionReason(listId));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Calculate percentages for visuals
  const percentageActiveRules = stats ? Math.round((stats.activeRules / (stats.totalRules || 1)) * 100) : 0;
  
  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Unlock Institutional Liquidity</h1>
        <p className="text-muted-foreground">
          Manage country and investor type restrictions to ensure compliance with regulatory requirements.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end mb-6">
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2"
          size="lg"
        >
          {showCreateForm ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Create Restriction
            </>
          )}
        </Button>
      </div>

      {showCreateForm && (
        <Card className="mb-8 shadow-md">
          <CardHeader>
            <CardTitle>Create New Restriction</CardTitle>
            <CardDescription>
              Define restrictions for countries or investor types to prevent specific entities from participating.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRules} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={selectedType}
                  onValueChange={(value) => {
                    setSelectedType(value as 'COUNTRY' | 'INVESTOR_TYPE');
                    setSelectedValues([]);
                    setSelectedSanctionsList('');
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COUNTRY">Country</SelectItem>
                    <SelectItem value="INVESTOR_TYPE">Investor Type</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedType === 'COUNTRY' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sanctions List</label>
                  <Select
                    value={selectedSanctionsList || "custom"}
                    onValueChange={value => {
                      if (value === "custom") {
                        setSelectedSanctionsList('');
                        setSelectedValues([]);
                        setReason('');
                      } else {
                        handleSanctionsListChange(value);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a sanctions list" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Selection</SelectItem>
                      {sanctionsService.getAllLists().map(list => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSanctionsList && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {sanctionsService.getListById(selectedSanctionsList)?.description}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">{selectedType === 'COUNTRY' ? 'Countries' : 'Investor Types'}</label>
                  <div className="space-x-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
                      Select All
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={handleDeselectAll}>
                      Deselect All
                    </Button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto border rounded-lg p-4 space-y-2">
                  {selectedType === 'COUNTRY' ? (
                    regionCountries.map(region => (
                      <div key={region.name} className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground">{region.name}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {region.countries.map(country => (
                            <div key={country.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={country.id}
                                checked={selectedValues.includes(country.id)}
                                onCheckedChange={() => handleItemToggle(country.id)}
                              />
                              <label htmlFor={country.id} className="text-sm">
                                {country.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    investorTypeCategories.map(category => (
                      <div key={category.id} className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground">{category.name}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {category.types.map(type => (
                            <div key={type.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={type.id}
                                checked={selectedValues.includes(type.id)}
                                onCheckedChange={() => handleItemToggle(type.id)}
                              />
                              <label htmlFor={type.id} className="text-sm">
                                {type.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reason</label>
                <Input
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Enter reason for restriction"
                />
              </div>

              <Button 
                type="submit" 
                disabled={selectedValues.length === 0 || !reason}
                className="w-full"
              >
                Create Restrictions
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="manage">Manage Restrictions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-md overflow-hidden">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
                <FileWarning className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalRules || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalRules === 1 ? '1 restriction rule configured' : `${stats?.totalRules || 0} restriction rules configured`}
                </p>
              </CardContent>
              <div className="bg-muted px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Overall compliance impact</span>
                  <span className="text-xs font-medium">{percentageActiveRules}%</span>
                </div>
                <Progress value={percentageActiveRules} className="h-1 mt-1" />
              </div>
            </Card>

            <Card className="shadow-md overflow-hidden">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
                <Shield className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.activeRules || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeRules === stats?.totalRules 
                    ? 'All rules are active' 
                    : `${stats?.activeRules || 0} out of ${stats?.totalRules || 0} rules are active`}
                </p>
              </CardContent>
              <div className={cn(
                "px-4 py-3 flex items-center justify-between text-xs font-medium",
                stats?.activeRules === stats?.totalRules ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
              )}>
                <span>{stats?.activeRules === stats?.totalRules ? 'Fully enforced' : 'Partially enforced'}</span>
                <CheckCircle className="h-4 w-4" />
              </div>
            </Card>

            <Card className="shadow-md overflow-hidden">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Blocked Countries</CardTitle>
                <Globe className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.blockedCountries || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.blockedCountries === 0 
                    ? 'No countries restricted' 
                    : `${stats?.blockedCountries || 0} countries restricted from access`}
                </p>
              </CardContent>
              <div className="bg-blue-50 px-4 py-3 flex items-center justify-between text-xs font-medium text-blue-800">
                <span>Geographic restrictions</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Card>

            <Card className="shadow-md overflow-hidden">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Blocked Investor Types</CardTitle>
                <Users className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.blockedInvestorTypes || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.blockedInvestorTypes === 0 
                    ? 'No investor types restricted' 
                    : `${stats?.blockedInvestorTypes || 0} investor types restricted from access`}
                </p>
              </CardContent>
              <div className="bg-purple-50 px-4 py-3 flex items-center justify-between text-xs font-medium text-purple-800">
                <span>Identity-based restrictions</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Card>
          </div>

          <div className="mt-8">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Recent Restrictions Activity</CardTitle>
                <CardDescription>
                  Overview of recent compliance restriction activity and changes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rules.length > 0 ? (
                  <div className="space-y-6">
                    {rules.slice(0, 5).map(rule => (
                      <div key={rule.id} className="flex items-start space-x-4">
                        <div className={cn(
                          "mt-0.5 rounded-full p-1",
                          rule.active ? "bg-green-100" : "bg-gray-100"
                        )}>
                          {rule.type === 'COUNTRY' ? (
                            <Globe className={cn("h-4 w-4", rule.active ? "text-green-600" : "text-gray-500")} />
                          ) : (
                            <Users className={cn("h-4 w-4", rule.active ? "text-green-600" : "text-gray-500")} />
                          )}
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{rule.type === 'COUNTRY' ? 
                              allCountries.find(c => c.id === rule.value)?.name : 
                              allInvestorTypes.find(t => t.id === rule.value)?.name}
                            </p>
                            <span className={cn(
                              "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                              rule.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            )}>
                              {rule.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{rule.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            Created on {rule.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No restrictions configured</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md mt-1">
                      Create your first restriction by clicking the "Create Restriction" button above.
                    </p>
                  </div>
                )}
              </CardContent>
              {rules.length > 5 && (
                <CardFooter className="border-t px-6 py-4">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => {
                      const tabElement = document.querySelector('[data-value="manage"]');
                      if (tabElement && 'click' in tabElement) {
                        (tabElement as HTMLElement).click();
                      }
                    }}
                  >
                    <span>View all restrictions</span>
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="manage">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Manage Restrictions</CardTitle>
              <CardDescription>Review, enable/disable, or remove restriction rules.</CardDescription>
            </CardHeader>
            <CardContent>
              {rules.length > 0 ? (
                <div className="space-y-4">
                  {rules.map(rule => (
                    <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{rule.type === 'COUNTRY' ? 
                          allCountries.find(c => c.id === rule.value)?.name : 
                          allInvestorTypes.find(t => t.id === rule.value)?.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">{rule.reason}</p>
                        <p className="text-xs text-muted-foreground mt-1">Created on {rule.createdAt.toLocaleDateString()}</p>
                      </div>
                      <div className="space-x-2">
                        <Button
                          variant={rule.active ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleToggleRule(rule.id, !rule.active)}
                        >
                          {rule.active ? 'Active' : 'Activate'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No restrictions found</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md mt-1">
                    Create your first restriction by clicking the "Create Restriction" button.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}