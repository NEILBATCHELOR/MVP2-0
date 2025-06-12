import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export type ConfigMode = 'min' | 'max';

interface ConfigModeToggleProps {
  mode: ConfigMode;
  onChange: (mode: ConfigMode) => void;
  disabled?: boolean;
}

const ConfigModeToggle: React.FC<ConfigModeToggleProps> = ({
  mode,
  onChange,
  disabled = false,
}) => {
  const handleToggle = (checked: boolean) => {
    onChange(checked ? 'max' : 'min');
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-2">
        <Label htmlFor="config-mode">Configuration Mode</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Basic mode provides essential settings for quick setup.
                <br />
                Advanced mode unlocks all configuration options for complete customization.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="flex items-center space-x-2">
        <span className={`text-sm ${mode === 'min' ? 'font-medium' : 'text-muted-foreground'}`}>
          Basic
        </span>
        <Switch
          id="config-mode"
          checked={mode === 'max'}
          onCheckedChange={handleToggle}
          disabled={disabled}
        />
        <span className={`text-sm ${mode === 'max' ? 'font-medium' : 'text-muted-foreground'}`}>
          Advanced
        </span>
      </div>
    </div>
  );
};

export default ConfigModeToggle; 