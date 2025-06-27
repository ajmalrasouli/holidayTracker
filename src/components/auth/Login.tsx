import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../../config/azure-config';
import { AuthError } from '@azure/msal-browser';

export const Login: React.FC = () => {
    const { instance } = useMsal();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const account = instance.getActiveAccount();
        if (account) {
            navigate('/dashboard');
        }
    }, [instance, navigate]);

    const handleLogin = async () => {
        try {
            setError(null);
            setIsLoading(true);
            
            // Consistently use loginRedirect for better compatibility with Azure Static Web Apps
            await instance.loginRedirect({
                ...loginRequest,
                prompt: 'select_account',
                redirectUri: window.location.origin
            });
        } catch (err) {
            console.error('Login error:', err);
            setIsLoading(false);
            
            if (err instanceof AuthError) {
                if (err.errorCode === 'user_cancelled') {
                    setError('Login was cancelled. Please try again.');
                } else {
                    setError(`Authentication error: ${err.errorMessage}`);
                }
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Holiday Tracker
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Sign in to manage your holiday requests
                    </p>
                </div>
                
                {error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Error
                                </h3>
                                <div className="mt-2 text-sm text-red-700">
                                    {error}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <button
                        onClick={handleLogin}
                        disabled={isLoading}
                        className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white 
                            ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} 
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                        {isLoading ? (
                            <span>Signing in...</span>
                        ) : (
                            <span>Sign in with Microsoft</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};


