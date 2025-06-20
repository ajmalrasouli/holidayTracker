import React, { useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './App.css';
import CalendarView from './components/calendar/CalendarView';
import MyRequests from './components/requests/MyRequests';
import LeaveRequestWizard from './components/requests/LeaveRequestWizard';
import Dashboard from './components/dashboard/Dashboard';
import { HolidayProvider, useHoliday } from './context/HolidayContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faFileAlt, faSignOutAlt, faPlusCircle, faHome } from '@fortawesome/free-solid-svg-icons';

// Sidebar Component
const Sidebar: React.FC<{ activeView: string; setActiveView: (view: string) => void }> = ({ activeView, setActiveView }) => {
  const navigate = useNavigate();
  const { holidays } = useHoliday();
  const { user, logout } = useAuth();
  
  if (!user) {
    return null; // Don't render sidebar if user is not logged in
  }

  // Helper to count inclusive day span between two dates
  const getDaysInclusive = (start: string | Date, end: string | Date) => {
    const s = new Date(start);
    const e = new Date(end);
    return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
  };

  const approved = holidays.filter(h => h.extendedProps?.status === 'approved');
  const takenHolidays = approved.reduce(
    (sum, h) => sum + getDaysInclusive(h.start, h.end),
    0
  );

  const ALLOWANCE = 25; // annual allowance, adjust as needed
  const remainingHolidays = ALLOWANCE - takenHolidays;
  const userStats = {
    remainingHolidays,
    takenHolidays,
    flexiTime: 0,
  };

  const handleNavigation = (view: string) => {
    setActiveView(view);
    navigate(view === 'dashboard' ? '/' : `/${view}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="sidebar">
      <div className="profile-section">
        <div className="user-info">
          {user.picture && <img src={user.picture} alt={user.name} className="user-avatar" />}
          <div className="user-details">
            <span className="user-name">
              {user.name ? user.name.split(' ')[0] : user.email.split('@')[0]}
            </span>
            <span className="user-email">{user.email}</span>
          </div>
        </div>
        <div className="stats">
          <div className="stat-item">
            <span className="stat-label">Remaining Holidays</span>
            <span className="stat-value">{userStats.remainingHolidays}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Taken Holidays</span>
            <span className="stat-value">{userStats.takenHolidays}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Accrued Flexi Time</span>
            <span className="stat-value">{userStats.flexiTime}</span>
          </div>
        </div>
      </div>

      <div className="nav-buttons">
        <button 
          className={`nav-button ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavigation('dashboard')}
        >
          <FontAwesomeIcon icon={faHome} />
          <span>DASHBOARD</span>
        </button>
        <button 
          className={`nav-button ${activeView === 'new-request' ? 'active' : ''}`}
          onClick={() => handleNavigation('new-request')}
        >
          <FontAwesomeIcon icon={faPlusCircle} />
          <span>NEW REQUEST</span>
        </button>
        <button 
          className={`nav-button ${activeView === 'calendar' ? 'active' : ''}`}
          onClick={() => handleNavigation('calendar')}
        >
          <FontAwesomeIcon icon={faCalendarAlt} />
          <span>CALENDAR</span>
        </button>
        <button 
          className={`nav-button ${activeView === 'my-requests' ? 'active' : ''}`}
          onClick={() => handleNavigation('my-requests')}
        >
          <FontAwesomeIcon icon={faFileAlt} />
          <span>MY REQUESTS</span>
        </button>
      </div>

      <button className="logout-button" onClick={handleLogout}>
        <FontAwesomeIcon icon={faSignOutAlt} />
        <span>LOG OUT</span>
      </button>
    </div>
  );
};

// Protected route component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Login component
const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <h2>Please sign in to continue</h2>
      <GoogleLogin
        onSuccess={(credentialResponse: CredentialResponse) => {
          try {
            if (credentialResponse.credential) {
              const decoded = jwtDecode<{
                name: string;
                email: string;
                picture: string;
              }>(credentialResponse.credential);
              
              console.log('Google login successful:', decoded);
              
              login({
                name: decoded.name,
                email: decoded.email,
                picture: decoded.picture
              });
              
              navigate('/');
            } else {
              console.error('No credential in response');
            }
          } catch (error) {
            console.error('Error handling login:', error);
          }
        }}
        onError={() => {
          console.error('Google Login Error occurred');
        }}
        useOneTap
        auto_select
        ux_mode="popup"
      />
    </div>
  );
};

// Add this type for the Google OAuth credential response
type CredentialResponse = {
  credential?: string;
  clientId?: string;
  select_by?: string;
};

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

  if (!clientId) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        Error: Google Client ID is not configured. Please set REACT_APP_GOOGLE_CLIENT_ID in your .env file.
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <HolidayProvider>
          <div className="app-container">
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
            <main className="main-content">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/calendar" element={
                  <ProtectedRoute>
                    <CalendarView />
                  </ProtectedRoute>
                } />
                <Route path="/my-requests" element={
                  <ProtectedRoute>
                    <MyRequests />
                  </ProtectedRoute>
                } />
                <Route path="/new-request" element={
                  <ProtectedRoute>
                    <LeaveRequestWizard />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
          </div>
        </HolidayProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
