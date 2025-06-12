import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShieldX, Home, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UnauthorizedPageProps {
  message?: string;
  returnPath?: string;
}

const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({ 
  message = "You don't have permission to access this page",
  returnPath = "/"
}) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate(returnPath);
  };

  const handleLogin = () => {
    navigate("/auth/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <ShieldX className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
          <CardDescription>
            You are not authorized to view this page
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
          
          <div className="flex flex-col gap-3">
            <Button onClick={handleGoHome} className="w-full" variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
            <Button onClick={handleLogin} className="w-full">
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnauthorizedPage;
