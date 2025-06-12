import React, { useState, useEffect } from "react";
import { supabase } from "@/infrastructure/database/client";
import { logAction } from "@/infrastructure/auditLogger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckIcon, AlertTriangle, Shield } from "lucide-react";
import { useAuth } from "@/infrastructure/auth/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

// ... existing code ... 