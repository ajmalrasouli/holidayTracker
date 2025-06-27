/* eslint-disable unicode-bom */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { cosmosDbService } from '../services/cosmosDb';

export interface Holiday {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps: {
    type: string;
    status: 'pending' | 'approved' | 'rejected';
    notes?: string;
    attachment?: string | null;
    requestedAt?: string;
    requestedBy?: string | null;
    approvedAt?: string | null;
    approvedBy?: string | null;
    rejectedAt?: string | null;
    rejectedBy?: string | null;
  };
}

interface HolidayContextType {
  holidays: Holiday[];
  addHoliday: (holiday: Holiday) => Promise<void>;
  removeHoliday: (id: string) => Promise<void>;
  updateHoliday: (holiday: Holiday) => Promise<void>;
}

const HolidayContext = createContext<HolidayContextType | undefined>(
  undefined,
);

export const HolidayProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const loadHolidays = useCallback(async () => {
    if (user) {
      try {
        const data = await cosmosDbService.getUserData(user.email, 'holiday');
        setHolidays(data || []);
      } catch (error) {
        console.error('Error loading holidays:', error);
        setHolidays([]);
      }
    }
  }, [user]);

  // Load holidays when user changes
  useEffect(() => {
    if (user) {
      loadHolidays();
    } else {
      setHolidays([]);
    }
  }, [user, loadHolidays]);

  const addHoliday = async (newHoliday: Holiday) => {
    if (!user) return;
    try {
      const updatedHolidays = [...holidays, newHoliday];
      await cosmosDbService.saveData(user.email, 'holiday', updatedHolidays);
      setHolidays(updatedHolidays);
    } catch (error) {
      console.error('Error adding holiday:', error);
    }
  };

  const updateHoliday = async (updatedHoliday: Holiday) => {
    if (!user) return;
    try {
      const updatedHolidays = holidays.map(h => 
        h.id === updatedHoliday.id ? updatedHoliday : h
      );
      await cosmosDbService.saveData(user.email, 'holiday', updatedHolidays);
      setHolidays(updatedHolidays);
    } catch (error) {
      console.error('Error updating holiday:', error);
    }
  };

  const removeHoliday = async (holidayId: string) => {
    if (!user) return;
    try {
      const updatedHolidays = holidays.filter(h => h.id !== holidayId);
      await cosmosDbService.saveData(user.email, 'holiday', updatedHolidays);
      setHolidays(updatedHolidays);
    } catch (error) {
      console.error('Error deleting holiday:', error);
    }
  };

  return (
    <HolidayContext.Provider
      value={{ holidays, addHoliday, removeHoliday, updateHoliday }}
    >
      {children}
    </HolidayContext.Provider>
  );
};

export const useHoliday = (): HolidayContextType => {
  const ctx = useContext(HolidayContext);
  if (!ctx)
    throw new Error('useHoliday must be used within a HolidayProvider');
  return ctx;
};
