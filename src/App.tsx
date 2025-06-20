import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate,
  useLocation,
  Link
} from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faFileAlt, 
  faSignOutAlt, 
  faPlusCircle, 
  faHome,
  faBars,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HolidayProvider, useHoliday } from './context/HolidayContext';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { Login } from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import CalendarView from './components/calendar/CalendarView';
import MyRequests from './components/requests/MyRequests';
import LeaveRequestWizard from './components/requests/LeaveRequestWizard';
import './styles/theme.css';

// Sidebar Component
interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onClose }) => {
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
  const leavePercentage = Math.round((takenHolidays / ALLOWANCE) * 100);
  
  const userStats = [
    { 
      value: remainingHolidays, 
      label: 'Remaining',
      icon: '🕒',
      color: '#4CAF50',
      total: ALLOWANCE
    },
    { 
      value: takenHolidays, 
      label: 'Taken',
      icon: '✅',
      color: '#2196F3',
      total: ALLOWANCE
    },
    { 
      value: '0.0', 
      label: 'Flexi Time',
      icon: '⏱️',
      color: '#9C27B0',
      total: 10
    }
  ];

  const handleNavigation = (view: string) => {
    setActiveView(view);
    navigate(view === 'dashboard' ? '/' : `/${view}`);
    if (onClose) onClose();
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/');
    }
  };

  return (
    <div className="sidebar">
      <div className="profile-section">
        <div className="profile-bg" />
        <div className="user-info">
          <div className="avatar-container">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="user-avatar" />
            ) : (
              <div className="avatar-placeholder">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>
          <div className="user-details">
            <h3 className="user-name">
              {user.name || user.email.split('@')[0]}
            </h3>
            <span className="user-email">{user.email}</span>
          </div>
        </div>
        
        <div className="stats-grid">
          {userStats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: `${stat.color}15` }}>
                {stat.icon}
              </div>
              <div className="stat-content">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="leave-progress">
          <div className="progress-header">
            <span>Leave Usage</span>
            <span>{takenHolidays}/{ALLOWANCE} days</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${Math.min(100, leavePercentage)}%`,
                backgroundColor: leavePercentage > 80 ? '#FF5722' : '#4CAF50'
              }}
            />
          </div>
        </div>
      </div>

      <div className="nav-buttons">
        {[
          { id: 'dashboard', icon: faHome, label: 'Dashboard' },
          { id: 'new-request', icon: faPlusCircle, label: 'New Request' },
          { id: 'calendar', icon: faCalendarAlt, label: 'Calendar' },
          { id: 'my-requests', icon: faFileAlt, label: 'My Requests' },
        ].map((item) => (
          <button
            key={item.id}
            className={`nav-button ${activeView === item.id ? 'active' : ''}`}
            onClick={() => handleNavigation(item.id)}
          >
            <FontAwesomeIcon icon={item.icon} className="nav-icon" />
            <span className="nav-label">{item.label}</span>
            <div className="active-indicator" />
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="logout-button" onClick={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} className="logout-icon" />
          <span>Sign Out</span>
        </button>
        <div className="app-version">v1.0.0</div>
      </div>
    </div>
  );
};

// Type for Google OAuth credential response
interface CredentialResponse {
  credential?: string;
  clientId?: string;
  select_by?: string;
};

const AppContent = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const navigate = useNavigate();

  // Check if mobile view
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      if (!isMobileView) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Handle navigation
  const handleNavigation = (view: string, path: string) => {
    setActiveView(view);
    navigate(path);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

  if (!clientId) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        Error: Google Client ID is not configured. Please set REACT_APP_GOOGLE_CLIENT_ID in your .env file.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`
          fixed md:relative z-30 w-72 h-screen bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <Sidebar onClose={isMobile ? () => setSidebarOpen(false) : undefined} activeView={activeView} setActiveView={setActiveView} />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <button 
              onClick={toggleSidebar}
              className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
              aria-label="Toggle sidebar"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1 flex justify-between items-center">
              <h1 className="text-xl font-semibold text-gray-900">Holiday Tracker</h1>
              <div className="ml-4 flex items-center">
                {user && (
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 mr-3">
                      {user.name || user.email}
                    </span>
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                      {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto focus:outline-none bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Routes>
              <Route path="/login" element={
                user ? <Navigate to="/dashboard" /> : <Login />
              } />
              <Route path="/" element={
                <PrivateRoute>
                  <Navigate to="/dashboard" replace />
                </PrivateRoute>
              } />
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/calendar" element={
                <PrivateRoute>
                  <CalendarView />
                </PrivateRoute>
              } />
              <Route path="/my-requests" element={
                <PrivateRoute>
                  <MyRequests />
                </PrivateRoute>
              } />
              <Route path="/new-request" element={
                <PrivateRoute>
                  <LeaveRequestWizard />
                </PrivateRoute>
              } />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <HolidayProvider>
          <AppContent />
        </HolidayProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
