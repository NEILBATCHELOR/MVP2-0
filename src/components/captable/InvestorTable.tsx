import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Checkbox } from "../ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Search,
  ChevronDown,
  Filter,
  Download,
  Plus,
} from "lucide-react";

interface Investor {
  id: string;
  name: string;
  email: string;
  company?: string;
  subscriptionAmount: number;
  tokenAllocation: number;
  status: "pending" | "confirmed" | "rejected";
  dateAdded: string;
  securityType: "equity" | "convertible_note" | "safe" | "token";
  investmentDate: string;
  conversionCap?: number;
  conversionDiscount?: number;
  interestRate?: number;
  maturityDate?: string;
  proRataRights?: boolean;
  votingRights?: boolean;
  kycStatus?: "approved" | "pending" | "failed" | "not_started";
  paymentStatus?: "paid" | "pending" | "failed";
  notes?: string;
}

interface InvestorsTableProps {
  investors?: Investor[];
  onEdit?: (investor: Investor) => void;
  onDelete?: (investorId: string) => void;
  onBulkAction?: (action: string, selectedIds: string[]) => void;
  onAddInvestor?: () => void;
}

const InvestorsTable: React.FC<InvestorsTableProps> = ({
  investors = [
    {
      id: "1",
      name: "John Smith",
      email: "john.smith@example.com",
      company: "Acme Ventures",
      subscriptionAmount: 50000,
      tokenAllocation: 5000,
      status: "confirmed",
      dateAdded: "2023-05-15",
      securityType: "equity",
      investmentDate: "2023-05-15",
      votingRights: true,
      proRataRights: true,
      kycStatus: "approved",
      paymentStatus: "paid",
      notes: "Lead investor in seed round",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
      company: "SJ Capital",
      subscriptionAmount: 25000,
      tokenAllocation: 2500,
      status: "pending",
      dateAdded: "2023-05-18",
      securityType: "safe",
      investmentDate: "2023-05-18",
      conversionCap: 5000000,
      conversionDiscount: 20,
      kycStatus: "pending",
      paymentStatus: "pending",
      notes: "",
    },
    {
      id: "3",
      name: "Michael Brown",
      email: "michael.b@example.com",
      company: "Brown Investments LLC",
      subscriptionAmount: 100000,
      tokenAllocation: 10000,
      status: "confirmed",
      dateAdded: "2023-05-10",
      securityType: "convertible_note",
      investmentDate: "2023-05-10",
      conversionCap: 8000000,
      conversionDiscount: 15,
      interestRate: 5,
      maturityDate: "2025-05-10",
      kycStatus: "approved",
      paymentStatus: "paid",
      notes: "Strategic investor with industry connections",
    },
    {
      id: "4",
      name: "Emily Davis",
      email: "emily.d@example.com",
      company: "Davis Family Office",
      subscriptionAmount: 75000,
      tokenAllocation: 7500,
      status: "rejected",
      dateAdded: "2023-05-12",
      securityType: "equity",
      investmentDate: "2023-05-12",
      votingRights: false,
      proRataRights: false,
      kycStatus: "failed",
      paymentStatus: "failed",
      notes: "KYC verification failed",
    },
    {
      id: "5",
      name: "Robert Wilson",
      email: "robert.w@example.com",
      company: "Wilson Tech Ventures",
      subscriptionAmount: 30000,
      tokenAllocation: 3000,
      status: "pending",
      dateAdded: "2023-05-20",
      securityType: "token",
      investmentDate: "2023-05-20",
      kycStatus: "not_started",
      paymentStatus: "pending",
      notes: "Interested in token allocation only",
    },
  ],
  onEdit = () => {},
  onDelete = () => {},
  onBulkAction = () => {},
  onAddInvestor = () => {},
}) => {
  const [selectedInvestors, setSelectedInvestors] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [investorToDelete, setInvestorToDelete] = useState<string | null>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvestors(investors.map((investor) => investor.id));
    } else {
      setSelectedInvestors([]);
    }
  };

  const handleSelectInvestor = (investorId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvestors((prev) => [...prev, investorId]);
    } else {
      setSelectedInvestors((prev) => prev.filter((id) => id !== investorId));
    }
  };

  const handleDeleteClick = (investorId: string) => {
    setInvestorToDelete(investorId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (investorToDelete) {
      onDelete(investorToDelete);
      setInvestorToDelete(null);
    }
    setIsDeleteDialogOpen(false);
  };

  const filteredInvestors = investors.filter(
    (investor) =>
      investor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      investor.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "not_started":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="w-full bg-white rounded-md shadow">
      <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search investors..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            <span>Filter</span>
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button
            size="sm"
            className="flex items-center gap-1"
            onClick={onAddInvestor}
          >
            <Plus className="h-4 w-4" />
            <span>Add Investor</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableCaption>List of investors in the cap table</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={
                    selectedInvestors.length === investors.length &&
                    investors.length > 0
                  }
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
              </TableHead>
              <TableHead>Investor</TableHead>
              <TableHead>Security Type</TableHead>
              <TableHead className="text-right">Subscription Amount</TableHead>
              <TableHead className="text-right">Token Allocation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>KYC Status</TableHead>
              <TableHead>Investment Date</TableHead>
              <TableHead className="w-10">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvestors.length > 0 ? (
              filteredInvestors.map((investor) => (
                <TableRow key={investor.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedInvestors.includes(investor.id)}
                      onCheckedChange={(checked) =>
                        handleSelectInvestor(investor.id, !!checked)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{investor.name}</div>
                      <div className="text-sm text-gray-500">
                        {investor.email}
                      </div>
                      {investor.company && (
                        <div className="text-xs text-gray-400">
                          {investor.company}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">
                      {investor.securityType.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${investor.subscriptionAmount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {investor.tokenAllocation.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(investor.status)}`}
                    >
                      {investor.status.charAt(0).toUpperCase() +
                        investor.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getKycStatusColor(investor.kycStatus || "not_started")}`}
                    >
                      {(investor.kycStatus || "not_started")
                        .split("_")
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() + word.slice(1),
                        )
                        .join(" ")}
                    </span>
                  </TableCell>
                  <TableCell>{investor.investmentDate}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(investor)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(investor.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-6 text-gray-500"
                >
                  No investors found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedInvestors.length > 0 && (
        <div className="p-4 border-t flex items-center justify-between bg-gray-50">
          <div className="text-sm">
            {selectedInvestors.length} investor
            {selectedInvestors.length !== 1 ? "s" : ""} selected
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction("status", selectedInvestors)}
            >
              Update Status
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onBulkAction("delete", selectedInvestors)}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete this investor? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvestorsTable;
