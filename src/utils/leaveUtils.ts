// src/utils/leaveUtils.ts

import { 
    faCalendarAlt, 
    faBriefcaseMedical, 
    faMoneyBillWave, 
    faBaby,
    faBabyCarriage,
    faSadTear,
    faQuestionCircle
  } from '@fortawesome/free-solid-svg-icons';
  
  const leaveTypeDetails = {
    annual: { 
      label: 'Annual', 
      icon: faCalendarAlt, 
      className: 'leave-type-annual' 
    },
    sick: { 
      label: 'Sick', 
      icon: faBriefcaseMedical, 
      className: 'leave-type-sick' 
    },
    unpaid: { 
      label: 'Unpaid', 
      icon: faMoneyBillWave, 
      className: 'leave-type-unpaid' 
    },
    maternity: { 
      label: 'Maternity', 
      icon: faBaby, 
      className: 'leave-type-maternity' 
    },
    paternity: { 
      label: 'Paternity', 
      icon: faBabyCarriage, 
      className: 'leave-type-paternity' 
    },
    bereavement: { 
      label: 'Bereavement', 
      icon: faSadTear, 
      className: 'leave-type-bereavement' 
    },
    default: {
      label: 'Leave',
      icon: faQuestionCircle,
      className: 'leave-type-default'
    }
  };
  
  export const getLeaveTypeDetails = (type: string) => {
    const baseType = type.split('-')[0] as keyof typeof leaveTypeDetails;
    return leaveTypeDetails[baseType] || leaveTypeDetails.default;
  };