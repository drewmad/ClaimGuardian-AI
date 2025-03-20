'use client';

import { useState, useEffect } from 'react';
import { 
  calculatePasswordStrength, 
  getPasswordStrengthLabel, 
  getPasswordStrengthColor 
} from '@/lib/password-policies';

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

export default function PasswordStrengthMeter({ 
  password, 
  className = '' 
}: PasswordStrengthMeterProps) {
  const [score, setScore] = useState(0);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#e5e7eb'); // Default gray

  useEffect(() => {
    if (!password) {
      setScore(0);
      setLabel('');
      setColor('#e5e7eb');
      return;
    }

    const strength = calculatePasswordStrength(password);
    setScore(strength);
    setLabel(getPasswordStrengthLabel(strength));
    setColor(getPasswordStrengthColor(strength));
  }, [password]);

  if (!password) {
    return null;
  }

  return (
    <div className={`w-full mt-1 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-300 ease-in-out"
            style={{ 
              width: `${score}%`, 
              backgroundColor: color 
            }}
          />
        </div>
      </div>
      <p className="text-xs mt-1" style={{ color }}>
        {label && `Password strength: ${label}`}
      </p>
    </div>
  );
} 