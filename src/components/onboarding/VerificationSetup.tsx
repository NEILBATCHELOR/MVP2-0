import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import OnboardingLayout from "./OnboardingLayout";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const VerificationSetup = () => {
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
      navigate("/onboarding/organization");
    } else {
      setError("Please complete both verification steps before continuing");
    }
  };

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={6}
      title="Verify Your Email & Set Up 2FA"
      description="Secure your account with email verification and two-factor authentication"
    >
      <div className="space-y-8">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Email Verification Section */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-medium mb-2">
                Step 1: Email Verification
              </h3>
              <p className="text-gray-600 mb-4">
                We've sent a 6-digit verification code to your email. Please
                enter it below.
              </p>
            </div>
            {emailVerificationStep === "completed" && (
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            )}
          </div>

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
                    {countdown > 0 ? `Resend (${countdown}s)` : "Resend Code"}
                  </Button>
                </div>
              </div>
              <Button onClick={handleEmailVerification}>Verify Email</Button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-100 rounded-md p-4 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-800">Email successfully verified!</p>
            </div>
          )}
        </div>

        {/* Two-Factor Authentication Section */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-medium mb-2">
                Step 2: Two-Factor Authentication Setup
              </h3>
              <p className="text-gray-600 mb-4">
                Scan the QR code with an authenticator app like Google
                Authenticator or Authy.
              </p>
            </div>
            {twoFactorStep === "completed" && (
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            )}
          </div>

          {twoFactorStep === "pending" ? (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="bg-white p-4 border rounded-md inline-block">
                    <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-2">Backup Codes</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Save these backup codes in a secure place. You can use them
                    to sign in if you lose access to your authenticator app.
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
        </div>

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
    </OnboardingLayout>
  );
};

export default VerificationSetup;
