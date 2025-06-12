import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Camera, X, Maximize2, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Mock QR code scanning functionality
// In a real app, you would use a library like react-qr-reader
interface QrCodeScannerProps {
  onScan: (address: string) => void;
  onClose: () => void;
}

export const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ onScan, onClose }) => {
  const [hasCamera, setHasCamera] = useState(true);
  const [scanError, setScanError] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    // Mock camera check - in a real app, you would check for camera availability
    const checkCamera = async () => {
      try {
        // Simulate checking for camera
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Randomly simulate camera availability (for demo purposes)
        const cameraAvailable = Math.random() > 0.3;
        setHasCamera(cameraAvailable);
        
        if (cameraAvailable) {
          // Simulate camera permission request
          const permissionGranted = Math.random() > 0.2;
          if (!permissionGranted) {
            setPermissionDenied(true);
          }
        }
      } catch (error) {
        setHasCamera(false);
      }
    };
    
    checkCamera();
  }, []);

  // Mock QR code scan
  const handleScan = () => {
    // Simulate scanning delay
    setTimeout(() => {
      // Randomly simulate a successful scan or error
      if (Math.random() > 0.3) {
        // Success
        const mockEthAddress = "0x" + Array.from({length: 40}, () => 
          "0123456789abcdef"[Math.floor(Math.random() * 16)]
        ).join("");
        
        onScan(mockEthAddress);
      } else {
        // Error
        setScanError("Could not recognize a valid wallet address in the QR code");
      }
    }, 1500);
  };

  // Handle manual address input
  const handleManualSubmit = () => {
    if (manualAddress.startsWith("0x") && manualAddress.length >= 42) {
      onScan(manualAddress);
    } else {
      setScanError("Please enter a valid wallet address");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
          <DialogDescription>
            Position the QR code in the camera frame to scan a wallet address
          </DialogDescription>
        </DialogHeader>
        
        {permissionDenied ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Camera access denied</AlertTitle>
              <AlertDescription>
                Please allow camera access in your browser settings to scan QR codes.
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-center">
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {hasCamera ? (
              <div className="flex flex-col items-center">
                {/* Mock camera view */}
                <div className="bg-muted w-full aspect-square max-w-sm relative flex flex-col items-center justify-center border border-dashed rounded-md">
                  <Camera className="h-12 w-12 text-muted-foreground mb-2" />
                  <Maximize2 className="h-24 w-24 absolute text-primary/20" />
                  <p className="text-sm text-muted-foreground">
                    {scanError ? "Scanning failed" : "Align QR code within frame"}
                  </p>
                </div>
                
                {scanError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Scanning Error</AlertTitle>
                    <AlertDescription>
                      {scanError}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={onClose}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleScan}>
                    <Camera className="h-4 w-4 mr-2" />
                    Scan
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Camera not available</AlertTitle>
                  <AlertDescription>
                    We couldn't access your camera. You can enter the address manually or upload a QR code image.
                  </AlertDescription>
                </Alert>
                
                <div className="grid gap-4">
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload QR Code Image
                  </Button>
                </div>
              </div>
            )}
            
            <div className="border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="wallet-address">Or enter wallet address manually</Label>
                <div className="flex gap-2">
                  <Input
                    id="wallet-address"
                    placeholder="0x..."
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                  />
                  <Button onClick={handleManualSubmit} type="button">Submit</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};