import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import 'bootstrap/dist/css/bootstrap.min.css';
import { useHoliday } from '../../context/HolidayContext';

const CalendarView: React.FC = () => {
  const { holidays } = useHoliday();



  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={holidays}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        themeSystem="bootstrap5"
        height="auto"
        weekends={true}
        dayHeaderFormat={{ weekday: 'short' }}
        titleFormat={{ year: 'numeric', month: 'long' }}
      />
    </div>
  );
};

export default CalendarView;
