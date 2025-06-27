import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate,
  useNavigate
} from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication, EventType, AuthenticationResult } from '@azure/msal-browser';
import { msalConfig } from './config/azure-config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faFileAlt, 
  faSignOutAlt, 
  faPlusCircle, 
  faHome,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HolidayProvider, useHoliday } from './context/HolidayContext';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { Login } from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import CalendarView from './components/calendar/CalendarView';
import MyRequests from './components/requests/MyRequests';
import LeaveRequestWizard from './components/requests/LeaveRequestWizard';
import SetupWizard from './components/setup/SetupWizard';
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
  
  if (!user) return null;

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
  
  const navItems = [
    { id: 'dashboard', icon: faHome, label: 'Dashboard', path: '/' },
    { id: 'new-request', icon: faPlusCircle, label: 'New Request', path: '/new-request' },
    { id: 'calendar', icon: faCalendarAlt, label: 'Calendar', path: '/calendar' },
    { id: 'my-requests', icon: faFileAlt, label: 'My Requests', path: '/my-requests' },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl flex flex-col transition-transform duration-300 ease-in-out z-40">
      {/* Profile Section */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          {user.picture ? (
            <img 
              src={user.picture} 
              alt={user.name} 
              className="w-12 h-12 rounded-full border-2 border-blue-400"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-xl font-semibold">
              {user.name?.charAt(0) || user.email.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{user.name || user.email.split('@')[0]}</h2>
            <p className="text-sm text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Leave Summary */}
      <div className="p-6 border-b border-gray-700 bg-gray-800/50">
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span>Leave Balance</span>
            <span className="font-semibold">{remainingHolidays}/{ALLOWANCE} days</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-bar__fill"
              data-progress={takenHolidays / ALLOWANCE}
              onLoad={(e) => {
                (e.target as HTMLElement).style.setProperty('--progress-value', String(takenHolidays / ALLOWANCE));
              }}
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => {
              setActiveView(item.id);
              navigate(item.path);
              if (onClose) onClose();
            }}
            className={`w-full flex items-center px-4 py-3 text-sm rounded-lg transition-all duration-200
              ${activeView === item.id 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
          >
            <FontAwesomeIcon icon={item.icon} className={`w-5 h-5 ${activeView === item.id ? 'text-white' : 'text-gray-400'}`} />
            <span className="ml-3 font-medium">{item.label}</span>
            {activeView === item.id && (
              <span className="ml-auto">
                <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-gray-700">
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to log out?')) {
              logout();
              navigate('/');
            }
          }}
          className="w-full flex items-center px-4 py-3 text-sm text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors duration-200"
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5" />
          <span className="ml-3 font-medium">Sign Out</span>
        </button>
        <div className="mt-4 text-center text-xs text-gray-500">
          v1.0.0
        </div>
      </div>
    </aside>
  );
};

// Create MSAL instance before any components
const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL instance
msalInstance.initialize().then(() => {
  // Handle redirect promise for authentication
  msalInstance.handleRedirectPromise().catch((error) => {
    console.error('Error handling redirect:', error);
  });
});

// Add event callback for successful logins
msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS) {
    const result = event.payload as AuthenticationResult;
    if (result?.account) {
      msalInstance.setActiveAccount(result.account);
    }
  }
});

const AppContent = () => {
  const { user, completeSetup } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const navigate = useNavigate();

  // Check if we need to show setup wizard for new users
  useEffect(() => {
    if (user && user.setupComplete === false) {
      setShowSetupWizard(true);
    }
  }, [user]);

  const handleSetupComplete = () => {
    completeSetup();
    setShowSetupWizard(false);
    navigate('/dashboard');
  };

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Setup Wizard for New Users */}
      {showSetupWizard && user && (
        <SetupWizard 
          onComplete={handleSetupComplete} 
          user={{ name: user.name, email: user.email }}
        />
      )}
      
      {/* Rest of the UI */}
      {!showSetupWizard && (
        <>
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
                    user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
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
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <Router>
        <AuthProvider>
          <HolidayProvider>
            <AppContent />
          </HolidayProvider>
        </AuthProvider>
      </Router>
    </MsalProvider>
  );
}

export default App;
