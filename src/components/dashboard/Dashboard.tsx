import React from 'react';
import { Link } from 'react-router-dom';
import { useHoliday } from '../../context/HolidayContext';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faArrowRight,
  faPlus,
  faCalendarPlus,
  faUsers,
  faChevronRight,
  faBabyCarriage,
  faSadTear,
  faBriefcaseMedical, 
  faMoneyBillWave, 
  faBaby
} from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
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
  
  // Calculate total remaining leave and total leave
  const totalRemainingLeave = Object.values(leaveBalances).reduce(
    (total, balance) => total + (balance.total - balance.used),
    0
  );
  
  // Calculate total available leave days
  const totalLeave = Object.values(leaveBalances).reduce(
    (total, balance) => total + balance.total,
    0
  );
  
  // Calculate remaining leave for the current leave type (default to annual)
  const remainingLeave = leaveBalances.annual ? 
    (leaveBalances.annual.total - leaveBalances.annual.used) : 0;

  // Get leave type color
  const getLeaveTypeColor = (type: string) => {
    switch(type.toLowerCase()) {
      case 'annual':
        return 'var(--color-primary-600)';
      case 'sick':
        return 'var(--color-blue-600)';
      case 'maternity':
        return 'var(--color-pink-600)';
      case 'paternity':
        return 'var(--color-indigo-600)';
      case 'bereavement':
        return 'var(--color-gray-600)';
      case 'unpaid':
        return 'var(--color-yellow-600)';
      default:
        return 'var(--color-primary-600)';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 md:p-8 mb-6 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Welcome back, {user?.name || 'User'}!</h1>
              <p className="text-white/90">
                {upcomingLeaves.length > 0 
                  ? `You have ${upcomingLeaves.length} upcoming leave ${upcomingLeaves.length === 1 ? 'day' : 'days'}.`
                  : 'You have no upcoming leaves scheduled.'}
              </p>
            </div>
            <Link 
              to="/new-request" 
              className="inline-flex items-center justify-center px-5 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-white font-medium transition-all duration-200 border border-white/20 hover:shadow-lg whitespace-nowrap"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              New Leave Request
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Leave Balance Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Your Leave Balance</h2>
                
                {/* Main Balance Display */}
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-gray-600 text-sm font-medium">Annual Leave</h3>
                      <div className="text-4xl font-bold text-gray-900">
                        {remainingLeave}
                        <span className="text-lg text-gray-500 ml-1">/ {totalLeave} days</span>
                      </div>
                    </div>
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-inner">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-600">
                          {Math.round((remainingLeave / totalLeave) * 100)}%
                        </div>
                        <div className="text-xs text-gray-500">remaining</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-gradient-to-r from-primary-500 to-primary-600 h-2.5 rounded-full" 
                      style={{ width: `${(remainingLeave / totalLeave) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium">Used</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {totalLeave - remainingLeave}
                      <span className="text-sm text-gray-500 ml-1">days</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium">Upcoming</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {upcomingLeaves.length}
                      <span className="text-sm text-gray-500 ml-1">days</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium">Pending</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {upcomingLeaves.filter(l => l.extendedProps.status === 'pending').length}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium">Remaining</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {remainingLeave}
                      <span className="text-sm text-gray-500 ml-1">days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Leaves Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Upcoming Leaves</h2>
                  <Link to="/calendar" className="text-sm text-primary-600 hover:text-primary-800 flex items-center">
                    View All <FontAwesomeIcon icon={faArrowRight} className="ml-1 text-xs" />
                  </Link>
                </div>
                
                {upcomingLeaves.length > 0 ? (
                  <ul className="space-y-4">
                    {upcomingLeaves.slice(0, 5).map((leave) => (
                      <li key={leave.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors group">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mr-4">
                            <FontAwesomeIcon icon={faCalendarAlt} className="text-primary-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {leave.extendedProps.type}
                              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                                {leave.extendedProps.status.charAt(0).toUpperCase() + leave.extendedProps.status.slice(1)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {format(new Date(leave.start), 'MMM d')} - {format(new Date(leave.end), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                        <Link 
                          to={`/leave/${leave.id}`}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-primary-600 transition-opacity"
                          title="View details"
                        >
                          <FontAwesomeIcon icon={faChevronRight} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-4xl text-gray-300 mb-3" />
                    <p className="text-gray-500 mb-4">No upcoming leaves scheduled</p>
                    <Link 
                      to="/request-leave" 
                      className="inline-flex items-center text-primary-600 hover:text-primary-800 font-medium"
                    >
                      Request Time Off <FontAwesomeIcon icon={faArrowRight} className="ml-1 text-xs" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Quick Actions</h2>
                <div className="space-y-3">
                  <Link 
                    to="/new-request" 
                    className="flex items-center p-4 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                      <FontAwesomeIcon icon={faCalendarPlus} className="text-primary-600" />
                    </div>
                    <div>
                      <div className="font-medium">Request Time Off</div>
                      <div className="text-xs text-gray-500">Submit a new leave request</div>
                    </div>
                  </Link>
                  <Link 
                    to="/calendar" 
                    className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">View Calendar</div>
                      <div className="text-xs text-gray-500">See all scheduled time off</div>
                    </div>
                  </Link>
                  <Link 
                    to="/calendar" 
                    className="flex items-center p-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <FontAwesomeIcon icon={faUsers} className="text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Team Calendar</div>
                      <div className="text-xs text-gray-500">View team availability</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Team Calendar Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Team Calendar</h2>
                  <Link to="/calendar" className="text-sm text-primary-600 hover:text-primary-800">
                    View Full Calendar
                  </Link>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-4xl text-gray-300 mb-3" />
                  <p className="text-gray-500">Team calendar view coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
