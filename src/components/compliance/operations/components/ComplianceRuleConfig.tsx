import React from 'react';
import { useCompliance } from '../context/ComplianceContext';
import type { ComplianceRule, DocumentRequirement } from '../types';
import { getAllCountries, getCountryNameById } from '@/utils/compliance/countries';
import { getAllInvestorTypes, getInvestorTypeName } from '@/utils/compliance/investorTypes';

interface ComplianceRuleConfigProps {
  rule?: ComplianceRule;
  onSave: (rule: Omit<ComplianceRule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const ComplianceRuleConfig: React.FC<ComplianceRuleConfigProps> = ({
  rule,
  onSave,
}) => {
  const [name, setName] = React.useState(rule?.name ?? '');
  const [description, setDescription] = React.useState(rule?.description ?? '');
  const [enabled, setEnabled] = React.useState(rule?.enabled ?? true);
  const [blockedCountries, setBlockedCountries] = React.useState<string[]>(rule?.blockedCountries ?? []);
  const [blockedInvestorTypes, setBlockedInvestorTypes] = React.useState<string[]>(rule?.blockedInvestorTypes ?? []);
  const [requiredDocuments, setRequiredDocuments] = React.useState<DocumentRequirement[]>(rule?.requiredDocuments ?? []);
  const [riskLevel, setRiskLevel] = React.useState(rule?.riskLevel ?? 'LOW');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name,
      description,
      enabled,
      blockedCountries,
      blockedInvestorTypes,
      requiredDocuments,
      riskLevel,
      createdBy: 'current-user', // TODO: Get from auth context
      updatedBy: 'current-user', // TODO: Get from auth context
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Rule Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="ml-2 text-sm text-gray-900">Enabled</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Blocked Countries
        </label>
        <select
          multiple
          value={blockedCountries}
          onChange={(e) => setBlockedCountries(Array.from(e.target.selectedOptions, option => option.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {getAllCountries().map(country => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Blocked Investor Types
        </label>
        <select
          multiple
          value={blockedInvestorTypes}
          onChange={(e) => setBlockedInvestorTypes(Array.from(e.target.selectedOptions, option => option.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {getAllInvestorTypes().map(type => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Risk Level
        </label>
        <select
          value={riskLevel}
          onChange={(e) => setRiskLevel(e.target.value as ComplianceRule['riskLevel'])}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </div>

      <div>
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Save Rule
        </button>
      </div>
    </form>
  );
};