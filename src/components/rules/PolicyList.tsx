import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Search,
  Plus,
  Filter,
  SortDesc,
  SortAsc,
  Tag,
  Globe,
  FileText,
  Download,
  Copy,
} from "lucide-react";
import PolicyCard from "./PolicyCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import PolicyExportDialog from "./PolicyExportDialog";

interface Policy {
  id: string;
  name: string;
  status: "active" | "inactive" | "draft" | "pending";
  createdAt: string;
  modifiedAt: string;
  description: string;
  type: string;
  jurisdiction: string;
  effectiveDate: string;
  expirationDate?: string;
  tags: string[];
}

interface PolicyListProps {
  policies?: Policy[];
  searchTerm?: string;
  onCreatePolicy?: () => void;
  onEditPolicy?: (id: string) => void;
  onDeletePolicy?: (id: string) => void;
  onViewPolicy?: (id: string) => void;
  onDuplicatePolicy?: (id: string) => void;
}

const PolicyList = ({
  policies = [],
  searchTerm = "",
  onCreatePolicy = () => {},
  onEditPolicy = () => {},
  onDeletePolicy = () => {},
  onViewPolicy = () => {},
  onDuplicatePolicy = () => {},
}: PolicyListProps) => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortField, setSortField] = useState<
    "name" | "createdAt" | "modifiedAt" | "effectiveDate"
  >("modifiedAt");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>([]);

  // Get unique policy types, jurisdictions, and tags
  const policyTypes = [
    "all",
    ...new Set(policies.map((policy) => policy.type)),
  ];
  const jurisdictions = [
    "all",
    ...new Set(policies.map((policy) => policy.jurisdiction)),
  ];
  const allTags = Array.from(
    new Set(policies.flatMap((policy) => policy.tags || [])),
  );

  // Filter policies based on search term and filters
  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch =
      policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || policy.status === statusFilter;
    const matchesType = typeFilter === "all" || policy.type === typeFilter;
    const matchesJurisdiction =
      jurisdictionFilter === "all" ||
      policy.jurisdiction === jurisdictionFilter;

    // Check if policy has any of the selected tags (if any tags are selected)
    const matchesTags =
      tagFilter.length === 0 ||
      tagFilter.some((tag) => policy.tags && policy.tags.includes(tag));

    return (
      matchesSearch &&
      matchesStatus &&
      matchesType &&
      matchesJurisdiction &&
      matchesTags
    );
  });

  // Sort policies based on sort field and order
  const sortedPolicies = [...filteredPolicies].sort((a, b) => {
    if (sortField === "name") {
      return sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else {
      const dateA = new Date(a[sortField]);
      const dateB = new Date(b[sortField]);
      return sortOrder === "asc"
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    }
  });

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const toggleTagFilter = (tag: string) => {
    setTagFilter((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const clearAllFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setJurisdictionFilter("all");
    setTagFilter([]);
  };

  const getPolicyTypeName = (type: string) => {
    if (type === "all") return "All Types";

    const typeMap: Record<string, string> = {
      transfer_limit: "Transfer Limit",
      kyc_verification: "KYC Verification",
      restricted_assets: "Restricted Assets",
      multi_signature: "Multi-Signature Approval",
      dormant_account: "Dormant Account",
      risk_assessment: "Risk Assessment",
      transaction_monitoring: "Transaction Monitoring",
      custom: "Custom Policy",
    };
    return (
      typeMap[type] ||
      (type
        ? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "")
    );
  };

  const getJurisdictionName = (jurisdiction: string) => {
    if (jurisdiction === "all") return "All Jurisdictions";

    const jurisdictionMap: Record<string, string> = {
      global: "Global",
      us: "United States",
      eu: "European Union",
      uk: "United Kingdom",
      asia_pacific: "Asia Pacific",
      custom: "Custom Jurisdiction",
    };
    return (
      jurisdictionMap[jurisdiction] ||
      (jurisdiction
        ? jurisdiction
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : "")
    );
  };

  const isFiltered =
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    jurisdictionFilter !== "all" ||
    tagFilter.length > 0;

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-sm">
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Compliance Policies
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowExportDialog(true)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={onCreatePolicy}
            className="flex items-center gap-2 bg-[#0f172b] hover:bg-[#0f172b]/90"
          >
            <Plus className="h-4 w-4" />
            Create New Policy
          </Button>
        </div>
      </div>

      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <div className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Policy Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {policyTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {getPolicyTypeName(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={jurisdictionFilter}
            onValueChange={setJurisdictionFilter}
          >
            <SelectTrigger className="w-[160px]">
              <div className="flex items-center">
                <Globe className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Jurisdiction" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {jurisdictions.map((jurisdiction) => (
                <SelectItem key={jurisdiction} value={jurisdiction}>
                  {getJurisdictionName(jurisdiction)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                Tags
                {tagFilter.length > 0 && (
                  <Badge className="ml-1 bg-blue-100 text-blue-800 hover:bg-blue-100">
                    {tagFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {allTags.length > 0 ? (
                <>
                  {allTags.map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag}
                      checked={tagFilter.includes(tag)}
                      onCheckedChange={() => toggleTagFilter(tag)}
                    >
                      {tag}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {tagFilter.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setTagFilter([])}>
                        Clear tag filters
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              ) : (
                <DropdownMenuItem disabled>No tags available</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {sortOrder === "asc" ? (
                  <SortAsc className="mr-2 h-4 w-4" />
                ) : (
                  <SortDesc className="mr-2 h-4 w-4" />
                )}
                Sort by
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setSortField("name")}
                className={sortField === "name" ? "bg-gray-100" : ""}
              >
                Name
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortField("effectiveDate")}
                className={sortField === "effectiveDate" ? "bg-gray-100" : ""}
              >
                Effective Date
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortField("createdAt")}
                className={sortField === "createdAt" ? "bg-gray-100" : ""}
              >
                Creation Date
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortField("modifiedAt")}
                className={sortField === "modifiedAt" ? "bg-gray-100" : ""}
              >
                Last Modified
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleSortOrder}>
                {sortOrder === "asc" ? "Ascending ↑" : "Descending ↓"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {sortedPolicies.length > 0 ? (
        <div className="space-y-4">
          {sortedPolicies.map((policy) => (
            <PolicyCard
              key={policy.id}
              id={policy.id}
              name={policy.name}
              status={policy.status}
              createdAt={policy.createdAt}
              modifiedAt={policy.modifiedAt}
              description={policy.description}
              type={policy.type}
              jurisdiction={policy.jurisdiction}
              effectiveDate={policy.effectiveDate}
              expirationDate={policy.expirationDate}
              tags={policy.tags}
              onEdit={onEditPolicy}
              onDelete={onDeletePolicy}
              onView={onViewPolicy}
              onDuplicate={onDuplicatePolicy}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">
            No policies found matching your criteria
          </p>
          <Button variant="outline" onClick={clearAllFilters}>
            Clear All Filters
          </Button>
        </div>
      )}

      {policies.length > 0 && sortedPolicies.length > 0 && (
        <div className="mt-6 text-sm text-gray-500 text-right">
          Showing {sortedPolicies.length} of {policies.length} policies
        </div>
      )}

      <PolicyExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        policies={policies}
        selectedPolicyIds={selectedPolicyIds}
      />
    </div>
  );
};

export default PolicyList;
