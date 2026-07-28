import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';

const CustomDropdown = ({ value, options, onChange, isOpen, setIsOpen }) => {
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1 border border-slate-600 rounded-lg text-slate-300 cursor-pointer flex items-center gap-2 hover:bg-slate-700/50 transition-colors min-w-32 justify-between bg-slate-800/50"
      >
        <span>{options.find(opt => opt.value === value)?.label || value}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto w-full">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-600/20 transition-colors ${
                  option.value === value ? 'bg-blue-600/30 text-blue-400 font-medium' : 'text-slate-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function DateRangePicker({ onRangeChange, availableDates, currentRange, onClose }) {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selecting, setSelecting] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [selectedQuickRange, setSelectedQuickRange] = useState(null);

  // Calculate date range for quick ranges
  const calculateQuickRangeDates = (rangeKey) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (rangeKey) {
      case 'TODAY':
        return { start: today, end: today };

      case 'YESTERDAY': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { start: yesterday, end: yesterday };
      }

      case 'THIS_WEEK': {
        const dayOfWeek = today.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(today);
        monday.setDate(monday.getDate() - diff);
        return { start: monday, end: today };
      }

      case 'LAST_WEEK': {
        const dayOfWeek = today.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const lastMonday = new Date(today);
        lastMonday.setDate(lastMonday.getDate() - diff - 7);
        const lastSunday = new Date(lastMonday);
        lastSunday.setDate(lastSunday.getDate() + 6);
        return { start: lastMonday, end: lastSunday };
      }

      case 'TWO_WEEKS': {
        const twoWeeksAgo = new Date(today);
        twoWeeksAgo.setDate(today.getDate() - 14);
        return { start: twoWeeksAgo, end: today };
      }

      case 'THIS_MONTH': {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: firstDay, end: today };
      }

      case 'LAST_MONTH': {
        const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
        return { start: firstDay, end: lastDay };
      }

      case 'THIS_YEAR': {
        const firstDay = new Date(today.getFullYear(), 0, 1);
        return { start: firstDay, end: today };
      }

      case 'LAST_YEAR': {
        const firstDay = new Date(today.getFullYear() - 1, 0, 1);
        const lastDay = new Date(today.getFullYear() - 1, 11, 31);
        return { start: firstDay, end: lastDay };
      }

      case 'ALL':
        return { start: null, end: null };

      default:
        return { start: null, end: null };
    }
  };

  useEffect(() => {
    // Set selected quick range based on currentRange and show dates on calendar
    const rangeIndex = quickRanges.findIndex(r => r.key === currentRange);
    if (rangeIndex !== -1) {
      setSelectedQuickRange(rangeIndex);

      // Calculate and display the date range for this quick range
      const { start, end } = calculateQuickRangeDates(currentRange);
      if (start && end) {
        setStartDate(start);
        setEndDate(end);
        setCurrentMonth(new Date(start.getFullYear(), start.getMonth(), 1));
      } else {
        setStartDate(null);
        setEndDate(null);
      }
    } else if (currentRange === 'CUSTOM') {
      setSelectedQuickRange(null);
    }
  }, [currentRange]);

  const quickRanges = [
    { label: 'Today', key: 'TODAY', days: 0 },
    { label: 'Yesterday', key: 'YESTERDAY', days: 1 },
    { label: 'This Week', key: 'THIS_WEEK', custom: 'thisWeek' },
    { label: 'Last Week', key: 'LAST_WEEK', custom: 'lastWeek' },
    { label: 'Last 2 Weeks', key: 'TWO_WEEKS', custom: 'twoWeeks' },
    { label: 'This Month', key: 'THIS_MONTH', custom: 'thisMonth' },
    { label: 'Last Month', key: 'LAST_MONTH', custom: 'prevMonth' },
    { label: 'This Year', key: 'THIS_YEAR', custom: 'thisYear' },
    { label: 'Last Year', key: 'LAST_YEAR', custom: 'lastYear' },
    { label: 'All Time', key: 'ALL', custom: 'all' }
  ];

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    const days = [];

    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const isDateInRange = (date) => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const isDateSelected = (date) => {
    return (startDate && date.toDateString() === startDate.toDateString()) ||
           (endDate && date.toDateString() === endDate.toDateString());
  };

  const handleDateClick = (date) => {
    setSelectedQuickRange(null);
    if (!selecting) {
      setStartDate(date);
      setEndDate(null);
      setSelecting(true);
    } else {
      if (date < startDate) {
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
      setSelecting(false);
    }
  };

  const handleQuickRange = (range, idx) => {
    if (range.key !== 'CUSTOM') {
      onRangeChange(range.key);
      setSelectedQuickRange(idx);
      setSelecting(false);

      // Calculate and display the date range for this quick range
      const { start, end } = calculateQuickRangeDates(range.key);
      if (start && end) {
        setStartDate(start);
        setEndDate(end);
        setCurrentMonth(new Date(start.getFullYear(), start.getMonth(), 1));
      } else {
        setStartDate(null);
        setEndDate(null);
      }
    }
  };

  const handleApply = () => {
    if (startDate && endDate) {
      onRangeChange('CUSTOM', startDate, endDate);
    }
    if (onClose) onClose();
  };

  const handleCancel = () => {
    setStartDate(null);
    setEndDate(null);
    setSelecting(false);
    if (onClose) onClose();
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatDateRange = () => {
    if (!startDate || !endDate) return 'Select date range';
    const options = { month: 'short', day: 'numeric', year: 'numeric' };

    // If a quick range is selected, show the range name along with dates
    if (selectedQuickRange !== null) {
      const rangeName = quickRanges[selectedQuickRange].label;
      return `${rangeName}: ${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
    }

    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  const days = getDaysInMonth(currentMonth);

  const currentYear = currentMonth.getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 rounded-xl shadow-2xl overflow-hidden border border-slate-700/50 max-w-3xl">
      <div className="flex">
        {/* Quick ranges sidebar */}
        <div className="w-40 border-r border-slate-700/50 p-3 bg-slate-900/30">
          <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Quick Select</h3>
          {quickRanges.map((range, idx) => (
            <React.Fragment key={idx}>
              <button
                onClick={() => handleQuickRange(range, idx)}
                className={`w-full text-left px-2 py-1.5 text-xs rounded-md transition-all mb-0.5 ${
                  selectedQuickRange === idx
                    ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white font-medium shadow-md shadow-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                {range.label}
              </button>
              {idx === 1 && <div className="my-1.5 border-t border-slate-700/50" />}
              {idx === 6 && <div className="my-1.5 border-t border-slate-700/50" />}
            </React.Fragment>
          ))}
        </div>

        {/* Calendar */}
        <div className="flex-1 p-4">
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white">Select Date Range</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            )}
          </div>

          {/* Month/Year selector */}
          <div className="flex items-center justify-center mb-4 gap-3">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-700/50 rounded-full transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-300" />
            </button>

            <div className="flex gap-2">
              <CustomDropdown
                value={currentMonth.getMonth()}
                options={monthNames.map((month, idx) => ({ value: idx, label: month }))}
                onChange={(value) => setCurrentMonth(new Date(currentMonth.getFullYear(), value, 1))}
                isOpen={showMonthDropdown}
                setIsOpen={setShowMonthDropdown}
              />

              <CustomDropdown
                value={currentMonth.getFullYear()}
                options={yearOptions.map(year => ({ value: year, label: year.toString() }))}
                onChange={(value) => setCurrentMonth(new Date(value, currentMonth.getMonth(), 1))}
                isOpen={showYearDropdown}
                setIsOpen={setShowYearDropdown}
              />
            </div>

            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-700/50 rounded-full transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {dayNames.map(day => (
              <div key={day} className="text-center text-[10px] font-semibold text-slate-400 py-1 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day, idx) => {
              const isInRange = isDateInRange(day.date);
              const isSelected = isDateSelected(day.date);
              const isToday = day.date.toDateString() === new Date().toDateString();

              return (
                <button
                  key={idx}
                  onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
                  className={`
                    aspect-square flex items-center justify-center text-xs rounded-md transition-all
                    ${!day.isCurrentMonth ? 'text-slate-600' : 'text-slate-300'}
                    ${isInRange && !isSelected ? 'bg-blue-600/20' : ''}
                    ${isSelected ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold shadow-md shadow-blue-500/30' : ''}
                    ${isToday && !isSelected ? 'border border-blue-500' : ''}
                    ${day.isCurrentMonth ? 'hover:bg-slate-700/50 cursor-pointer' : 'cursor-default'}
                  `}
                >
                  {day.date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/50">
            <div className="text-sm text-slate-300 font-medium">
              {formatDateRange()}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-all border border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={!startDate || !endDate}
                className="px-6 py-2 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
