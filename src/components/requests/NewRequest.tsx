import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHoliday } from '../../context/HolidayContext';
import './NewRequest.css';

type LeaveType = 'Annual Leave' | 'Sick Leave' | 'Unpaid Leave';

const NewRequest: React.FC = () => {
  const { addHoliday } = useHoliday();
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allDay, setAllDay] = useState(true);
  const [leaveType, setLeaveType] = useState<LeaveType>('Annual Leave');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    addHoliday({
      title: `${leaveType} Request`,
      start: startDate,
      end: endDate,
      allDay,
      backgroundColor: leaveType === 'Sick Leave' ? '#d4edda' : 
                     leaveType === 'Unpaid Leave' ? '#f8d7da' : '#f8bbd0',
      borderColor: leaveType === 'Sick Leave' ? '#c3e6cb' : 
                  leaveType === 'Unpaid Leave' ? '#f5c6cb' : '#f8bbd0',
      extendedProps: {
        type: leaveType.toLowerCase().replace(' ', '-'),
        status: 'pending',
      },
    });

    navigate('/my-requests');
  };

  return (
    <div className="new-request">
      <h2>New Holiday Request</h2>
      <form onSubmit={handleSubmit} className="new-request-form">
        <div className="form-group">
          <label>Leave Type</label>
          <select
            className="form-control"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as LeaveType)}
            required
          >
            <option value="Annual Leave">Annual Leave</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Unpaid Leave">Unpaid Leave</option>
          </select>
        </div>
        <div className="form-group">
          <label>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
        <div className="form-group form-check">
          <input
            type="checkbox"
            id="allday"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
          />
          <label htmlFor="allday">All Day</label>
        </div>
        <button type="submit" className="btn btn-primary">
          Submit Request
        </button>
      </form>
    </div>
  );
};

export default NewRequest;
