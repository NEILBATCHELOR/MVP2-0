import React, { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle } from 'lucide-react';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

interface PasswordMeterProps {
  password: string;
}

const requirements: PasswordRequirement[] = [
  {
    label: 'At least 8 characters',
    test: (password) => password.length >= 8,
  },
  {
    label: 'Contains uppercase letter',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: 'Contains lowercase letter',
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: 'Contains number',
    test: (password) => /[0-9]/.test(password),
  },
  {
    label: 'Contains special character',
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

export const PasswordMeter: React.FC<PasswordMeterProps> = ({ password }) => {
  const strength = useMemo(() => {
    if (!password) return 0;
    
    const passedRequirements = requirements.filter(req => req.test(password));
    return (passedRequirements.length / requirements.length) * 100;
  }, [password]);

  const getStrengthColor = (value: number) => {
    if (value <= 20) return 'bg-red-500';
    if (value <= 40) return 'bg-orange-500';
    if (value <= 60) return 'bg-yellow-500';
    if (value <= 80) return 'bg-lime-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = (value: number) => {
    if (value <= 20) return 'Very Weak';
    if (value <= 40) return 'Weak';
    if (value <= 60) return 'Fair';
    if (value <= 80) return 'Good';
    return 'Strong';
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Password Strength</span>
          <span className={strength === 100 ? 'text-green-500' : 'text-gray-500'}>
            {getStrengthLabel(strength)}
          </span>
        </div>
        <Progress 
          value={strength} 
          className={`h-2 ${getStrengthColor(strength)}`}
        />
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            {req.test(password) ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-300" />
            )}
            <span className={req.test(password) ? 'text-green-500' : 'text-gray-500'}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}; 