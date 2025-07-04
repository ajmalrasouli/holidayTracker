﻿import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Types
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export interface Holiday {
  id: string;
  title: string;
  start: string; // ISO date
  end: string;   // ISO date (inclusive if all-day, otherwise exclusive)
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
    rejectedAt?: string | null;
    approvedBy?: string | null;
    rejectedBy?: string | null;
  };
}

interface HolidayContextType {
  holidays: Holiday[];
  addHoliday: (holiday: Omit<Holiday, 'id'>) => void;
  removeHoliday: (id: string) => void;
  updateHoliday: (id: string, updates: Partial<Holiday>) => void;
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Context
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const HolidayContext = createContext<HolidayContextType | undefined>(
  undefined,
);

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Provider
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export const HolidayProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  
  // Load holidays when user changes
  useEffect(() => {
    if (user) {
      try {
        const stored = localStorage.getItem(`holidays_${user.email}`);
        setHolidays(stored ? (JSON.parse(stored) as Holiday[]) : []);
      } catch {
        setHolidays([]);
      }
    } else {
      setHolidays([]);
    }
  }, [user]);

  /* CRUD helpers */
  const addHoliday = (holiday: Omit<Holiday, 'id'>) => {
    const newHoliday: Holiday = {
      ...holiday,
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2),
    };
    setHolidays((prev) => [...prev, newHoliday]);
  };

  const removeHoliday = (id: string) =>
    setHolidays((prev) => prev.filter((h) => h.id !== id));

  const updateHoliday = (id: string, updates: Partial<Holiday>) =>
    setHolidays((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    );

  /* Persist on every change */
  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem(`holidays_${user.email}`, JSON.stringify(holidays));
      } catch {
        /* ignore storage failures */
      }
    }
  }, [holidays, user]);

  return (
    <HolidayContext.Provider
      value={{ holidays, addHoliday, removeHoliday, updateHoliday }}
    >
      {children}
    </HolidayContext.Provider>
  );
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Hook
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export const useHoliday = (): HolidayContextType => {
  const ctx = useContext(HolidayContext);
  if (!ctx)
    throw new Error('useHoliday must be used within a HolidayProvider');
  return ctx;
};
