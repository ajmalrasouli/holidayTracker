import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useMsal, useAccount } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { msalConfig, loginRequest } from '../config/azure-config';
import { cosmosDbService } from '../services/cosmosDb';

export interface User {
    name: string;
    email: string;
    picture?: string;
    setupComplete?: boolean;
}

interface AuthContextType {
    user: User | null;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    completeSetup: () => Promise<void>;
    isInitializing: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { instance } = useMsal();
    const account = useAccount();
    const [user, setUser] = useState<User | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadUserData = useCallback(async (email: string) => {
        try {
            console.log('Loading user data for:', email);
            const userData = await cosmosDbService.getUserData(email, 'user');
            
            if (userData) {
                console.log('User data loaded:', userData);
                setUser(userData);
            } else {
                console.log('Creating new user profile');
                const newUser: User = {
                    name: account?.name || '',
                    email: email,
                    picture: account?.username || '',
                    setupComplete: false
                };
                await cosmosDbService.saveData(email, 'user', newUser);
                setUser(newUser);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            throw error;
        }
    }, [account]);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                setIsInitializing(true);
                
                // Handle the redirect response
                const response = await instance.handleRedirectPromise();
                
                if (response) {
                    // If we have a response, set the active account
                    instance.setActiveAccount(response.account);
                }
                
                // Check if we have an active account
                const activeAccount = instance.getActiveAccount();
                if (activeAccount) {
                    await loadUserData(activeAccount.username);
                }
            } catch (err) {
                console.error('Error initializing auth:', err);
                setError('Failed to initialize authentication');
            } finally {
                setIsInitializing(false);
            }
        };

        initializeAuth();
    }, [instance, loadUserData]);

    const login = async () => {
        try {
            setError(null);
            await instance.loginRedirect(loginRequest);
        } catch (error) {
            console.error('Login error:', error);
            if (error instanceof InteractionRequiredAuthError) {
                setError('Authentication required. Please try again.');
            } else {
                setError('Failed to login. Please try again.');
            }
            throw error;
        }
    };

    const logout = async () => {
        try {
            await instance.logoutRedirect({
                postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri
            });
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
            setError('Failed to logout. Please try again.');
        }
    };

    const completeSetup = async () => {
        if (user && account) {
            try {
                const updatedUser = { ...user, setupComplete: true };
                await cosmosDbService.saveData(account.username, 'user', updatedUser);
                setUser(updatedUser);
            } catch (error) {
                console.error('Error completing setup:', error);
                setError('Failed to complete setup. Please try again.');
            }
        }
    };

    return (
        <AuthContext.Provider 
            value={{
                user,
                login,
                logout,
                completeSetup,
                isInitializing,
                error
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
