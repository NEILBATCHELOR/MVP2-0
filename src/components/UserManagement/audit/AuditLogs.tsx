import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Import from the correct location
import { verifySignature } from "@/utils/wallet/crypto";
import { getAuditLogs, exportAuditLogs } from "@/infrastructure/auditLogger";

// Define AuditLog interface if it's not exported from auditLogger
export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  status: string;
  signature?: string;
  verified?: boolean;
}

interface AuditLogsProps {
  logs?: AuditLog[];
  onExport?: (format: "csv" | "json") => void;
}

const AuditLogs = ({
  logs: initialLogs,
  onExport = async (format) => {
    try {
      const data = await exportAuditLogs(format);
      const blob = new Blob([data], {
        type: format === "json" ? "application/json" : "text/csv",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Failed to export logs as ${format}:`, error);
    }
  },
}: AuditLogsProps) => {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs || defaultLogs);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const fetchedLogs = await getAuditLogs();
      if (fetchedLogs.length > 0) {
        setLogs(fetchedLogs);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <Card className="p-6 bg-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Audit Logs</h2>
          <p className="text-gray-500">
            System activity and compliance tracking
          </p>
        </div>
        <div className="space-x-2 flex items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchLogs}
            disabled={isLoading}
            className="mr-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            variant="outline"
            onClick={() => onExport("csv")}
            className="space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => onExport("json")}
            className="space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export JSON</span>
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id || `${log.timestamp}-${log.action}`}>
                <TableCell>
                  {new Date(log.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.user}</TableCell>
                <TableCell>{log.details}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span
                      className={
                        log.status === "Success"
                          ? "text-green-600"
                          : "text-amber-600"
                      }
                    >
                      {log.status}
                    </span>
                    {log.signature && (
                      <Badge
                        variant="outline"
                        className={log.verified ? "bg-green-50" : "bg-red-50"}
                      >
                        {log.verified ? "Verified" : "Unverified"}
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-4 text-gray-500"
                >
                  No audit logs found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

const defaultLogs: AuditLog[] = [
  {
    id: "1",
    timestamp: "2024-03-20T14:30:00.000Z",
    action: "User Creation",
    user: "admin@example.com",
    details: "Created new user account for john@example.com",
    status: "Success",
  },
  {
    id: "2",
    timestamp: "2024-03-20T14:35:00.000Z",
    action: "Role Change",
    user: "admin@example.com",
    details: "Modified permissions for user jane@example.com",
    status: "Pending Approval",
  },
  {
    id: "3",
    timestamp: "2024-03-20T14:40:00.000Z",
    action: "Key Rotation",
    user: "system",
    details: "Automatic key rotation for bob@example.com",
    status: "Success",
  },
];

export default AuditLogs;
