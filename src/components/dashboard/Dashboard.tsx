import React from 'react';
import { Link } from 'react-router-dom';
import { useHoliday } from '../../context/HolidayContext';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faCalendarPlus,
  faUsers,
  faBriefcaseMedical, 
  faMoneyBillWave, 
  faBaby,
  faBabyCarriage,
  faSadTear
} from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { holidays } = useHoliday();
  const { user } = useAuth();

  // Load user settings
  const loadUserSettings = () => {
    if (!user?.email) return null;
    const settingsKey = `userSettings_${user.email}`;
    const savedSettings = localStorage.getItem(settingsKey);
    return savedSettings ? JSON.parse(savedSettings) : null;
  };

  // Calculate remaining leave days by type
  const calculateLeaveBalances = () => {
    const currentYear = new Date().getFullYear();
    const userSettings = loadUserSettings();
    
    // Default values if no user settings found
    const defaultAnnualLeave = userSettings?.annualLeave ? parseInt(userSettings.annualLeave) : 25;
    
    const balances = {
      'annual': { 
        used: 0, 
        total: defaultAnnualLeave, 
        icon: faCalendarAlt, 
        label: 'Annual Leave',
        color: 'var(--color-primary-600)'
      },
      'sick': { 
        used: 0, 
        total: 10,
        icon: faBriefcaseMedical, 
        label: 'Sick Leave',
        color: 'var(--color-blue-600)'
      },
      'unpaid': { 
        used: 0, 
        total: 0, 
        icon: faMoneyBillWave, 
        label: 'Unpaid Leave',
        color: 'var(--color-gray-600)'
      },
      'maternity': { 
        used: 0, 
        total: 0, 
        icon: faBaby, 
        label: 'Maternity Leave',
        color: 'var(--color-pink-600)'
      },
      'paternity': { 
        used: 0, 
        total: 14, 
        icon: faBabyCarriage, 
        label: 'Paternity Leave',
        color: 'var(--color-purple-600)'
      },
      'bereavement': { 
        used: 0, 
        total: 5, 
        icon: faSadTear, 
        label: 'Bereavement Leave',
        color: 'var(--color-gray-600)'
      },
    };

    // Calculate used days for each leave type
    holidays.forEach(holiday => {
      if (new Date(holiday.start).getFullYear() === currentYear && 
          holiday.extendedProps?.status === 'approved') {
        const type = holiday.extendedProps.type.split('-')[0];
        if (balances[type as keyof typeof balances]) {
          const start = new Date(holiday.start);
          const end = new Date(holiday.end);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          balances[type as keyof typeof balances].used += diffDays;
        }
      }
    });
    
    return balances;
  };

  const leaveBalances = calculateLeaveBalances();
  const annualLeave = leaveBalances.annual;
  const remainingLeave = Math.max(0, annualLeave.total - annualLeave.used);
  const usedPercentage = (annualLeave.used / annualLeave.total) * 100;
  const remainingPercentage = 100 - usedPercentage;

  // Get upcoming approved leaves (next 30 days)
  const getUpcomingLeaves = () => {
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);
    
    return holidays
      .filter(holiday => {
        const startDate = new Date(holiday.start);
        return startDate >= today && 
               startDate <= next30Days &&
               holiday.extendedProps?.status === 'approved';
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5);
  };

  const upcomingLeaves = getUpcomingLeaves();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.name || 'User'}</h1>
        <Link to="/new-request" className="quick-request-btn">
          <FontAwesomeIcon icon={faCalendarPlus} />
          <span>New Request</span>
        </Link>
      </div>

      <div className="dashboard-grid">
        {/* Leave Balance Card */}
        <div className="dashboard-card remaining-leave">
          <h3>Your Leave Balance</h3>
          <div className="leave-days">
            {remainingLeave}<span>/{annualLeave.total} days</span>
          </div>
          <p>{Math.round(remainingPercentage)}% remaining</p>
          
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{
                width: `${remainingPercentage}%`,
                backgroundColor: annualLeave.color
              }}
            />
          </div>
          
          <div className="leave-stats">
            <div className="stat">
              <div className="stat-label">Used</div>
              <div className="stat-value">{annualLeave.used} days</div>
            </div>
            <div className="stat">
              <div className="stat-label">Upcoming</div>
              <div className="stat-value">
                {upcomingLeaves.reduce((total, leave) => {
                  const start = new Date(leave.start);
                  const end = new Date(leave.end);
                  const diffTime = Math.abs(end.getTime() - start.getTime());
                  return total + Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                }, 0)} days
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">Remaining</div>
              <div className="stat-value">{remainingLeave} days</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            <Link to="/new-request" className="action-button">
              <FontAwesomeIcon icon={faCalendarPlus} className="action-icon" />
              <span>Request Leave</span>
            </Link>
            <Link to="/calendar" className="action-button">
              <FontAwesomeIcon icon={faUsers} className="action-icon" />
              <span>Team Calendar</span>
            </Link>
          </div>
        </div>

        {/* Upcoming Leaves */}
        {upcomingLeaves.length > 0 && (
          <div className="dashboard-card">
            <h3>Upcoming Leaves</h3>
            <div className="leaves-list">
              {upcomingLeaves.map((leave, index) => {
                const startDate = new Date(leave.start);
                const endDate = new Date(leave.end);
                const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                
                return (
                  <div key={index} className="leave-item">
                    <div className="leave-date">
                      {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                      <span className="leave-duration">({diffDays} day{diffDays > 1 ? 's' : ''})</span>
                    </div>
                    <div className="leave-type" style={{ color: leaveBalances[leave.extendedProps.type.split('-')[0]]?.color }}>
                      {leave.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
