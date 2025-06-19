import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHoliday } from '../../context/HolidayContext';
import './NewRequest.css';

const NewRequest: React.FC = () => {
  const { addHoliday } = useHoliday();
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allDay, setAllDay] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    addHoliday({
      title: 'Holiday Request',
      start: startDate,
      end: endDate,
      allDay,
      backgroundColor: '#f8bbd0',
      borderColor: '#f8bbd0',
      extendedProps: {
        type: 'holiday',
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
