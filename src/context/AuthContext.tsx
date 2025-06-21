import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  name: string;
  email: string;
  picture?: string;
  setupComplete?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  completeSetup: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (userData: User) => {
    // Check if this is an existing user by looking for stored settings
    const userSettings = localStorage.getItem(`userSettings_${userData.email}`);
    const setupComplete = userSettings ? JSON.parse(userSettings).setupComplete : false;
    
    const userWithSetup = {
      ...userData,
      setupComplete
    };
    
    setUser(userWithSetup);
    localStorage.setItem('user', JSON.stringify(userWithSetup));
  };
  
  const completeSetup = () => {
    if (user) {
      const updatedUser = { ...user, setupComplete: true };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update settings for this specific user
      const settingsKey = `userSettings_${user.email}`;
      const settings = JSON.parse(localStorage.getItem(settingsKey) || '{}');
      localStorage.setItem(settingsKey, JSON.stringify({ 
        ...settings, 
        setupComplete: true,
        lastUpdated: new Date().toISOString()
      }));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, completeSetup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
