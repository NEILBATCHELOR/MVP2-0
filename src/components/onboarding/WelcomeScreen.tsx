import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Landmark, Settings, Key, RefreshCw, Shield, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { supabase } from "@/infrastructure/database/client";
import { sessionManager } from "@/infrastructure/sessionManager";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserRoleInfo {
  id: string;
  role_name?: string;
}

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [superAdminPassword, setSuperAdminPassword] = useState("");
  const [superAdminEmail, setSuperAdminEmail] = useState("");
  const [adminError, setAdminError] = useState("");
  const [superAdminError, setSuperAdminError] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [adminLinks, setAdminLinks] = useState<
    { name: string; path: string }[]
  >([
    { name: "Projects", path: "/projects" },
    { name: "Token Builder", path: "/projects/${projectId}/tokens" },
    { name: "Investors", path: "/investors" },
    { name: "Cap Table", path: "/captable" },
    { name: "Activity Monitor", path: "/activity" },
    { name: "Wallet Dashboard", path: "/wallet/dashboard" },
    { name: "Role Management", path: "/role-management" },
    { name: "Rule Management", path: "/rule-management" },
  ]);

  // Secret key combination to open admin dialog (Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        setShowAdminDialog(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLoginClick = (type: "issuer" | "investor") => {
    navigate(`/auth/login?type=${type}`);
  };

  const checkUserRole = async (userId: string): Promise<string | null> => {
    try {
      // First try to get role from user_roles and roles tables
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          roles (
            name
          )
        `)
        .eq('user_id', userId)
        .single();

      if (!roleError && roleData && roleData.roles) {
        // Handle properly typed roles relationship
        const roleName = Array.isArray(roleData.roles) 
          ? roleData.roles[0]?.name 
          : roleData.roles.name;
        
        return roleName || null;
      }

      // Try to read from the raw user record
      const { data: rawData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      // Access role property safely
      const role = rawData && typeof rawData === 'object' && 'role' in rawData 
        ? (rawData as any).role 
        : null;
        
      return role;
    } catch (err) {
      console.error("Error checking user role:", err);
      return null;
    }
  };

  const handleAdminAccess = async () => {
    if (!adminEmail || !adminPassword) {
      setAdminError("Email and password are required");
      return;
    }

    setIsLoading(true);
      setAdminError("");

    try {
      // Attempt to sign in using Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });

      if (error) {
        setAdminError(error.message);
        setIsLoading(false);
        return;
      }

      // Get user role
      const userRole = await checkUserRole(data.user.id);

      if (!userRole) {
        setAdminError("Could not determine user role");
        setIsLoading(false);
        return;
      }

      // Check if user has Admin or Super Admin role
      const normalizedRole = userRole.toLowerCase();
      if (normalizedRole !== "admin" && normalizedRole !== "super admin") {
        setAdminError("You don't have administrative access");
        setIsLoading(false);
        return;
      }

      // Create user session using sessionManager
      const sessionId = await sessionManager.createSession(data.user.id);

      // Log auth event
      await supabase.from("auth_events").insert({
        user_id: data.user.id,
        event_type: "login",
        ip_address: "web-client",
        user_agent: navigator.userAgent,
        metadata: { 
          role: userRole, 
          method: "admin_panel",
          session_id: sessionId 
        }
      });

      // Success - set admin bypass and navigate
      localStorage.setItem("adminBypass", "true");
      
      // Also set super admin bypass if the user is a super admin
      if (normalizedRole === "super admin") {
        localStorage.setItem("superAdminBypass", "true");
      }
      
      setShowAdminDialog(false);
      navigate("/dashboard");
    } catch (err) {
      console.error("Admin login error:", err);
      setAdminError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuperAdminAccess = async () => {
    if (!superAdminEmail || !superAdminPassword) {
      setSuperAdminError("Email and password are required");
      return;
    }

    setIsLoading(true);
    setSuperAdminError("");

    try {
      // Attempt to sign in using Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: superAdminEmail,
        password: superAdminPassword,
      });

      if (error) {
        setSuperAdminError(error.message);
        setIsLoading(false);
        return;
      }

      // Get user role
      const userRole = await checkUserRole(data.user.id);

      if (!userRole) {
        setSuperAdminError("Could not determine user role");
        setIsLoading(false);
        return;
      }

      // Check if user has Super Admin role
      const normalizedRole = userRole.toLowerCase();
      if (normalizedRole !== "super admin") {
        setSuperAdminError("You don't have Super Admin access");
        setIsLoading(false);
        return;
      }

      // Create user session using sessionManager
      const sessionId = await sessionManager.createSession(data.user.id);

      // Log auth event
      await supabase.from("auth_events").insert({
        user_id: data.user.id,
        event_type: "login",
        ip_address: "web-client",
        user_agent: navigator.userAgent,
        metadata: { 
          role: userRole, 
          method: "admin_panel",
          session_id: sessionId 
        }
      });

      // Success - set both admin and super admin bypass flags
      localStorage.setItem("superAdminBypass", "true");
      localStorage.setItem("adminBypass", "true");
      setShowAdminDialog(false);
      navigate("/dashboard");
    } catch (err) {
      console.error("Super Admin login error:", err);
      setSuperAdminError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSessions = async () => {
    setIsLoading(true);
    try {
      // Clear all sessions from the database
      await sessionManager.clearAllSessions();
      // Clear local storage
      localStorage.clear();
      // Clear session storage
      sessionStorage.clear();
      // Clear Supabase session
      await supabase.auth.signOut();
      
      toast({
        title: "Sessions Cleared",
        description: "All user sessions have been cleared successfully.",
      });
    } catch (error) {
      console.error("Error clearing sessions:", error);
      toast({
        title: "Error",
        description: "Failed to clear sessions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    // Validate email
    if (!resetEmail) {
      setResetError("Email is required");
      return;
    }

    setIsLoading(true);
    setResetError("");

    try {
      // Send password reset email via Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setResetError(error.message);
        return;
      }

      // Log password reset request event
      await supabase.from("auth_events").insert({
        event_type: "password_reset_request",
        ip_address: "web-client",
        user_agent: navigator.userAgent,
        metadata: { email: resetEmail }
      });

      // Success
      setResetSuccess(true);
      toast({
        title: "Password reset email sent",
        description: "Please check your email for the password reset link. The link will expire in 24 hours.",
      });

      // Reset form after delay
      setTimeout(() => {
        setShowResetForm(false);
        setResetSuccess(false);
        setResetEmail("");
      }, 3000);
    } catch (err) {
      console.error("Password reset error:", err);
      setResetError("An unexpected error occurred while sending the reset email");
    } finally {
      setIsLoading(false);
    }
  };

  const resetFormContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="resetEmail">Email Address</Label>
        <Input
          id="resetEmail"
          type="email"
          placeholder="Enter your email address"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          autoComplete="username"
        />
      </div>
      
      {resetError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{resetError}</AlertDescription>
        </Alert>
      )}
      
      {resetSuccess && (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            Password reset email sent! Check your inbox.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => setShowResetForm(false)}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handlePasswordReset}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Reset Link"
          )}
        </Button>
      </div>
    </div>
  );

  // Function to clear all admin-related input fields and errors
  const resetAdminInputs = () => {
    setAdminEmail("");
    setAdminPassword("");
    setSuperAdminEmail("");
    setSuperAdminPassword("");
    setAdminError("");
    setSuperAdminError("");
    setShowResetForm(false);
    setResetEmail("");
    setResetError("");
    setResetSuccess(false);
  };

  // Admin Dialog Content
  const adminDialogContent = (
    <Tabs defaultValue="admin" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="admin">Admin</TabsTrigger>
        <TabsTrigger value="superadmin">Super Admin</TabsTrigger>
      </TabsList>
      <TabsContent value="admin">
        <div className="space-y-4 py-4">
          <form onSubmit={(e) => {
            e.preventDefault();
            handleAdminAccess();
          }}>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Email</Label>
              <div className="flex items-center">
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="Enter admin email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminPassword">Password</Label>
              <div className="flex items-center">
                <Key className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="adminPassword"
                  type="password"
                  placeholder="Enter admin password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>
            
            {adminError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{adminError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Quick Access Links</Label>
              <div className="grid grid-cols-2 gap-2">
                {adminLinks.map((link) => (
                  <Button
                    key={link.path}
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      localStorage.setItem("adminBypass", "true");
                      navigate(link.path);
                    }}
                  >
                    {link.name}
                  </Button>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setShowAdminDialog(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Access Admin"
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </TabsContent>
      
      <TabsContent value="superadmin">
        {!showResetForm ? (
          <>
            <div className="space-y-4 py-4">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSuperAdminAccess();
              }}>
                <div className="space-y-2">
                  <Label htmlFor="superAdminEmail">Email</Label>
                  <div className="flex items-center">
                    <Input
                      id="superAdminEmail"
                      type="email"
                      placeholder="Enter super admin email"
                      value={superAdminEmail}
                      onChange={(e) => setSuperAdminEmail(e.target.value)}
                      autoComplete="username"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="superAdminPassword">Password</Label>
                  <div className="flex items-center">
                    <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="superAdminPassword"
                      type="password"
                      placeholder="Enter super admin password"
                      value={superAdminPassword}
                      onChange={(e) => setSuperAdminPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>
                </div>
                
                {superAdminError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{superAdminError}</AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  type="button"
                  variant="link" 
                  className="px-0 text-sm"
                  onClick={() => setShowResetForm(true)}
                  disabled={isLoading}
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Forgot Password?
                </Button>

                <DialogFooter>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => setShowAdminDialog(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Access Super Admin"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </>
        ) : (
          <form onSubmit={(e) => {
            e.preventDefault();
            handlePasswordReset();
          }}>
            {resetFormContent}
          </form>
        )}
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-4xl px-4">
        <div className="text-center mb-10 relative">
          <h1 className="text-4xl font-bold mb-4">Welcome to Chain Capital</h1>
          <p className="text-xl text-gray-600">
            Choose your account type to get started
          </p>
          <button
            className="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-600"
            onClick={() => {
              resetAdminInputs();
              setShowAdminDialog(true);
            }}
            aria-label="Admin Access"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-0">
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <Landmark className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">I'm an Issuer</h2>
                <p className="text-gray-600 mb-6">
                  Raise capital and issue securities
                </p>
                <div className="space-y-3 w-full">
                  <Button
                    className="w-full"
                    onClick={() => navigate("/onboarding/registration")}
                  >
                    Register as Issuer
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleLoginClick("issuer")}
                  >
                    Sign In as Issuer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-0">
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">I'm an Investor</h2>
                <p className="text-gray-600 mb-6">
                  I want to invest in securities
                </p>
                <div className="space-y-3 w-full">
                  <Button
                    className="w-full"
                    onClick={() => navigate("/investor/registration")}
                  >
                    Register as Investor
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleLoginClick("investor")}
                  >
                    Sign In as Investor
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Login Modal - navigate to login page instead */}

      {/* Admin Access Dialog */}
      <Dialog 
        open={showAdminDialog} 
        onOpenChange={(open) => {
          setShowAdminDialog(open);
          if (!open) resetAdminInputs();
        }}
      >
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Administrative Access</DialogTitle>
            <DialogDescription>
              Enter credentials to access administrative features.
            </DialogDescription>
          </DialogHeader>
          {adminDialogContent}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WelcomeScreen;
