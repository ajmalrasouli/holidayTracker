import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faArrowLeft, faCheck } from '@fortawesome/free-solid-svg-icons';

interface User {
  name: string;
  email: string;
}

interface SetupWizardProps {
  onComplete: () => void;
  user: User;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, user }) => {
  const [step, setStep] = useState(1);
  const [annualLeave, setAnnualLeave] = useState(25);
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]); // Monday to Friday
  const [department, setDepartment] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Save settings and complete setup
      const userSettings = {
        annualLeave,
        workingDays,
        department,
        managerEmail,
        setupComplete: true
      };
      
      // Save to localStorage
      localStorage.setItem(`userSettings_${user.email}`, JSON.stringify(userSettings));
      
      // Complete setup
      onComplete();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleWorkingDay = (dayIndex: number) => {
    if (workingDays.includes(dayIndex)) {
      setWorkingDays(workingDays.filter(d => d !== dayIndex));
    } else {
      setWorkingDays([...workingDays, dayIndex].sort());
    }
  };

  const daysOfWeek = [
    { id: 0, name: 'Sunday' },
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Welcome to Holiday Tracker</h2>
          
          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                    step === stepNum 
                      ? 'bg-blue-600' 
                      : step > stepNum 
                        ? 'bg-green-500' 
                        : 'bg-gray-300'
                  }`}
                >
                  {step > stepNum ? <FontAwesomeIcon icon={faCheck} /> : stepNum}
                </div>
                <span className="text-sm mt-2 text-gray-600">
                  {stepNum === 1 ? 'Leave' : stepNum === 2 ? 'Schedule' : 'Team'}
                </span>
              </div>
            ))}
          </div>

          {/* Step 1: Annual Leave */}
          {step === 1 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Annual Leave Allowance</h3>
              <p className="text-gray-600 mb-6">
                How many days of annual leave would you like to allocate for {user.name} this year?
              </p>
              <div className="flex items-center">
                <button 
                  onClick={() => setAnnualLeave(Math.max(0, annualLeave - 1))}
                  className="w-10 h-10 rounded-l-md border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  -
                </button>
                <div className="w-20 text-center border-t border-b border-gray-300 py-2">
                  {annualLeave} days
                </div>
                <button 
                  onClick={() => setAnnualLeave(annualLeave + 1)}
                  className="w-10 h-10 rounded-r-md border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Working Days */}
          {step === 2 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Working Days</h3>
              <p className="text-gray-600 mb-6">
                Select the days you typically work each week.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleWorkingDay(day.id)}
                    className={`py-2 px-4 rounded-md border ${
                      workingDays.includes(day.id)
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {day.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Team Information */}
          {step === 3 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Team Information</h3>
              
              <div className="mb-4">
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="E.g., Engineering, Marketing"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="managerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Manager's Email (for approval requests)
                </label>
                <input
                  type="email"
                  id="managerEmail"
                  value={managerEmail}
                  onChange={(e) => setManagerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="manager@example.com"
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={step === 1 ? () => onComplete() : handlePrev}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {step === 1 ? 'Skip for now' : (
                <>
                  <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                  Back
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={handleNext}
              disabled={step === 3 && (!department || !managerEmail)}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                step === 3 && (!department || !managerEmail)
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {step === 3 ? (
                'Complete Setup'
              ) : (
                <>
                  Next
                  <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
