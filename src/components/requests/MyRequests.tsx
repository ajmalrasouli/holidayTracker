import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHoliday, Holiday } from '../../context/HolidayContext';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faClock, 
  faFileAlt, 
  faPaperclip,
  faCheckCircle,
  faTimesCircle,
  faHourglassHalf,
  faTrashAlt,
  faCheck,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { format, parseISO, isSameDay, differenceInDays, addDays, isValid } from 'date-fns';
import './MyRequests.css';

// Helper function to get leave type icon
const getLeaveTypeIcon = (type: string) => {
  switch(type) {
    case 'sick':
      return '🤒';
    case 'unpaid':
      return '💸';
    case 'maternity':
      return '🤱';
    case 'paternity':
      return '👨‍👧';
    case 'bereavement':
      return '😔';
    default:
      return '🏖️';
  }
};

// Helper function to get status icon
const getStatusIcon = (status: string) => {
  switch(status) {
    case 'approved':
      return { icon: faCheckCircle, color: '#28a745' };
    case 'rejected':
      return { icon: faTimesCircle, color: '#dc3545' };
    default:
      return { icon: faHourglassHalf, color: '#ffc107' };
  }
};

const MyRequests: React.FC = () => {
  const { holidays, updateHoliday, removeHoliday } = useHoliday();
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const toggleExpand = (id: string) => {
    setExpandedRequest(expandedRequest === id ? null : id);
  };

  const handleConfirm = (id: string, currentExt: Holiday['extendedProps'], holiday: Holiday) => {
    const updatedHoliday: Holiday = {
      ...holiday,
      extendedProps: {
        ...currentExt,
        status: 'approved' as const,
        approvedAt: new Date().toISOString(),
        approvedBy: user?.name || 'System',
        rejectedAt: null,
        rejectedBy: null
      }
    };
    updateHoliday(updatedHoliday);
  };

  const handleReject = (id: string, currentExt: Holiday['extendedProps'], holiday: Holiday) => {
    const updatedHoliday: Holiday = {
      ...holiday,
      extendedProps: {
        ...currentExt,
        status: 'rejected' as const,
        rejectedAt: new Date().toISOString(),
        rejectedBy: user?.name || 'System',
        approvedAt: null,
        approvedBy: null
      }
    };
    updateHoliday(updatedHoliday);
  };

  const handleCancel = (id: string) => {
    if (window.confirm('Are you sure you want to cancel this leave request?')) {
      removeHoliday(id);
    }
  };

  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Filter holidays based on status
  const filteredHolidays = holidays.filter(holiday => 
    filter === 'all' || holiday.extendedProps.status === filter
  );

  // Sort by date (newest first)
  const sortedHolidays = [...filteredHolidays].sort((a, b) => 
    new Date(b.start).getTime() - new Date(a.start).getTime()
  );

  if (!user) {
    return null; // Or a loading spinner
  }

  return (
    <div className="my-requests">
      <div className="requests-header">
        <h2>My Leave Requests</h2>
        <div className="filter-controls">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approved
          </button>
          <button 
            className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </button>
        </div>
      </div>
      
      <div className="requests-list">
        {sortedHolidays.length === 0 ? (
          <div className="no-requests">
            <p>No leave requests found.</p>
            <button 
              className="btn-primary"
              onClick={() => window.location.href = '/new-request'}
            >
              + New Leave Request
            </button>
          </div>
        ) : (
          <div className="request-cards">
            {sortedHolidays.map((holiday) => {
              const startDate = parseISO(holiday.start);
              const endDate = parseISO(holiday.end);
              const isSameDayRequest = isSameDay(startDate, endDate);
              const totalDays = Math.max(1, differenceInDays(addDays(endDate, 1), startDate));
              
              // Ensure dates are valid
              const isValidStart = isValid(startDate);
              const isValidEnd = isValid(endDate);
              const statusIcon = getStatusIcon(holiday.extendedProps.status);
              
              return (
                <div 
                  key={holiday.id} 
                  className={`request-card ${holiday.extendedProps.status}`}
                >
                  <div 
                    className="request-summary" 
                    onClick={() => toggleExpand(holiday.id)}
                  >
                    <div className="request-type">
                      <span className="type-icon">
                        {getLeaveTypeIcon(holiday.extendedProps.type.split('-')[0])}
                      </span>
                      <span className="type-name">
                        {holiday.title.replace(' Request', '')}
                      </span>
                    </div>
                    
                    <div className="request-dates">
                      <span className="date">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        {isValidStart && isValidEnd ? (
                          isSameDayRequest 
                            ? format(startDate, 'MMM d, yyyy')
                            : `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
                        ) : 'Invalid date'}
                      </span>
                      <span className="duration">
                        <FontAwesomeIcon icon={faClock} />
                        {isValidStart && isValidEnd ? (
                          `${totalDays} ${totalDays > 1 ? 'days' : 'day'}`
                        ) : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="request-status">
                      <span className={`status-badge ${holiday.extendedProps.status}`}>
                        <FontAwesomeIcon icon={statusIcon.icon} />
                        {holiday.extendedProps.status.charAt(0).toUpperCase() + holiday.extendedProps.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="request-actions">
                      {holiday.extendedProps.status === 'pending' && (
                        <>
                          <button 
                            className="btn-icon approve"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirm(holiday.id, holiday.extendedProps, holiday);
                            }}
                            title="Approve"
                          >
                            <FontAwesomeIcon icon={faCheck} />
                          </button>
                          <button 
                            className="btn-icon reject"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(holiday.id, holiday.extendedProps, holiday);
                            }}
                            title="Reject"
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </>
                      )}
                      <button 
                        className="btn-icon delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel(holiday.id);
                        }}
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrashAlt} />
                      </button>
                    </div>
                  </div>
                  
                  {expandedRequest === holiday.id && (
                    <div className="request-details">
                      <div className="detail-row">
                        {holiday.extendedProps.requestedAt && (
                          <div className="detail-item">
                            <span className="detail-label">Requested On:</span>
                            <span className="detail-value">
                              {format(parseISO(holiday.extendedProps.requestedAt), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                        )}
                        
                        {holiday.extendedProps.status === 'approved' && holiday.extendedProps.approvedAt && (
                          <>
                            <div className="detail-item">
                              <span className="detail-label">Approved On:</span>
                              <span className="detail-value">
                                {format(parseISO(holiday.extendedProps.approvedAt), 'MMM d, yyyy h:mm a')}
                              </span>
                            </div>
                            {holiday.extendedProps.approvedBy && (
                              <div className="detail-item">
                                <span className="detail-label">Approved By:</span>
                                <span className="detail-value">
                                  {holiday.extendedProps.approvedBy}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        
                        {holiday.extendedProps.status === 'rejected' && holiday.extendedProps.rejectedAt && (
                          <>
                            <div className="detail-item">
                              <span className="detail-label">Rejected On:</span>
                              <span className="detail-value">
                                {format(parseISO(holiday.extendedProps.rejectedAt), 'MMM d, yyyy h:mm a')}
                              </span>
                            </div>
                            {holiday.extendedProps.rejectedBy && (
                              <div className="detail-item">
                                <span className="detail-label">Rejected By:</span>
                                <span className="detail-value">
                                  {holiday.extendedProps.rejectedBy}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      
                      {holiday.extendedProps.notes && (
                        <div className="detail-notes">
                          <div className="detail-label">
                            <FontAwesomeIcon icon={faFileAlt} /> Notes:
                          </div>
                          <p>{holiday.extendedProps.notes}</p>
                        </div>
                      )}
                      
                      {holiday.extendedProps.attachment && (
                        <div className="detail-attachment">
                          <div className="detail-label">
                            <FontAwesomeIcon icon={faPaperclip} /> Attachment:
                          </div>
                          <button 
                            className="attachment-link"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add attachment handling logic here
                            }}
                          >
                            {holiday.extendedProps.attachment}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRequests;
