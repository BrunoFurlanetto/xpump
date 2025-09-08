"use client";

import { useState, useEffect } from 'react';

export interface UserSettings {
  // Notificações
  notifications: {
    achievements: boolean;
    reminders: boolean;
    social: boolean;
    streaks: boolean;
    challenges: boolean;
    email: boolean;
    push: boolean;
  };
  
  // Preferências de exercícios
  workout: {
    defaultDuration: number; // em minutos
    preferredTime: 'morning' | 'afternoon' | 'evening' | 'any';
    intensityLevel: 'beginner' | 'intermediate' | 'advanced';
    autoReminders: boolean;
    reminderTime: string; // formato HH:MM
  };
  
  // Preferências de alimentação
  nutrition: {
    dietaryRestrictions: string[];
    mealReminders: boolean;
    hydrationGoal: number; // em litros
    waterReminders: boolean;
    reminderInterval: number; // em horas
  };
  
  // Interface
  interface: {
    theme: 'dark' | 'light' | 'system';
    language: 'pt' | 'en' | 'es';
    compactMode: boolean;
    animations: boolean;
    sounds: boolean;
  };
  
  // Privacidade
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    shareWorkouts: boolean;
    shareMeals: boolean;
    shareAchievements: boolean;
    allowFriendRequests: boolean;
  };
  
  // Metas e objetivos
  goals: {
    weeklyWorkouts: number;
    dailyMeals: number;
    weeklyPoints: number;
    weight: {
      target: number | null;
      unit: 'kg' | 'lbs';
    };
    bodyFat: {
      target: number | null;
    };
  };
}

const defaultSettings: UserSettings = {
  notifications: {
    achievements: true,
    reminders: true,
    social: true,
    streaks: true,
    challenges: true,
    email: false,
    push: true,
  },
  workout: {
    defaultDuration: 60,
    preferredTime: 'any',
    intensityLevel: 'intermediate',
    autoReminders: true,
    reminderTime: '18:00',
  },
  nutrition: {
    dietaryRestrictions: [],
    mealReminders: true,
    hydrationGoal: 2.5,
    waterReminders: true,
    reminderInterval: 2,
  },
  interface: {
    theme: 'dark',
    language: 'pt',
    compactMode: false,
    animations: true,
    sounds: true,
  },
  privacy: {
    profileVisibility: 'friends',
    shareWorkouts: true,
    shareMeals: true,
    shareAchievements: true,
    allowFriendRequests: true,
  },
  goals: {
    weeklyWorkouts: 4,
    dailyMeals: 5,
    weeklyPoints: 1000,
    weight: {
      target: null,
      unit: 'kg',
    },
    bodyFat: {
      target: null,
    },
  },
};

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Simular carregamento das configurações
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('xpump-settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...defaultSettings, ...parsed });
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      
      // Fazer merge profundo para objetos aninhados
      Object.keys(newSettings).forEach(key => {
        if (typeof newSettings[key as keyof UserSettings] === 'object' && 
            newSettings[key as keyof UserSettings] !== null) {
          updated[key as keyof UserSettings] = {
            ...prev[key as keyof UserSettings],
            ...newSettings[key as keyof UserSettings]
          } as any;
        }
      });

      return updated;
    });
    setHasChanges(true);
  };

  const saveSettings = async () => {
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      localStorage.setItem('xpump-settings', JSON.stringify(settings));
      setHasChanges(false);
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      return { success: false, error: 'Erro ao salvar configurações' };
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'xpump-settings.json';
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const importSettings = (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setSettings({ ...defaultSettings, ...imported });
          setHasChanges(true);
          resolve(true);
        } catch (error) {
          reject(new Error('Arquivo de configurações inválido'));
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  };

  // Getters para configurações específicas
  const getNotificationSettings = () => settings.notifications;
  const getWorkoutSettings = () => settings.workout;
  const getNutritionSettings = () => settings.nutrition;
  const getInterfaceSettings = () => settings.interface;
  const getPrivacySettings = () => settings.privacy;
  const getGoalsSettings = () => settings.goals;

  // Checkers
  const isNotificationEnabled = (type: keyof UserSettings['notifications']) => {
    return settings.notifications[type];
  };

  const shouldShowReminder = () => {
    if (!settings.workout.autoReminders) return false;
    
    const now = new Date();
    const reminderTime = settings.workout.reminderTime.split(':');
    const reminderHour = parseInt(reminderTime[0]);
    const reminderMinute = parseInt(reminderTime[1]);
    
    return now.getHours() === reminderHour && now.getMinutes() === reminderMinute;
  };

  const getHydrationReminder = () => {
    if (!settings.nutrition.waterReminders) return null;
    
    const lastReminder = localStorage.getItem('last-hydration-reminder');
    const now = new Date().getTime();
    const interval = settings.nutrition.reminderInterval * 60 * 60 * 1000; // converter para ms
    
    if (!lastReminder || (now - parseInt(lastReminder)) >= interval) {
      localStorage.setItem('last-hydration-reminder', now.toString());
      return true;
    }
    
    return false;
  };

  return {
    settings,
    isLoading,
    hasChanges,
    updateSettings,
    saveSettings,
    resetSettings,
    exportSettings,
    importSettings,
    
    // Getters
    getNotificationSettings,
    getWorkoutSettings,
    getNutritionSettings,
    getInterfaceSettings,
    getPrivacySettings,
    getGoalsSettings,
    
    // Utility functions
    isNotificationEnabled,
    shouldShowReminder,
    getHydrationReminder,
  };
};
