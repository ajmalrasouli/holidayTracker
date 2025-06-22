import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useHoliday, Holiday } from '../../context/HolidayContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPaperclip, faCalendarAlt, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import './LeaveRequestWizard.css';

type LeaveType = 'Annual Leave' | 'Sick Leave' | 'Unpaid Leave' | 'Maternity Leave' | 'Paternity Leave' | 'Bereavement Leave';
type LeaveDuration = 'full-day' | 'half-day' | 'multiple-days';
type HalfDayOption = 'morning' | 'afternoon';

interface LeaveRequestWizardProps {
  // Add any props if needed
}

const LeaveRequestWizard: React.FC<LeaveRequestWizardProps> = () => {
  const { addHoliday } = useHoliday();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    leaveType: 'Annual Leave' as LeaveType,
    startDate: '',
    endDate: '',
    duration: 'full-day' as LeaveDuration,
    halfDayOption: 'morning' as HalfDayOption,
    notes: '',
    attachment: null as File | null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        attachment: e.target.files![0]
      }));
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const { user } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      const leaveTitle = `${formData.leaveType} Request`;
      const startDate = new Date(formData.startDate);
      const endDate = formData.duration === 'multiple-days' ? new Date(formData.endDate) : startDate;

      // Validate dates
      if (isNaN(startDate.getTime())) {
        throw new Error('Start date is invalid');
      }
      if (formData.duration === 'multiple-days' && isNaN(endDate.getTime())) {
        throw new Error('End date is invalid');
      }
      if (endDate < startDate) {
        throw new Error('End date must be after start date');
      }

      // Adjust for half-day if needed
      if (formData.duration === 'half-day') {
        if (formData.halfDayOption === 'afternoon') {
          startDate.setHours(13, 0, 0, 0);
        } else {
          startDate.setHours(9, 0, 0, 0);
          endDate.setHours(13, 0, 0, 0);
        }
      }

      const newHoliday: Omit<Holiday, 'id'> = {
        title: leaveTitle,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        allDay: formData.duration === 'full-day' || formData.duration === 'multiple-days',
        backgroundColor: getLeaveTypeColor(formData.leaveType),
        borderColor: getLeaveTypeBorderColor(formData.leaveType),
        extendedProps: {
          type: formData.leaveType.toLowerCase().replace(' ', '-'),
          status: 'pending',
          notes: formData.notes,
          attachment: formData.attachment ? formData.attachment.name : null,
          requestedAt: new Date().toISOString(),
          requestedBy: user?.name || 'System',
          approvedAt: null,
          approvedBy: null,
          rejectedAt: null,
          rejectedBy: null,
        },
      };
      
      addHoliday(newHoliday);
      setSuccess(true);
      navigate('/my-requests');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while submitting your request');
    }
  };

  const getLeaveTypeColor = (type: LeaveType): string => {
    const colors: Record<LeaveType, string> = {
      'Annual Leave': '#f8bbd0',
      'Sick Leave': '#d4edda',
      'Unpaid Leave': '#f8d7da',
      'Maternity Leave': '#e2e3f3',
      'Paternity Leave': '#d1ecf1',
      'Bereavement Leave': '#e2e3f3',
    };
    return colors[type] || '#f8bbd0';
  };

  const getLeaveTypeBorderColor = (type: LeaveType): string => {
    const colors: Record<LeaveType, string> = {
      'Annual Leave': '#f8bbd0',
      'Sick Leave': '#c3e6cb',
      'Unpaid Leave': '#f5c6cb',
      'Maternity Leave': '#d6d8f5',
      'Paternity Leave': '#bee5eb',
      'Bereavement Leave': '#d6d8f5',
    };
    return colors[type] || '#f8bbd0';
  };

  const Step1 = () => (
    <div className="step-content">
      <h3>Select Leave Type</h3>
      <div className="leave-type-options">
        {[
          'Annual Leave', 
          'Sick Leave', 
          'Unpaid Leave', 
          'Maternity Leave', 
          'Paternity Leave', 
          'Bereavement Leave'
        ].map((type) => (
          <div 
            key={type}
            className={`leave-type-option ${formData.leaveType === type ? 'selected' : ''}`}
            onClick={() => setFormData({...formData, leaveType: type as LeaveType})}
          >
            <div className="leave-type-icon">
              {type === 'Sick Leave' ? '🤒' : 
               type === 'Unpaid Leave' ? '💸' : 
               type === 'Maternity Leave' ? '🤱' :
               type === 'Paternity Leave' ? '👨‍👧' :
               type === 'Bereavement Leave' ? '😔' : '🏖️'}
            </div>
            <span>{type}</span>
          </div>
        ))}
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" onClick={nextStep}>
          Next
        </button>
      </div>
    </div>
  );

  const Step2 = () => (
    <div className="step-content">
      <h3>When do you want to take leave?</h3>
      
      <div className="form-group">
        <label>Duration</label>
        <div className="duration-options">
          <label className="duration-option">
            <input
              type="radio"
              name="duration"
              value="full-day"
              checked={formData.duration === 'full-day'}
              onChange={handleChange}
            />
            <span>Full Day</span>
          </label>
          <label className="duration-option">
            <input
              type="radio"
              name="duration"
              value="half-day"
              checked={formData.duration === 'half-day'}
              onChange={handleChange}
            />
            <span>Half Day</span>
          </label>
          <label className="duration-option">
            <input
              type="radio"
              name="duration"
              value="multiple-days"
              checked={formData.duration === 'multiple-days'}
              onChange={handleChange}
            />
            <span>Multiple Days</span>
          </label>
        </div>
      </div>

      <div className="form-group">
        <label>Start Date</label>
        <div className="input-with-icon">
          <FontAwesomeIcon icon={faCalendarAlt} />
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      {formData.duration === 'multiple-days' && (
        <div className="form-group">
          <label>End Date</label>
          <div className="input-with-icon">
            <FontAwesomeIcon icon={faCalendarAlt} />
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
              min={formData.startDate || new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      )}

      {formData.duration === 'half-day' && (
        <div className="form-group">
          <label>Time</label>
          <div className="duration-options">
            <label className="duration-option">
              <input
                type="radio"
                name="halfDayOption"
                value="morning"
                checked={formData.halfDayOption === 'morning'}
                onChange={handleChange}
              />
              <span>Morning (9 AM - 1 PM)</span>
            </label>
            <label className="duration-option">
              <input
                type="radio"
                name="halfDayOption"
                value="afternoon"
                checked={formData.halfDayOption === 'afternoon'}
                onChange={handleChange}
              />
              <span>Afternoon (1 PM - 5 PM)</span>
            </label>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={prevStep}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <button type="button" className="btn btn-primary" onClick={nextStep}>
          Next
        </button>
      </div>
    </div>
  );

  const Step3 = () => (
    <div className="step-content">
      <h3>Additional Information</h3>
      
      <div className="form-group">
        <label>Notes (Optional)</label>
        <div className="input-with-icon">
          <FontAwesomeIcon icon={faFileAlt} />
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add any additional information about your leave request..."
            rows={4}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Attachment (Optional)</label>
        <div className="file-upload">
          <label className="file-upload-label">
            <FontAwesomeIcon icon={faPaperclip} />
            <span>{formData.attachment ? formData.attachment.name : 'Upload supporting document'}</span>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,image/*"
              style={{ display: 'none' }}
            />
          </label>
          {formData.attachment && (
            <button 
              type="button" 
              className="btn-text"
              onClick={() => setFormData({...formData, attachment: null})}
            >
              Remove
            </button>
          )}
        </div>
        <small className="text-muted">
          Upload supporting documents like medical certificates (PDF, DOC, JPG, PNG up to 5MB)
        </small>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={prevStep}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <button type="submit" className="btn btn-primary">
          Submit Request
        </button>
      </div>
    </div>
  );

  const steps = [
    { number: 1, label: 'Leave Type' },
    { number: 2, label: 'Dates' },
    { number: 3, label: 'Details' },
  ];

  return (
    <div className="leave-request-wizard">
      <div className="wizard-header">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <h2>Request Leave</h2>
      </div>
      
      <div className="progress-steps">
        {steps.map((stepItem, index) => (
          <React.Fragment key={stepItem.number}>
            <div className={`step ${step === stepItem.number ? 'active' : ''} ${step > stepItem.number ? 'completed' : ''}`}>
              <div className="step-number">{step > stepItem.number ? '✓' : stepItem.number}</div>
              <div className="step-label">{stepItem.label}</div>
            </div>
            {index < steps.length - 1 && <div className="step-connector"></div>}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="success-message">
          <p>Your leave request has been submitted successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="wizard-form">
        {step === 1 && <Step1 />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}
      </form>
    </div>
  );
};

export default LeaveRequestWizard;
