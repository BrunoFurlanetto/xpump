'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Moon, Sun, Monitor } from 'lucide-react';

export function ThemeSelector() {
  const { theme, setTheme, actualTheme } = useTheme();

  const themeOptions = [
    {
      value: 'system',
      label: 'Sistema',
      icon: Monitor,
      description: 'Usar tema do sistema'
    },
    {
      value: 'light',
      label: 'Claro',
      icon: Sun,
      description: 'Tema claro'
    },
    {
      value: 'dark',
      label: 'Escuro',
      icon: Moon,
      description: 'Tema escuro'
    }
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Tema da Interface
      </label>
      <Select value={theme} onValueChange={(value) => setTheme(value as "system" | "light" | "dark")}>
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              {themeOptions.find(option => option.value === theme)?.icon && 
                React.createElement(themeOptions.find(option => option.value === theme)!.icon, { 
                  className: "h-4 w-4" 
                })
              }
              {themeOptions.find(option => option.value === theme)?.label}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {themeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <option.icon className="h-4 w-4" />
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Atualmente usando: <span className="font-medium capitalize">{actualTheme}</span>
      </p>
    </div>
  );
};