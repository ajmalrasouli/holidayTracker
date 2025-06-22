// src/pages/Dashboard/Dashboard.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useHoliday } from '../../context/HolidayContext';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarPlus,
  faUsers,
  faArrowRight,
  IconDefinition
} from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import { getLeaveTypeDetails } from '../../utils/leaveUtils'; // We'll use a helper for icons/colors
import './Dashboard.css';

interface LeaveBalance {
  used: number;
  total: number;
  icon: IconDefinition;
  label: string;
  className: string;
}

const Dashboard: React.FC = () => {
  const { holidays } = useHoliday();
  const { user } = useAuth();

  const calculateLeaveBalances = (): Record<string, LeaveBalance> => {
    const currentYear = new Date().getFullYear();
    const settingsKey = `userSettings_${user?.email}`;
    const savedSettings = localStorage.getItem(settingsKey);
    const userSettings = savedSettings ? JSON.parse(savedSettings) : {};
    
    const defaultAnnualLeave = userSettings.annualLeave ? parseInt(userSettings.annualLeave, 10) : 25;

    const balances: Record<string, LeaveBalance> = {
      'annual': { ...getLeaveTypeDetails('annual'), used: 0, total: defaultAnnualLeave },
      'sick': { ...getLeaveTypeDetails('sick'), used: 0, total: 10 },
      'paternity': { ...getLeaveTypeDetails('paternity'), used: 0, total: 14 },
      'bereavement': { ...getLeaveTypeDetails('bereavement'), used: 0, total: 5 },
      'maternity': { ...getLeaveTypeDetails('maternity'), used: 0, total: 0 }, // Often company specific
      'unpaid': { ...getLeaveTypeDetails('unpaid'), used: 0, total: Infinity },
    };

    holidays.forEach(holiday => {
      if (new Date(holiday.start).getFullYear() === currentYear && holiday.extendedProps?.status === 'approved') {
        const type = holiday.extendedProps.type.split('-')[0];
        if (balances[type]) {
          const start = new Date(holiday.start);
          const end = new Date(holiday.end);
          // Add 1 because date ranges are inclusive
          const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          balances[type].used += diffDays;
        }
      }
    });
    
    return balances;
  };

  const getUpcomingLeaves = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    return holidays
      .filter(holiday => {
        const startDate = new Date(holiday.start);
        return startDate >= today && holiday.extendedProps?.status === 'approved';
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5); // Show the next 5 upcoming leaves
  };

  const leaveBalances = calculateLeaveBalances();
  const upcomingLeaves = getUpcomingLeaves();

  const renderLeaveBalanceItem = (key: string, balance: LeaveBalance) => {
    if (balance.total === 0 && balance.used === 0) return null; // Don't show empty/unused categories like Maternity for a male user

    const remaining = balance.total - balance.used;
    const progress = balance.total > 0 ? (balance.used / balance.total) * 100 : 0;

    return (
      <div key={key} className={`leave-balance-item ${balance.className}`}>
        <div className="leave-type-icon">
          <FontAwesomeIcon icon={balance.icon} />
          <span>{balance.label}</span>
        </div>
        <div className="leave-amount">
          <span className="remaining">{isFinite(remaining) ? remaining : 'N/A'}</span>
          {isFinite(balance.total) && <span className="total">/ {balance.total} days</span>}
        </div>
        {isFinite(balance.total) && (
           <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.name || 'User'}!</h1>
          <p>Here's your personal leave summary and upcoming schedule.</p>
        </div>
        <Link to="/new-request" className="quick-request-btn">
          <FontAwesomeIcon icon={faCalendarPlus} />
          <span>New Leave Request</span>
        </Link>
      </header>

      <div className="dashboard-grid">
        <main className="main-content">
          <div className="dashboard-card" id="leave-summary-card">
             <div className="section-header">
              <h3>Leave Balance Summary</h3>
            </div>
            <div className="leave-balance-grid">
              {Object.entries(leaveBalances).map(([key, balance]) => renderLeaveBalanceItem(key, balance))}
            </div>
          </div>
        </main>

        <aside className="sidebar-content">
          <div className="dashboard-card" id="quick-actions-card">
            <div className="section-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="quick-actions-list">
              <Link to="/new-request" className="action-link">
                <FontAwesomeIcon icon={faCalendarPlus} className="action-icon" />
                <span>Request New Leave</span>
                <FontAwesomeIcon icon={faArrowRight} className="arrow-icon" />
              </Link>
              <Link to="/calendar" className="action-link">
                <FontAwesomeIcon icon={faUsers} className="action-icon" />
                <span>View Team Calendar</span>
                <FontAwesomeIcon icon={faArrowRight} className="arrow-icon" />
              </Link>
            </div>
          </div>

          <div className="dashboard-card" id="upcoming-leaves-card">
            <div className="section-header">
              <h3>Upcoming Leaves</h3>
              <Link to="/my-requests" className="view-all">
                View All
              </Link>
            </div>
            <div className="upcoming-leaves-list">
              {upcomingLeaves.length > 0 ? (
                upcomingLeaves.map((leave, index) => {
                  const typeDetails = getLeaveTypeDetails(leave.extendedProps.type);
                  return (
                    <div key={index} className="upcoming-leave-item">
                      <div className="leave-date">
                        <span className="month">{format(new Date(leave.start), 'MMM')}</span>
                        <span className="day">{format(new Date(leave.start), 'dd')}</span>
                      </div>
                      <div className="leave-details">
                         <span className={`leave-type-badge ${typeDetails.className}`}>
                           {typeDetails.label}
                         </span>
                         <p className="leave-notes">{leave.title}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-leaves">
                  <p>You have no upcoming approved leaves. Time to plan a vacation!</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;