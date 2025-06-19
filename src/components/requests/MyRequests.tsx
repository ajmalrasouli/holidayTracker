import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHoliday } from '../../context/HolidayContext';
import { useAuth } from '../../context/AuthContext';
import './MyRequests.css';

const MyRequests: React.FC = () => {
  const { holidays, updateHoliday, removeHoliday } = useHoliday();

  const handleConfirm = (id: string, currentExt: typeof holidays[number]['extendedProps']) => {
    updateHoliday(id, { extendedProps: { ...currentExt, status: 'approved' } });
  };

  const handleCancel = (id: string) => {
    removeHoliday(id);
  };

  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null; // Or a loading spinner
  }

  return (
    <div className="my-requests">
      <h2>{user?.name || 'User'}'s Holiday Requests</h2>
      <div className="requests-list">
        {holidays.length === 0 ? (
          <p>No holiday requests found.</p>
        ) : (
          <table className="requests-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {holidays.map((holiday) => (
                <tr key={holiday.id}>
                  <td>{holiday.title || 'N/A'}</td>
                  <td>{new Date(holiday.start).toLocaleDateString()}</td>
                  <td>{new Date(holiday.end).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${holiday.extendedProps.status}`}>
                      {holiday.extendedProps.status}
                    </span>
                  </td>
                  <td>{holiday.extendedProps.type}</td>
                  <td>
                    {holiday.extendedProps.status === 'pending' && (
                        <button
                          className="btn-action"
                          onClick={() => handleConfirm(holiday.id, holiday.extendedProps)}
                        >
                          Confirm
                        </button>
                      )}
                      {holiday.extendedProps.status !== 'approved' && (
                        <button className="btn-action" onClick={() => handleCancel(holiday.id)}>
                          Cancel
                        </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MyRequests;
