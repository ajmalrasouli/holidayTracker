import React from 'react';
import { Link } from 'react-router-dom';
import { useHoliday } from '../../context/HolidayContext';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faBriefcaseMedical, 
  faMoneyBillWave, 
  faBaby, 
  faBabyCarriage,
  faSadTear
} from '@fortawesome/free-solid-svg-icons';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { holidays } = useHoliday();
  const { user } = useAuth();

  // Calculate remaining leave days by type
  const calculateLeaveBalances = () => {
    const currentYear = new Date().getFullYear();
    const balances = {
      'annual': { used: 0, total: 25, icon: faCalendarAlt, label: 'Annual Leave' },
      'sick': { used: 0, total: 10, icon: faBriefcaseMedical, label: 'Sick Leave' },
      'unpaid': { used: 0, total: 0, icon: faMoneyBillWave, label: 'Unpaid Leave' },
      'maternity': { used: 0, total: 0, icon: faBaby, label: 'Maternity Leave' },
      'paternity': { used: 0, total: 14, icon: faBabyCarriage, label: 'Paternity Leave' },
      'bereavement': { used: 0, total: 5, icon: faSadTear, label: 'Bereavement Leave' },
    };

    // Calculate used days for each leave type
    holidays.forEach(holiday => {
      if (new Date(holiday.start).getFullYear() === currentYear && 
          holiday.extendedProps?.status === 'approved') {
        const type = holiday.extendedProps.type.split('-')[0]; // Get base type (e.g., 'sick' from 'sick-leave')
        if (balances[type as keyof typeof balances]) {
          const start = new Date(holiday.start);
          const end = new Date(holiday.end);
          // Calculate days between start and end (inclusive)
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          
          balances[type as keyof typeof balances].used += diffDays;
        }
      }
    });
    
    return balances;
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

  const leaveBalances = calculateLeaveBalances();
  const upcomingLeaves = getUpcomingLeaves();
  
  // Calculate total remaining leave days across all types
  const totalRemainingLeave = Object.values(leaveBalances).reduce(
    (total, balance) => total + Math.max(0, balance.total - balance.used), 0
  );

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
          <h3>Total Remaining Leave</h3>
          <div className="leave-days">{totalRemainingLeave}</div>
          <p>days left this year</p>
        </div>
        
        <div className="dashboard-card leave-balance">
          <h3>Leave Balance</h3>
          <div className="leave-balance-grid">
            {Object.entries(leaveBalances).map(([key, balance]) => (
              <div key={key} className="leave-balance-item">
                <div className="leave-type-icon">
                  <FontAwesomeIcon icon={balance.icon} />
                  <span>{balance.label}</span>
                </div>
                <div className="leave-amount">
                  <span className="remaining">
                    {Math.max(0, balance.total - balance.used)}
                  </span>
                  <span className="total">/ {balance.total || '∞'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card upcoming-leaves">
          <div className="section-header">
            <h3>Upcoming Time Off</h3>
            <Link to="/my-requests" className="view-all">View All</Link>
          </div>
          {upcomingLeaves.length > 0 ? (
            <ul className="upcoming-leaves-list">
              {upcomingLeaves.map((leave, index) => {
                const startDate = new Date(leave.start);
                const endDate = new Date(leave.end);
                const isSameDay = startDate.toDateString() === endDate.toDateString();
                
                return (
                  <li key={index} className="upcoming-leave-item">
                    <div className="leave-date">
                      {isSameDay 
                        ? startDate.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })
                        : `${startDate.getDate()}-${endDate.getDate()} ${endDate.toLocaleString('default', { month: 'short' })}`
                      }
                    </div>
                    <div className="leave-details">
                      <span className="leave-type" style={{
                        color: leave.backgroundColor || '#3498db'
                      }}>
                        {leave.title.replace(' Request', '')}
                      </span>
                      {leave.extendedProps.notes && (
                        <div className="leave-notes" title={leave.extendedProps.notes}>
                          {leave.extendedProps.notes.length > 30 
                            ? `${leave.extendedProps.notes.substring(0, 30)}...` 
                            : leave.extendedProps.notes}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="no-leaves">
              <p>No upcoming leaves scheduled</p>
              <Link to="/new-request" className="btn btn-primary">
                Request Time Off
              </Link>
            </div>
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
