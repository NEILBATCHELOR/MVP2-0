import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MetadataField {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'url';
}

interface TokenMetadataEditorProps {
  metadata: Record<string, any>;
  onChange: (metadata: Record<string, any>) => void;
  title?: string;
  readOnly?: boolean;
}

const TokenMetadataEditor: React.FC<TokenMetadataEditorProps> = ({
  metadata = {},
  onChange,
  title = 'Token Metadata',
  readOnly = false,
}) => {
  const [fields, setFields] = useState<MetadataField[]>(() => {
    return Object.entries(metadata).map(([key, value]) => ({
      key,
      value: String(value),
      type: typeof value === 'number' 
        ? 'number' 
        : typeof value === 'boolean'
          ? 'boolean'
          : key.toLowerCase().includes('date')
            ? 'date'
            : key.toLowerCase().includes('url') || key.toLowerCase().includes('link')
              ? 'url'
              : 'string',
    }));
  });

  const handleAddField = () => {
    setFields([...fields, { key: '', value: '', type: 'string' }]);
  };

  const handleRemoveField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
    updateMetadata(newFields);
  };

  const handleFieldChange = (index: number, field: Partial<MetadataField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...field };
    setFields(newFields);
    updateMetadata(newFields);
  };

  const updateMetadata = (updatedFields: MetadataField[]) => {
    const newMetadata: Record<string, any> = {};
    
    updatedFields.forEach(field => {
      if (field.key.trim()) {
        let value: any = field.value;
        
        // Convert value based on type
        if (field.type === 'number') {
          value = Number(field.value);
        } else if (field.type === 'boolean') {
          value = field.value === 'true';
        }
        
        newMetadata[field.key] = value;
      }
    });
    
    onChange(newMetadata);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-4">
                <Label htmlFor={`field-key-${index}`} className="sr-only">
                  Field Name
                </Label>
                <Input
                  id={`field-key-${index}`}
                  placeholder="Property name"
                  value={field.key}
                  onChange={(e) => handleFieldChange(index, { key: e.target.value })}
                  disabled={readOnly}
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor={`field-type-${index}`} className="sr-only">
                  Field Type
                </Label>
                <Select
                  value={field.type}
                  onValueChange={(value) => handleFieldChange(index, { type: value as MetadataField['type'] })}
                  disabled={readOnly}
                >
                  <SelectTrigger id={`field-type-${index}`}>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-5">
                <Label htmlFor={`field-value-${index}`} className="sr-only">
                  Field Value
                </Label>
                {field.type === 'boolean' ? (
                  <Select
                    value={field.value}
                    onValueChange={(value) => handleFieldChange(index, { value })}
                    disabled={readOnly}
                  >
                    <SelectTrigger id={`field-value-${index}`}>
                      <SelectValue placeholder="Value" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                ) : field.type === 'date' ? (
                  <Input
                    id={`field-value-${index}`}
                    type="date"
                    value={field.value}
                    onChange={(e) => handleFieldChange(index, { value: e.target.value })}
                    disabled={readOnly}
                  />
                ) : (
                  <Input
                    id={`field-value-${index}`}
                    type={field.type === 'number' ? 'number' : 'text'}
                    placeholder="Value"
                    value={field.value}
                    onChange={(e) => handleFieldChange(index, { value: e.target.value })}
                    disabled={readOnly}
                  />
                )}
              </div>
              
              <div className="col-span-1">
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveField(index)}
                    aria-label="Remove field"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {!readOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddField}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Field
            </Button>
          )}
          
          {fields.length === 0 && readOnly && (
            <p className="text-sm text-muted-foreground">No metadata fields have been added.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenMetadataEditor; 