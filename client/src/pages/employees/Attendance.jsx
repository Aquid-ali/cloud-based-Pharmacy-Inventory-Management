import React from 'react';
import { FiCalendar, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import ListPage from '../../components/ListPage';
import { attendanceData, Badge } from '../../config/mockData';

const columns = [
  { key: 'name', label: 'Employee' },
  { key: 'date', label: 'Date' },
  { key: 'checkIn', label: 'Check In' },
  { key: 'checkOut', label: 'Check Out' },
  { key: 'hours', label: 'Hours' },
  { key: 'status', label: 'Status', render: (row) => <Badge status={row.status} /> },
];

const Attendance = () => (
  <ListPage
    title="Attendance"
    description="Track staff attendance, check-in times, and working hours."
    stats={[
      { icon: FiCalendar, label: 'Today', value: attendanceData.length, bgTint: 'bg-[#346560]/10', iconColor: 'text-[#346560]', borderColor: 'border-[#346560]/20' },
      { icon: FiCheckCircle, label: 'Present', value: attendanceData.filter((a) => a.status === 'Present').length, bgTint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', borderColor: 'border-emerald-500/20' },
      { icon: FiXCircle, label: 'Absent', value: attendanceData.filter((a) => a.status === 'Absent').length, bgTint: 'bg-rose-500/10', iconColor: 'text-rose-600', borderColor: 'border-rose-500/20' },
      { icon: FiClock, label: 'Late', value: attendanceData.filter((a) => a.status === 'Late').length, bgTint: 'bg-amber-500/10', iconColor: 'text-amber-600', borderColor: 'border-amber-500/20' },
    ]}
    columns={columns}
    data={attendanceData}
    searchPlaceholder="Search attendance..."
  />
);

export default Attendance;
