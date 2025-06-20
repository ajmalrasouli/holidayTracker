import React from 'react';
import { Link } from 'react-router-dom';
import { useHoliday } from '../../context/HolidayContext';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { holidays } = useHoliday();
  const { user } = useAuth();

  // Calculate remaining leave days
  const calculateRemainingLeave = () => {
    const currentYear = new Date().getFullYear();
    const annualLeaveDays = holidays.filter(holiday => 
      new Date(holiday.start).getFullYear() === currentYear &&
      holiday.extendedProps?.type === 'annual-leave' &&
      holiday.extendedProps?.status === 'approved'
    ).length;
    
    return 25 - annualLeaveDays; // Assuming 25 days annual leave
  };

  // Get upcoming approved leaves
  const getUpcomingLeaves = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return holidays
      .filter(holiday => 
        new Date(holiday.start) >= today &&
        holiday.extendedProps?.status === 'approved'
      )
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5); // Show next 5 upcoming leaves
  };

  const remainingLeave = calculateRemainingLeave();
  const upcomingLeaves = getUpcomingLeaves();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.name?.split(' ')[0] || 'User'}</h1>
        <Link to="/new-request" className="quick-request-btn">
          + New Leave Request
        </Link>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card remaining-leave">
          <h3>Remaining Leave</h3>
          <div className="leave-days">{remainingLeave}</div>
          <p>days left this year</p>
        </div>

        <div className="dashboard-card upcoming-leaves">
          <h3>Upcoming Time Off</h3>
          {upcomingLeaves.length > 0 ? (
            <ul className="upcoming-leaves-list">
              {upcomingLeaves.map((leave, index) => (
                <li key={index} className="upcoming-leave-item">
                  <span className="leave-date">
                    {new Date(leave.start).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  <span className="leave-type">
                    {leave.title.replace(' Request', '')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-leaves">No upcoming leaves scheduled</p>
          )}
        </div>
      </div>

      <div className="team-calendar-section">
        <div className="section-header">
          <h2>Team Calendar</h2>
          <Link to="/calendar" className="view-all">View Full Calendar</Link>
        </div>
        <div className="mini-calendar">
          {/* This would be a simplified version of the calendar */}
          <p>Team calendar view coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
