/**
 * Basic Properties Step Component
 * Handles core token properties like name, symbol, decimals
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface AdditionalField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'url' | 'select';
  placeholder?: string;
  description?: string;
  required?: boolean;
  min?: number;
  max?: number;
  options?: Array<{ value: string; label: string }>;
}

interface BasicPropertiesStepProps {
  formData: any;
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
  showDecimals?: boolean;
  additionalFields?: AdditionalField[];
}

const BasicPropertiesStep: React.FC<BasicPropertiesStepProps> = ({
  formData,
  errors,
  onChange,
  showDecimals = true,
  additionalFields = []
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    let processedValue: any = value;
    
    if (type === 'number') {
      processedValue = value === '' ? '' : Number(value);
    }
    
    onChange(name, processedValue);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Basic Token Properties</h3>
        <p className="text-sm text-muted-foreground">
          Define the core properties that identify your ERC-20 token
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Token Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Token Name <Badge variant="destructive" className="ml-1">Required</Badge>
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="e.g., ChainCapital Token"
            value={formData.name || ''}
            onChange={handleInputChange}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name}</p>
          )}
          <p className="text-xs text-muted-foreground">
            The human-readable name of your token
          </p>
        </div>

        {/* Token Symbol */}
        <div className="space-y-2">
          <Label htmlFor="symbol" className="text-sm font-medium">
            Token Symbol <Badge variant="destructive" className="ml-1">Required</Badge>
          </Label>
          <Input
            id="symbol"
            name="symbol"
            type="text"
            placeholder="e.g., CCT"
            value={formData.symbol || ''}
            onChange={handleInputChange}
            className={errors.symbol ? 'border-red-500' : ''}
            maxLength={10}
          />
          {errors.symbol && (
            <p className="text-sm text-red-500">{errors.symbol}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Short ticker symbol (2-5 characters recommended)
          </p>
        </div>

        {/* Decimals */}
        {showDecimals && (
          <div className="space-y-2">
            <Label htmlFor="decimals" className="text-sm font-medium">
              Decimals
            </Label>
            <Input
              id="decimals"
              name="decimals"
              type="number"
              min="0"
              max="18"
              placeholder="18"
              value={formData.decimals || 18}
              onChange={handleInputChange}
              className={errors.decimals ? 'border-red-500' : ''}
            />
            {errors.decimals && (
              <p className="text-sm text-red-500">{errors.decimals}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Number of decimal places (18 is standard)
            </p>
          </div>
        )}

        {/* Initial Supply */}
        <div className="space-y-2">
          <Label htmlFor="initialSupply" className="text-sm font-medium">
            Initial Supply
          </Label>
          <Input
            id="initialSupply"
            name="initialSupply"
            type="text"
            placeholder="1000000"
            value={formData.initialSupply || ''}
            onChange={handleInputChange}
            className={errors.initialSupply ? 'border-red-500' : ''}
          />
          {errors.initialSupply && (
            <p className="text-sm text-red-500">{errors.initialSupply}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Total number of tokens to mint initially
          </p>
        </div>

        {/* Additional Fields */}
        {additionalFields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && (
                <Badge variant="destructive" className="ml-1">Required</Badge>
              )}
            </Label>
            {field.type === 'select' ? (
              <select
                id={field.name}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={(e) => onChange(field.name, e.target.value)}
                className={`w-full p-2 border rounded-md ${errors[field.name] ? 'border-red-500' : ''}`}
              >
                <option value="">Select...</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={field.name}
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
                value={formData[field.name] || ''}
                onChange={handleInputChange}
                className={errors[field.name] ? 'border-red-500' : ''}
                min={field.min}
                max={field.max}
              />
            )}
            {errors[field.name] && (
              <p className="text-sm text-red-500">{errors[field.name]}</p>
            )}
            {field.description && (
              <p className="text-xs text-muted-foreground">
                {field.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Description <span className="text-muted-foreground">(Optional)</span>
        </Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe the purpose and utility of your token..."
          value={formData.description || ''}
          onChange={handleInputChange}
          className={errors.description ? 'border-red-500' : ''}
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Detailed description of your token's purpose and use cases
        </p>
      </div>

      {/* Advanced Supply Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Supply Settings</CardTitle>
          <CardDescription>
            Configure token supply limits and constraints
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cap" className="text-sm font-medium">
              Maximum Supply Cap <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="cap"
              name="cap"
              type="text"
              placeholder="e.g., 10000000 (leave empty for unlimited)"
              value={formData.cap || ''}
              onChange={handleInputChange}
              className={errors.cap ? 'border-red-500' : ''}
            />
            {errors.cap && (
              <p className="text-sm text-red-500">{errors.cap}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Maximum total supply that can ever exist. Leave empty for unlimited supply.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Validation Summary for this step */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-sm font-medium">Step Validation</span>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {formData.name && formData.symbol ? (
              <span className="text-green-600">✓ Required fields completed</span>
            ) : (
              <span className="text-amber-600">⚠ Name and symbol are required</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BasicPropertiesStep;
