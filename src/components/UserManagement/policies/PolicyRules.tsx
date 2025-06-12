import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/infrastructure/database/client";
import { logActivity } from "@/infrastructure/audit";
import { formatRoleForDisplay, normalizeRole } from "@/utils/auth/roleUtils";

// Local storage keys for consensus config
const CONSENSUS_TYPE_KEY = "consensus_type";
const ELIGIBLE_ROLES_KEY = "eligible_roles";
const REQUIRED_APPROVALS_KEY = "required_approvals";
const SELECTED_SIGNERS_KEY = "selected_signers";
const SELECTED_SIGNERS_INFO_KEY = "selected_signers_info";

interface ApproverConfig {
  consensusType: string;
  selectedSigners: string[];
}

interface Signer {
  id: string;
  name: string;
  type: "role" | "user" | "header";
  description?: string;
  email?: string;
  role?: string;
}

interface ApproverRulesProps {
  onSave: (config: ApproverConfig) => Promise<void>;
}

export const ApproverRules: React.FC<ApproverRulesProps> = ({ onSave }) => {
  const consensusOptions = [
    { value: "2of3", label: "2 of 3 Consensus", required: 2, total: 3 },
    { value: "3of4", label: "3 of 4 Consensus", required: 3, total: 4 },
    { value: "3of5", label: "3 of 5 Consensus", required: 3, total: 5 },
    { value: "4of5", label: "4 of 5 Consensus", required: 4, total: 5 },
  ];

  const [config, setConfig] = useState<ApproverConfig>({
    consensusType: consensusOptions[0].value,
    selectedSigners: [],
  });

  const [availableSigners, setAvailableSigners] = useState<Signer[]>([]);
  const [loading, setLoading] = useState(true);

  // Get the current consensus option
  const currentConsensusOption = consensusOptions.find(
    (opt) => opt.value === config.consensusType,
  );

  // Validate and update config when consensus type changes
  useEffect(() => {
    if (
      currentConsensusOption &&
      config.selectedSigners.length > currentConsensusOption.total
    ) {
      setConfig((prev) => ({
        ...prev,
        selectedSigners: prev.selectedSigners.slice(
          0,
          currentConsensusOption.total,
        ),
      }));
    }
  }, [config.consensusType, currentConsensusOption]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Reset config to empty state first
        setConfig({
          consensusType: "2of3",
          selectedSigners: [],
        });

        // Try to load from local storage first
        const storedConsensusType = localStorage.getItem(CONSENSUS_TYPE_KEY);
        const storedEligibleRoles = localStorage.getItem(ELIGIBLE_ROLES_KEY);
        const storedSigners = localStorage.getItem(SELECTED_SIGNERS_KEY);

        console.log("Initial load - stored values:", {
          storedConsensusType,
          storedEligibleRoles,
          storedSigners,
        });

        // Clear all stored values to ensure fresh start
        localStorage.removeItem(CONSENSUS_TYPE_KEY);
        localStorage.removeItem(ELIGIBLE_ROLES_KEY);
        localStorage.removeItem(REQUIRED_APPROVALS_KEY);
        localStorage.removeItem(SELECTED_SIGNERS_KEY);
        localStorage.removeItem(SELECTED_SIGNERS_INFO_KEY);

        // Fetch roles
        const { data: roles, error: rolesError } = await supabase
          .from("roles")
          .select("name, description");

        if (rolesError) throw rolesError;

        // Fetch users with their roles
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("id, name, email, role");

        if (usersError) throw usersError;

        // Group users by role
        const usersByRole = users?.reduce<Record<string, any[]>>(
          (acc, user) => {
            const role = (user as { role?: string }).role || "No Role";
            if (!acc[role]) acc[role] = [];
            acc[role].push(user);
            return acc;
          },
          {} as Record<string, any[]>
        );

        // Create signers array with roles first, then grouped users
        const signers: Signer[] = [
          // Add roles first
          ...(roles?.map((role) => ({
            id: role.name,
            name: role.name,
            type: "role" as const,
            description: role.description,
          })) || []),
          // Add users grouped by role
          ...Object.entries(usersByRole || {}).flatMap(([role, roleUsers]) => [
            // Add role header
            {
              id: `header-${role}`,
              name: role,
              type: "header" as const,
              description: `${roleUsers.length} users`,
            },
            // Add users under that role
            ...roleUsers.map((user: any) => ({
              id: user.id,
              name: user.name ?? user.email,
              type: "user" as const,
              email: user.email,
              role: role,
            })),
          ]),
        ];

        setAvailableSigners(signers);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      // Get both total and required from consensus type
      const currentOption = consensusOptions.find(
        (opt) => opt.value === config.consensusType,
      );
      if (!currentOption) throw new Error("Invalid consensus type");

      // Ensure we have the correct number of approvers selected
      if (config.selectedSigners.length < currentOption.total) {
        throw new Error(
          `Please select ${currentOption.total} approvers to continue`,
        );
      }

      if (config.selectedSigners.length > currentOption.total) {
        // Trim excess selections
        config.selectedSigners = config.selectedSigners.slice(
          0,
          currentOption.total,
        );
      }

      // Save to localStorage with both total and required
      localStorage.setItem(CONSENSUS_TYPE_KEY, config.consensusType);
      localStorage.setItem(
        ELIGIBLE_ROLES_KEY,
        JSON.stringify(config.selectedSigners),
      );
      localStorage.setItem(
        REQUIRED_APPROVALS_KEY,
        currentOption.required.toString(),
      );

      // Save selected user IDs
      localStorage.setItem(
        SELECTED_SIGNERS_KEY,
        JSON.stringify(config.selectedSigners),
      );

      // Save detailed info about selected users with proper role formatting
      const selectedUsers = availableSigners
        .filter(
          (signer) =>
            signer.type === "user" &&
            config.selectedSigners.includes(signer.id),
        )
        .map((signer) => {
          // Format role name for display
          const roleDisplay = signer.role
            ? formatRoleForDisplay(signer.role)
            : "Unknown";

          return {
            id: signer.id,
            name: signer.name,
            role: normalizeRole(signer.role || "Unknown"),
            roleDisplay,
            email: signer.email,
          };
        });

      localStorage.setItem(
        SELECTED_SIGNERS_INFO_KEY,
        JSON.stringify(selectedUsers),
      );

      await onSave(config);
      await logActivity({
        action: "update_approver_rules",
        details: {
          consensusType: config.consensusType,
          selectedSigners: config.selectedSigners,
          selectedUsers,
        },
        entity_type: "approver_rules",
        status: "success",
      });
    } catch (error) {
      console.error("Error saving approver configuration:", error);
      alert(
        error instanceof Error ? error.message : "Failed to save configuration",
      );
      await logActivity({
        action: "update_approver_rules",
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
          consensusType: config.consensusType,
          selectedSigners: config.selectedSigners,
        },
        entity_type: "approver_rules",
        status: "error",
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Required Approvers</h2>
          <p className="text-sm text-gray-500">
            Configure the consensus requirements for transaction approvals
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Consensus Type</Label>
            <Select
              value={config.consensusType}
              onValueChange={(value) =>
                setConfig({ ...config, consensusType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {consensusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Required Signers by Role
            </Label>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              {availableSigners.map((signer) => {
                if (signer.type === "header") {
                  // Format role header properly (e.g., "superAdmin" → "Super Admin")
                  const roleDisplay = formatRoleForDisplay(signer.name);

                  const roleUsers = availableSigners.filter(
                    (s) => s.type === "user" && s.role === signer.name,
                  );

                  // Count how many users of this role are selected
                  const selectedCount = roleUsers.filter((s) =>
                    config.selectedSigners.includes(s.id),
                  ).length;

                  const allSelected =
                    roleUsers.length > 0 && selectedCount === roleUsers.length;
                  const someSelected =
                    selectedCount > 0 && selectedCount < roleUsers.length;

                  return (
                    <div
                      key={signer.id}
                      className="mt-6 mb-3 pt-4 border-t border-gray-200 first:mt-0 first:pt-0 first:border-t-0"
                    >
                      <h3 className="text-sm font-semibold text-gray-800 flex items-center justify-between">
                        <span className="flex items-center">
                          {roleDisplay}
                          <span className="ml-2 text-xs text-gray-500">
                            ({roleUsers.length}{" "}
                            {roleUsers.length === 1 ? "user" : "users"})
                          </span>
                          {someSelected && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              {selectedCount} selected
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          className={`text-xs ${allSelected ? "text-red-600 hover:text-red-800" : "text-blue-600 hover:text-blue-800"}`}
                          onClick={() => {
                            // Get all users of this role
                            const roleUsers = availableSigners
                              .filter(
                                (s) =>
                                  s.type === "user" && s.role === signer.name,
                              )
                              .map((s) => s.id);

                            // Select/deselect all users of this role
                            const allSelected = roleUsers.every((id) =>
                              config.selectedSigners.includes(id),
                            );

                            if (allSelected) {
                              // Deselect all users of this role
                              setConfig({
                                ...config,
                                selectedSigners: config.selectedSigners.filter(
                                  (id) => !roleUsers.includes(id),
                                ),
                              });
                            } else {
                              // Select all users of this role, up to the total limit
                              const currentSelected =
                                config.selectedSigners.filter(
                                  (id) => !roleUsers.includes(id),
                                );
                              const availableSlots =
                                (currentConsensusOption?.total || 0) -
                                currentSelected.length;
                              const usersToAdd = roleUsers.slice(
                                0,
                                availableSlots,
                              );

                              setConfig({
                                ...config,
                                selectedSigners: [
                                  ...currentSelected,
                                  ...usersToAdd,
                                ],
                              });
                            }
                          }}
                        >
                          {allSelected ? "Deselect All" : "Select All"}
                        </button>
                      </h3>
                    </div>
                  );
                }

                return (
                  <div
                    key={signer.id}
                    className="flex items-center justify-between p-2 my-1 hover:bg-gray-100 rounded-md transition-colors ml-4"
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={signer.id}
                        checked={config.selectedSigners.includes(signer.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            // Only allow selection if we haven't reached the total limit
                            if (
                              config.selectedSigners.length <
                              (currentConsensusOption?.total || 0)
                            ) {
                              setConfig({
                                ...config,
                                selectedSigners: [
                                  ...config.selectedSigners,
                                  signer.id,
                                ],
                              });
                            }
                          } else {
                            setConfig({
                              ...config,
                              selectedSigners: config.selectedSigners.filter(
                                (id) => id !== signer.id,
                              ),
                            });
                          }
                        }}
                        disabled={
                          !config.selectedSigners.includes(signer.id) &&
                          config.selectedSigners.length >=
                            (currentConsensusOption?.total || 0)
                        }
                      />
                      <div className="grid gap-1 leading-none">
                        <label
                          htmlFor={signer.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {signer.name}
                        </label>
                        {signer.email && (
                          <p className="text-xs text-gray-500">
                            {signer.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {config.selectedSigners.includes(signer.id) && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-sm text-gray-500 mt-2 flex justify-between">
              <span>
                Select {currentConsensusOption?.total || 0} approvers (requires{" "}
                {currentConsensusOption?.required || 0} to approve actions)
              </span>
              <span
                className={`font-medium ${
                  config.selectedSigners.length === 0
                    ? "text-gray-600"
                    : config.selectedSigners.length ===
                        (currentConsensusOption?.total || 0)
                      ? "text-green-600"
                      : config.selectedSigners.length >
                          (currentConsensusOption?.total || 0)
                        ? "text-red-600"
                        : "text-amber-600"
                }`}
              >
                Currently selected: {config.selectedSigners.length}/
                {currentConsensusOption?.total || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </Card>
  );
};

export default ApproverRules;
