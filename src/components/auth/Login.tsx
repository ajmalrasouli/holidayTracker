import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Location } from 'react-router-dom';

interface CredentialResponse {
  credential?: string;
  clientId?: string;
  select_by?: string;
}

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: Location } | undefined)?.from?.pathname || '/';

  const handleSuccess = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      const userObject = jwtDecode(credentialResponse.credential) as { 
        name: string; 
        email: string; 
        picture: string 
      };
      
      login({
        name: userObject.name,
        email: userObject.email,
        picture: userObject.picture,
      });
      
      navigate(from, { replace: true });
    }
  };

  const handleError = () => {
    console.error('Login Failed');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Holiday Tracker</h2>
        <p className="text-gray-600 mb-6">Please sign in to continue</p>
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap
          />
        </div>
      </div>
    </div>
  );
};


