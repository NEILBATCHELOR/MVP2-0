import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldAlert, ShieldCheck, ShieldOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface UserMFAControlsProps {
  userId: string;
  userName: string;
  mfaEnabled: boolean;
  onToggleMFA?: (userId: string, enabled: boolean) => void;
}

const UserMFAControls: React.FC<UserMFAControlsProps> = ({
  userId,
  userName,
  mfaEnabled,
  onToggleMFA,
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState("");
  const [action, setAction] = useState<"enable" | "disable">("disable");

  const handleToggleClick = (newState: boolean) => {
    setAction(newState ? "enable" : "disable");
    setShowDialog(true);
  };

  const handleConfirm = () => {
    if (onToggleMFA) {
      onToggleMFA(userId, action === "enable");
    }
    setShowDialog(false);
    setReason("");
  };

  return (
    <div>
      <div className="flex items-center space-x-2">
        {mfaEnabled ? (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            <span>MFA Enabled</span>
          </Badge>
        ) : (
          <Badge variant="outline" className="flex items-center gap-1">
            <ShieldOff className="h-3 w-3" />
            <span>MFA Disabled</span>
          </Badge>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleToggleClick(!mfaEnabled)}
        >
          {mfaEnabled ? "Disable MFA" : "Enable MFA"}
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "enable"
                ? `Enable MFA for ${userName}`
                : `Disable MFA for ${userName}`}
            </DialogTitle>
            <DialogDescription>
              {action === "enable"
                ? "This will require the user to set up two-factor authentication."
                : "This will remove the two-factor authentication requirement for this user."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="reason" className="mb-2 block">
              Reason for {action === "enable" ? "enabling" : "disabling"} MFA
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for this change..."
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              variant={action === "disable" ? "destructive" : "default"}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserMFAControls;
