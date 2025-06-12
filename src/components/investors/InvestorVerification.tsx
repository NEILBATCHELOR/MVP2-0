import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const InvestorVerification = () => {
  const navigate = useNavigate();
  const [emailVerificationStep, setEmailVerificationStep] = useState<
    "pending" | "completed"
  >("pending");
  const [twoFactorStep, setTwoFactorStep] = useState<"pending" | "completed">(
    "pending",
  );
  const [emailCode, setEmailCode] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Mock QR code URL for 2FA setup
  const qrCodeUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=qrcode";
  const backupCodes = [
    "ABCD-EFGH-IJKL",
    "MNOP-QRST-UVWX",
    "YZAB-CDEF-GHIJ",
    "KLMN-OPQR-STUV",
  ];

  const handleEmailVerification = () => {
    if (emailCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    // Mock verification success
    setEmailVerificationStep("completed");
    setError(null);
  };

  const handleTwoFactorSetup = () => {
    if (twoFactorCode.length < 6) {
      setError("Please enter a valid authentication code");
      return;
    }

    // Mock 2FA setup success
    setTwoFactorStep("completed");
    setError(null);
  };

  const handleResendCode = () => {
    // Mock resend code functionality
    setCountdown(60);
    setError(null);

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleContinue = () => {
    if (
      emailVerificationStep === "completed" &&
      twoFactorStep === "completed"
    ) {
      navigate("/investor/profile");
    } else {
      setError("Please complete both verification steps before continuing");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">Guardian SPV</h1>
          </div>
          <div className="text-sm text-gray-500">
            Need help?{" "}
            <a href="#" className="text-primary">
              Contact support
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">
              Email Verification & Two-Factor Authentication
            </h1>
            <span className="text-sm font-medium text-gray-500">
              Step 2 of 4
            </span>
          </div>
          <p className="text-gray-600 mb-4">
            Secure your account with email verification and two-factor
            authentication
          </p>
          <Progress value={50} className="h-2" />
        </div>

        <div className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Email Verification Section */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">
                  Step 1: Email Verification
                </CardTitle>
                {emailVerificationStep === "completed" && (
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                )}
              </div>
              <p className="text-gray-600">
                We've sent a 6-digit verification code to your email. Please
                enter it below.
              </p>
            </CardHeader>
            <CardContent>
              {emailVerificationStep === "pending" ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="emailCode">Verification Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="emailCode"
                        value={emailCode}
                        onChange={(e) =>
                          setEmailCode(
                            e.target.value.replace(/[^0-9]/g, "").slice(0, 6),
                          )
                        }
                        placeholder="Enter 6-digit code"
                        className="text-center tracking-widest text-lg"
                        maxLength={6}
                      />
                      <Button
                        variant="outline"
                        onClick={handleResendCode}
                        disabled={countdown > 0}
                      >
                        {countdown > 0
                          ? `Resend (${countdown}s)`
                          : "Resend Code"}
                      </Button>
                    </div>
                  </div>
                  <Button onClick={handleEmailVerification}>
                    Verify Email
                  </Button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-100 rounded-md p-4 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-green-800">Email successfully verified!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Two-Factor Authentication Section */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">
                  Step 2: Two-Factor Authentication Setup
                </CardTitle>
                {twoFactorStep === "completed" && (
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                )}
              </div>
              <p className="text-gray-600">
                Scan the QR code with an authenticator app like Google
                Authenticator or Authy.
              </p>
            </CardHeader>
            <CardContent>
              {twoFactorStep === "pending" ? (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="bg-white p-4 border rounded-md inline-block">
                        <img
                          src={qrCodeUrl}
                          alt="QR Code"
                          className="w-40 h-40"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">Backup Codes</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Save these backup codes in a secure place. You can use
                        them to sign in if you lose access to your authenticator
                        app.
                      </p>
                      <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
                        {backupCodes.map((code, index) => (
                          <div key={index} className="mb-1">
                            {code}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="twoFactorCode">Authentication Code</Label>
                    <Input
                      id="twoFactorCode"
                      value={twoFactorCode}
                      onChange={(e) =>
                        setTwoFactorCode(
                          e.target.value.replace(/[^0-9]/g, "").slice(0, 6),
                        )
                      }
                      placeholder="Enter the 6-digit code from your authenticator app"
                      className="text-center tracking-widest text-lg"
                      maxLength={6}
                    />
                  </div>
                  <Button onClick={handleTwoFactorSetup}>
                    Verify & Set Up 2FA
                  </Button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-100 rounded-md p-4 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-green-800">
                    Two-factor authentication successfully set up!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleContinue}
              disabled={
                !(
                  emailVerificationStep === "completed" &&
                  twoFactorStep === "completed"
                )
              }
              size="lg"
            >
              Continue
            </Button>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Guardian SPV. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default InvestorVerification;
