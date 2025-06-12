import React from "react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";

interface LogicalRuleGroup {
  operator: 'AND' | 'OR';
  ruleIds: string[];
}

interface RuleLogicCombinerProps {
  rules: any[];
  logicalGroups: LogicalRuleGroup[];
  onLogicalGroupsChange: (groups: LogicalRuleGroup[]) => void;
}

/**
 * Component to combine rules with AND/OR logic
 */
const RuleLogicCombiner: React.FC<RuleLogicCombinerProps> = ({
  rules,
  logicalGroups,
  onLogicalGroupsChange,
}) => {
  // If there are no rules or only one rule, we don't need logical operators
  if (!rules || rules.length <= 1) {
    return null;
  }

  // Find any existing group that includes all current rules
  const existingGroup = logicalGroups.find(
    (group) =>
      group.ruleIds.length === rules.length &&
      rules.every((rule) => group.ruleIds.includes(rule.id))
  );

  // Current operator (AND or OR) - default to AND
  const currentOperator = existingGroup?.operator || "AND";

  // Handle operator change
  const handleOperatorChange = (value: "AND" | "OR") => {
    // Create a new group with all rules
    const allRuleIds = rules.map((rule) => rule.id);
    
    // Filter out any existing groups involving these rules
    const filteredGroups = logicalGroups.filter(
      (group) => !group.ruleIds.some((id) => allRuleIds.includes(id))
    );
    
    // Add the new comprehensive group
    const newGroups = [
      ...filteredGroups,
      {
        operator: value,
        ruleIds: allRuleIds,
      },
    ];
    
    onLogicalGroupsChange(newGroups);
  };

  return (
    <Card className="p-4 mt-4 bg-slate-50">
      <div className="mb-3">
        <h3 className="text-sm font-medium mb-1">Rule Combination Logic</h3>
        <p className="text-xs text-gray-500">
          Choose how these rules should be combined when evaluating a transaction or event.
        </p>
      </div>

      <RadioGroup
        value={currentOperator}
        onValueChange={(value) => handleOperatorChange(value as "AND" | "OR")}
        className="flex flex-col space-y-3"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="AND" id="r-and" />
          <Label htmlFor="r-and" className="flex items-center gap-2">
            <span>Match ALL rules</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              AND
            </Badge>
          </Label>
          <span className="text-xs text-gray-500 ml-2">
            (Transaction must satisfy every rule)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <RadioGroupItem value="OR" id="r-or" />
          <Label htmlFor="r-or" className="flex items-center gap-2">
            <span>Match ANY rule</span>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              OR
            </Badge>
          </Label>
          <span className="text-xs text-gray-500 ml-2">
            (Transaction must satisfy at least one rule)
          </span>
        </div>
      </RadioGroup>

      <div className="mt-4 text-xs text-gray-700 bg-white p-2 rounded border border-gray-200">
        <p className="font-medium">Logical Effect:</p>
        <p className="mt-1">
          {currentOperator === "AND"
            ? "All rules must match for the policy to apply. This creates a stricter policy."
            : "Any rule can match for the policy to apply. This creates a more inclusive policy."}
        </p>
      </div>
    </Card>
  );
};

export default RuleLogicCombiner;