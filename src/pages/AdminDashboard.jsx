import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, Clock, AlertCircle, Download, Radio, Search, Filter, 
  Calendar, Shield, Play, Trash2, RefreshCw, Sliders, Globe, Activity, Lock,
  LogOut, KeyRound, BarChart2, CheckSquare, Sparkles, UserCheck, Eye, EyeOff, X, Award
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell 
} from 'recharts';
import { 
  fetchStats, fetchDailyAttendance, fetchStudents, deleteStudent, 
  getExportCsvUrl, updateSystemSettings, triggerCronManual, adminLogin, fetchStudentHistory 
} from '../services/api';

export default function AdminDashboard({ socket, networkStatus, onSettingsUpdated }) {
  // Auth state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('admin_authenticated') === 'true';
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('daily-logs');
  const [stats, setStats] = useState({ totalStudents: 0, presentCount: 0, lateCount: 0, absentCount: 0, courseBreakdown: [] });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [liveEvents, setLiveEvents] = useState([]);

  // Inspection Modal State for Individual Student
  const [inspectingStudent, setInspectingStudent] = useState(null);
  const [studentHistoryData, setStudentHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Settings State
  const [demoBypassIp, setDemoBypassIp] = useState(networkStatus?.allowAnyIpForDemo || false);
  const [allowedSubnets, setAllowedSubnets] = useState('192.168.0.0/24, 10.0.0.0/8, 127.0.0.1');

  useEffect(() => {
    if (networkStatus) {
      setDemoBypassIp(networkStatus.allowAnyIpForDemo);
      if (Array.isArray(networkStatus.allowedIpRanges)) {
        setAllowedSubnets(networkStatus.allowedIpRanges.join(', '));
      }
    }
  }, [networkStatus]);

  // Load Dashboard Data
  const loadDashboardData = async () => {
    if (!isAdminAuthenticated) return;
    setLoading(true);
    try {
      const [statsRes, dailyRes, studentsRes] = await Promise.all([
        fetchStats(),
        fetchDailyAttendance(selectedDate, statusFilter, searchQuery),
        fetchStudents()
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (dailyRes.success) setAttendanceRecords(dailyRes.records);
      if (studentsRes.success) setStudents(studentsRes.students);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [isAdminAuthenticated, selectedDate, statusFilter, searchQuery]);

  // Socket.io Real-Time Listener
  useEffect(() => {
    if (!socket || !isAdminAuthenticated) return;

    const handleAttendanceMarked = (data) => {
      console.log('⚡ Socket event [attendance_marked]:', data);
      if (data.stats) setStats(data.stats);
      
      setLiveEvents(prev => [
        {
          id: Date.now(),
          text: `[${data.record.time}] ${data.record.studentName} marked ${data.record.status}`,
          status: data.record.status
        },
        ...prev.slice(0, 9)
      ]);

      loadDashboardData();
    };

    socket.on('attendance_marked', handleAttendanceMarked);

    return () => {
      socket.off('attendance_marked', handleAttendanceMarked);
    };
  }, [socket, isAdminAuthenticated, selectedDate, statusFilter]);

  // Open inspection modal for individual student
  const handleInspectStudent = async (student) => {
    setInspectingStudent(student);
    setLoadingHistory(true);
    try {
      const res = await fetchStudentHistory(student.id);
      if (res.success) {
        setStudentHistoryData(res);
      }
    } catch (err) {
      console.error('Inspection error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Login handler
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);

    try {
      const res = await adminLogin(loginEmail, loginPassword);
      if (res.success) {
        setIsAdminAuthenticated(true);
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_email', res.admin?.email || loginEmail);
      } else {
        setAuthError(res.message || 'Invalid credentials. Please check your admin email and password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setAuthError('Server connection error. Please ensure the backend is running.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Logout handler
  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setLoginEmail('');
    setLoginPassword('');
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_email');
  };

  const handleDeleteStudent = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove student "${name}" (${id})?`)) {
      const res = await deleteStudent(id);
      if (res.success) {
        loadDashboardData();
      }
    }
  };

  const handleToggleDemoBypass = async () => {
    const nextVal = !demoBypassIp;
    setDemoBypassIp(nextVal);
    const ranges = allowedSubnets.split(',').map(s => s.trim()).filter(Boolean);
    const res = await updateSystemSettings({ allowAnyIpForDemo: nextVal, allowedIpRanges: ranges });
    if (res.success && onSettingsUpdated) onSettingsUpdated();
  };

  const handleManualCronRun = async () => {
    const res = await triggerCronManual();
    if (res.success) {
      alert(res.message);
      loadDashboardData();
    }
  };

  // Render Clean Manual Login Card if not authenticated
  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="glass-panel rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/25">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Administrator Portal</h1>
            <p className="text-slate-400 text-xs mt-1">Please enter your admin credentials to access system analytics.</p>
          </div>

          {authError && (
            <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs mb-6 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Admin Email Address *</label>
              <input
                type="email"
                required
                placeholder="Enter admin email address"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Admin Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter admin password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-6"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Log In to Admin Dashboard</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Visual Chart Data
  const pieData = [
    { name: 'Present', value: stats.presentCount, color: '#10b981' },
    { name: 'Late', value: stats.lateCount, color: '#f59e0b' },
    { name: 'Absent', value: stats.absentCount + (stats.unrecordedCount || 0), color: '#f43f5e' }
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      
      {/* Admin Header with Logout Button */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
            <span>Admin Console • Secure Session Active</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">System Analytics & Control</h1>
          <p className="text-slate-400 text-xs mt-1">Logged in as Administrator</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleManualCronRun}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-xs font-semibold text-slate-200 transition-all flex items-center space-x-2 shadow-lg"
            title="Runs automated check to mark students Absent who haven't marked attendance."
          >
            <Play className="w-3.5 h-3.5 text-cyan-400" />
            <span>Trigger Auto-Absent Job</span>
          </button>

          <a
            href={getExportCsvUrl(selectedDate)}
            download
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={handleAdminLogout}
            className="px-4 py-2 rounded-xl bg-rose-950/60 border border-rose-500/40 hover:bg-rose-900 text-rose-300 text-xs font-bold transition-all flex items-center space-x-2 shadow-lg"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Stat Cards (4 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Total Students */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Registered</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">{stats.totalStudents || 0}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Present Today */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Present Today</p>
            <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">{stats.presentCount || 0}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Late Today */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Late Arrivals</p>
            <h3 className="text-3xl font-extrabold text-amber-400 mt-1">{stats.lateCount || 0}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Absent Today */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Absent / Unrecorded</p>
            <h3 className="text-3xl font-extrabold text-rose-400 mt-1">{stats.absentCount + (stats.unrecordedCount || 0)}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Real-time Socket Live Stream Ticker */}
      {liveEvents.length > 0 && (
        <div className="glass-panel rounded-xl p-4 border border-cyan-500/30 mb-8 bg-cyan-950/20">
          <div className="flex items-center space-x-2 text-xs font-bold text-cyan-300 mb-2">
            <Activity className="w-4 h-4 animate-pulse text-cyan-400" />
            <span>REAL-TIME ATTENDANCE STREAM (SOCKET.IO)</span>
          </div>
          <div className="flex items-center space-x-3 overflow-x-auto text-xs font-mono">
            {liveEvents.map(evt => (
              <span key={evt.id} className="px-3 py-1 rounded-full bg-slate-900 border border-cyan-500/40 text-cyan-200 shrink-0">
                {evt.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Content View Switcher Tabs */}
      <div className="glass-panel rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        
        {/* Navigation Bar inside panel */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60 flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('daily-logs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'daily-logs'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Daily Attendance Logs
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Analytics Charts
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'students'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Student Roster ({students.length})
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Network & System Settings
            </button>
          </div>

          {/* Filters for Daily Logs */}
          {activeTab === 'daily-logs' && (
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present Only</option>
                <option value="Late">Late Only</option>
                <option value="Absent">Absent Only</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search student..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 pl-8 pr-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Daily Attendance Logs Table */}
        {activeTab === 'daily-logs' && (
          <div className="p-6">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading logs...</div>
            ) : attendanceRecords.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">No attendance records found for {selectedDate}.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Student ID</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Course & Batch</th>
                      <th className="py-3 px-4">Time Recorded</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Client IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {attendanceRecords.map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-cyan-400 font-semibold">{rec.studentId}</td>
                        <td className="py-3.5 px-4 font-semibold text-white">{rec.studentName}</td>
                        <td className="py-3.5 px-4 text-slate-400">{rec.course} ({rec.batch})</td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">{rec.time}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            rec.status === 'Present'
                              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                              : rec.status === 'Late'
                              ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                          }`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">{rec.ipAddress || 'Local'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Visual Charts Analytics */}
        {activeTab === 'analytics' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pie Chart: Status Distribution */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col items-center">
              <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center space-x-2 self-start">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <span>Overall System Attendance Distribution</span>
              </h3>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart: Course Breakdown */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                <span>Course-wise Attendance Breakdown</span>
              </h3>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.courseBreakdown || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="course" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Bar dataKey="total" fill="#06b6d4" name="Registered" />
                    <Bar dataKey="present" fill="#10b981" name="Present" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Registered Students Roster */}
        {activeTab === 'students' && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Name & Email</th>
                    <th className="py-3 px-4">Course / Branch</th>
                    <th className="py-3 px-4">Face Biometric Status</th>
                    <th className="py-3 px-4">Registration Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {students.map(student => (
                    <tr key={student.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-cyan-400 font-semibold">{student.id}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{student.name}</div>
                        <div className="text-[11px] text-slate-400">{student.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{student.course} ({student.batch})</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          student.faceRegistered
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                            : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                        }`}>
                          {student.faceRegistered ? '128D Face Saved' : 'No Face Data'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        {new Date(student.registeredAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleInspectStudent(student)}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/80 text-[11px] font-semibold transition-all"
                        >
                          Inspect Attendance
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student.id, student.name)}
                          className="p-1.5 rounded-lg bg-rose-950/50 border border-rose-500/30 text-rose-300 hover:bg-rose-900/80 transition-all"
                          title="Delete student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: System & IP Network Controls */}
        {activeTab === 'settings' && (
          <div className="p-6 max-w-3xl space-y-6">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              <span>Institute WiFi Network Restriction Manager</span>
            </h3>

            {/* Network Toggle Card */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-200">Demo IP Restriction Override</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  When enabled, allows attendance submission from any client IP address for local demo & testing flexibility.
                </p>
              </div>

              <button
                onClick={handleToggleDemoBypass}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  demoBypassIp ? 'bg-cyan-600' : 'bg-slate-700'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  demoBypassIp ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Allowed Subnets Config */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Allowed Institute IP Subnet Ranges (Comma Separated)
              </label>
              <input
                type="text"
                value={allowedSubnets}
                onChange={e => setAllowedSubnets(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[11px] text-slate-400">
                Example: <code className="text-cyan-400">192.168.0.0/24, 10.0.0.0/8, 127.0.0.1</code>
              </p>
            </div>

            {/* Time Rules Info Card */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">System Time Cutoffs</h4>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Present Cutoff:</span>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">09:30 AM</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Late Cutoff:</span>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">10:00 AM</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Auto-Absent Cron:</span>
                  <div className="text-sm font-bold text-rose-400 mt-0.5">10:30 AM</div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Individual Student Inspection Modal */}
      {inspectingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => {
                setInspectingStudent(null);
                setStudentHistoryData(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white text-lg font-bold">
                {inspectingStudent.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{inspectingStudent.name}</h3>
                <p className="text-xs font-mono text-cyan-400">{inspectingStudent.id} • {inspectingStudent.course}</p>
              </div>
            </div>

            {loadingHistory ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading student attendance...</div>
            ) : (
              <div>
                <div className="grid grid-cols-3 gap-3 mb-6 text-center text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Attendance Rate</span>
                    <div className="text-lg font-bold text-emerald-400">{studentHistoryData?.summary?.attendancePercentage || 0}%</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Present Sessions</span>
                    <div className="text-lg font-bold text-white">{studentHistoryData?.summary?.present || 0}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Late Sessions</span>
                    <div className="text-lg font-bold text-amber-400">{studentHistoryData?.summary?.late || 0}</div>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Time</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {studentHistoryData?.records?.map(r => (
                        <tr key={r.id}>
                          <td className="py-2 px-3 font-mono text-slate-300">{r.date}</td>
                          <td className="py-2 px-3 font-mono text-slate-300">{r.time}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              r.status === 'Present' ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
