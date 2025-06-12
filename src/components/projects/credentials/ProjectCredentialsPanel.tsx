import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Shield, 
  RefreshCw, 
  Check, 
  Ban, 
  Trash2, 
  Clock, 
  AlertTriangle,
  Key
} from "lucide-react";
import { type ProjectCredential } from "@/types/credentials";
import { projectCredentialsService } from "@/services/projectCredentials";
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectCredentialsPanelProps {
  projectId: string;
}

export const ProjectCredentialsPanel: React.FC<ProjectCredentialsPanelProps> = ({ projectId }) => {
  const [credentials, setCredentials] = useState<ProjectCredential[]>([]);
  const [activeCredential, setActiveCredential] = useState<ProjectCredential | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usageLogs, setUsageLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    loadCredentials();
  }, [projectId]);

  const loadCredentials = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const creds = await projectCredentialsService.getCredentialsForProject(projectId);
      setCredentials(creds);
      
      // Set the active credential
      const active = creds.find(c => c.isActive && !c.revokedAt);
      setActiveCredential(active || null);
    } catch (err) {
      console.error("Error loading credentials:", err);
      setError('Failed to load credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewKeyPair = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await projectCredentialsService.generateCredentialsForProject(projectId);
      await loadCredentials();
    } catch (err) {
      console.error("Error generating credentials:", err);
      setError('Failed to generate credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const revokeCredential = async (credentialId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await projectCredentialsService.revokeCredential(credentialId);
      await loadCredentials();
    } catch (err) {
      console.error("Error revoking credential:", err);
      setError('Failed to revoke credential. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteCredential = async (credentialId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await projectCredentialsService.deleteCredential(credentialId);
      await loadCredentials();
    } catch (err) {
      console.error("Error deleting credential:", err);
      setError('Failed to delete credential. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadUsageLogs = async (credentialId: string) => {
    setIsLoadingLogs(true);
    try {
      const logs = await projectCredentialsService.getCredentialUsageLogs(credentialId);
      setUsageLogs(logs);
    } catch (err) {
      console.error("Error loading usage logs:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} (${formatDistanceToNow(date, { addSuffix: true })})`;
  };
  
  const getCredentialStatus = (credential: ProjectCredential) => {
    if (credential.revokedAt) {
      return <Badge variant="destructive">Revoked</Badge>;
    }
    if (credential.isActive) {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Shield className="mr-2 h-5 w-5" /> Project Credentials
            </CardTitle>
            <CardDescription>
              Securely manage token deployment keys for this project
            </CardDescription>
          </div>
          <Button 
            onClick={generateNewKeyPair} 
            disabled={isLoading}
            className="flex items-center"
          >
            {isLoading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Key className="mr-2 h-4 w-4" />
            )}
            Generate New Key
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {credentials.length === 0 && !isLoading ? (
          <div className="p-8 text-center border rounded-lg bg-muted">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
            <h3 className="text-lg font-medium mb-2">No Credentials Found</h3>
            <p className="text-muted-foreground mb-6">
              Generate a key pair to securely deploy tokens with this project.
            </p>
            <Button onClick={generateNewKeyPair} disabled={isLoading}>
              {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate First Key
            </Button>
          </div>
        ) : (
          <>
            {/* Active credential card */}
            {activeCredential && (
              <div className="mb-6 border rounded-lg p-4 bg-muted/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium flex items-center mb-1">
                      <Check className="text-green-500 mr-2 h-4 w-4" /> 
                      Active Deployment Key
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      This is the key that will be used for token deployments
                    </p>
                    <div className="font-mono text-xs bg-secondary p-2 rounded mb-2 break-all">
                      {activeCredential.publicKey}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created {formatDate(activeCredential.createdAt)}
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Ban className="mr-2 h-4 w-4" /> Revoke
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke Deployment Key?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. The key will no longer be usable for deployments.
                          Make sure to generate a new key before revoking this one if you need continued access.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground"
                          onClick={() => revokeCredential(activeCredential.id)}
                        >
                          Revoke Key
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}

            {/* All credentials table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Public Key</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6">
                        <RefreshCw className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    credentials.map((cred) => (
                      <TableRow key={cred.id}>
                        <TableCell>
                          {getCredentialStatus(cred)}
                        </TableCell>
                        <TableCell className="font-mono text-xs break-all">
                          {cred.publicKey.substring(0, 16)}...{cred.publicKey.substring(cred.publicKey.length - 4)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{formatDistanceToNow(new Date(cred.createdAt), { addSuffix: true })}</span>
                          </div>
                          {cred.revokedAt && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Revoked {formatDistanceToNow(new Date(cred.revokedAt), { addSuffix: true })}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => loadUsageLogs(cred.id)}>
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Credential Details</DialogTitle>
                                <DialogDescription>
                                  Full details and usage history for this deployment key.
                                </DialogDescription>
                              </DialogHeader>
                              
                              <Tabs defaultValue="details">
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="details">Details</TabsTrigger>
                                  <TabsTrigger value="logs">Usage Logs</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="details" className="space-y-4 pt-4">
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="text-sm font-medium mb-1">Status</h4>
                                      <div>{getCredentialStatus(cred)}</div>
                                    </div>
                                    
                                    <div>
                                      <h4 className="text-sm font-medium mb-1">Public Key</h4>
                                      <div className="font-mono text-xs bg-secondary p-2 rounded break-all">
                                        {cred.publicKey}
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        This public key can be shared safely. The private key is securely stored.
                                      </p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="text-sm font-medium mb-1">Created</h4>
                                        <div className="text-sm">{formatDate(cred.createdAt)}</div>
                                      </div>
                                      
                                      {cred.revokedAt && (
                                        <div>
                                          <h4 className="text-sm font-medium mb-1">Revoked</h4>
                                          <div className="text-sm">{formatDate(cred.revokedAt)}</div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="logs" className="pt-4">
                                  {isLoadingLogs ? (
                                    <div className="py-8 text-center">
                                      <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                                      <p className="mt-2 text-sm text-muted-foreground">Loading usage logs...</p>
                                    </div>
                                  ) : usageLogs.length === 0 ? (
                                    <div className="py-8 text-center border rounded-lg">
                                      <p className="text-sm text-muted-foreground">No usage logs found for this credential</p>
                                    </div>
                                  ) : (
                                    <div className="border rounded-lg overflow-hidden">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Action</TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Details</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {usageLogs.map(log => (
                                            <TableRow key={log.id}>
                                              <TableCell>
                                                <Badge variant="outline">{log.actionType}</Badge>
                                              </TableCell>
                                              <TableCell>
                                                {formatDistanceToNow(new Date(log.performedAt), { addSuffix: true })}
                                              </TableCell>
                                              <TableCell className="font-mono text-xs">
                                                {log.actionDetails?.dataHash ? (
                                                  <span>Hash: {log.actionDetails.dataHash}</span>
                                                ) : (
                                                  <span className="text-muted-foreground">No details</span>
                                                )}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  )}
                                </TabsContent>
                              </Tabs>
                              
                              <DialogFooter className="flex justify-between items-center">
                                <div>
                                  {!cred.revokedAt && cred.isActive && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="outline">
                                          <Ban className="mr-2 h-4 w-4" /> Revoke Key
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Revoke Deployment Key?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action cannot be undone. The key will no longer be usable for deployments.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            className="bg-destructive text-destructive-foreground"
                                            onClick={() => revokeCredential(cred.id)}
                                          >
                                            Revoke Key
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                </div>
                                
                                <div>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="sm">
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Credential?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action permanently deletes this credential and its associated private key.
                                          This cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-destructive text-destructive-foreground"
                                          onClick={() => deleteCredential(cred.id)}
                                        >
                                          Delete Permanently
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-4 bg-muted p-4 rounded-md">
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <Shield className="mr-2 h-4 w-4" /> Security Information
              </h4>
              <p className="text-xs text-muted-foreground">
                Private keys are securely stored in our key management system and are never exposed or transmitted to the browser. 
                All signing operations happen server-side with strict access controls.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectCredentialsPanel;