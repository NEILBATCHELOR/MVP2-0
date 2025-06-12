import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/infrastructure/database/client";

const ConnectionTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    error?: any;
  } | null>(null);

  const testSupabaseConnection = async () => {
    try {
      // Test connection by performing a simple query
      const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
      
      if (error) {
        throw error;
      }
      
      return {
        success: true,
        message: "Successfully connected to Supabase"
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to connect to Supabase",
        error
      };
    }
  };

  const runTest = async () => {
    setLoading(true);
    try {
      const testResult = await testSupabaseConnection();
      setResult(testResult);
    } catch (error: any) {
      setResult({ success: false, message: error.message, error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Connection Test</CardTitle>
        <CardDescription>
          Test your Supabase connection to diagnose 502 errors
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result && (
          <Alert
            variant={result.success ? "default" : "destructive"}
            className="mb-4"
          >
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>
              {result.message}
              {!result.success && result.error && (
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(result.error, null, 2)}
                </pre>
              )}
            </AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <p className="text-sm">
            This will test the connection to your Supabase backend.
          </p>
          <p className="text-sm">
            If you're seeing 502 errors, this can help identify if there's an
            issue with your Supabase connection.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={runTest} disabled={loading} className="w-full">
          {loading ? "Testing Connection..." : "Test Connection"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ConnectionTest;
