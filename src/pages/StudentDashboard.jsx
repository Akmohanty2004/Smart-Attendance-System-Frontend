import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Calendar, ShieldCheck, CheckCircle2, Clock, AlertCircle, Award, Sparkles, LogOut, Lock, KeyRound, BarChart2, Eye, EyeOff, RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid 
} from 'recharts';
import { studentLogin, fetchStudentHistory } from '../services/api';

export default function StudentDashboard() {
  // Auth state
  const [loggedStudent, setLoggedStudent] = useState(() => {
    const saved = localStorage.getItem('student_logged_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // History state
  const [studentHistory, setStudentHistory] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch logged student's attendance history
  useEffect(() => {
    if (loggedStudent?.id) {
      setLoading(true);
      fetchStudentHistory(loggedStudent.id)
        .then(res => {
          if (res.success) {
            setStudentHistory(res);
          }
        })
        .catch(err => console.error('History error:', err))
        .finally(() => setLoading(false));
    }
  }, [loggedStudent]);

  // Handle password login
  const handleStudentLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);

    try {
      const res = await studentLogin(loginIdentifier, loginPassword);
      if (res.success && res.student) {
        setLoggedStudent(res.student);
        localStorage.setItem('student_logged_user', JSON.stringify(res.student));
      } else {
        setAuthError(res.message || 'Invalid Student ID/Email or Password.');
      }
    } catch (err) {
      console.error('Student login error:', err);
      setAuthError('Server connection error. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleStudentLogout = () => {
    setLoggedStudent(null);
    setLoginIdentifier('');
    setLoginPassword('');
    setStudentHistory(null);
    localStorage.removeItem('student_logged_user');
  };

  // Student Password Login Screen (Strict Privacy Isolation)
  if (!loggedStudent) {
    return (
      <div className="max-w-md mx-auto py-12 sm:py-16 px-4">
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 via-sky-600 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-cyan-500/25">
              <UserCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Student Dashboard Login</h1>
            <p className="text-slate-400 text-xs mt-1">Enter your Student ID / Email and password to view your personal attendance dashboard.</p>
          </div>

          {authError && (
            <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs mb-6 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleStudentLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Student ID or Email *</label>
              <input
                type="text"
                required
                placeholder="e.g. STU-1001 or alex.j@institute.edu"
                value={loginIdentifier}
                onChange={e => setLoginIdentifier(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Student Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your student password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all pr-10"
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
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-6"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Log In to Private Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Hint Helper */}
          <div className="mt-8 pt-4 border-t border-slate-800 text-[11px] text-slate-400 text-center font-mono">
            <span>Demo passwords: <code className="text-cyan-400">Alex@1234</code>, <code className="text-cyan-400">Sophia@1234</code></span>
          </div>
        </div>
      </div>
    );
  }

  // Personal Chart Data
  const studentPieData = [
    { name: 'Present', value: studentHistory?.summary?.present || 0, color: '#10b981' },
    { name: 'Late', value: studentHistory?.summary?.late || 0, color: '#f59e0b' },
    { name: 'Absent', value: studentHistory?.summary?.absent || 0, color: '#f43f5e' }
  ];

  const studentBarData = [
    { name: 'Present', count: studentHistory?.summary?.present || 0 },
    { name: 'Late', count: studentHistory?.summary?.late || 0 },
    { name: 'Absent', count: studentHistory?.summary?.absent || 0 }
  ];

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 px-4">
      
      {/* Header with Logout Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Private Student Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Personal Attendance Dashboard</h1>
          <p className="text-slate-400 text-xs mt-1">Logged in as: <span className="text-cyan-400 font-semibold">{loggedStudent.name}</span> ({loggedStudent.id})</p>
        </div>

        <button
          onClick={handleStudentLogout}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-rose-300 text-xs font-bold transition-all flex items-center space-x-2 shadow"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>

      {/* Top 3 Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Profile Card */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Sparkles className="w-24 h-24 text-cyan-400" />
          </div>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-cyan-500/20 shrink-0">
              {loggedStudent.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">{loggedStudent.name}</h3>
              <p className="text-xs font-mono text-cyan-400">{loggedStudent.id}</p>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{loggedStudent.course} • {loggedStudent.batch}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Face Biometrics:</span>
            <span className={`px-2.5 py-0.5 rounded-full font-semibold flex items-center space-x-1 border ${
              loggedStudent.faceRegistered
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{loggedStudent.faceRegistered ? 'Biometrics Enrolled' : 'Not Enrolled'}</span>
            </span>
          </div>
        </div>

        {/* Attendance Rate Gauge */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
            <Award className="w-5 h-5 text-amber-400" />
          </div>

          <div className="my-3">
            <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
              {studentHistory?.summary?.attendancePercentage || 0}%
            </div>
            <p className="text-xs text-slate-400 mt-1">Based on {studentHistory?.summary?.total || 0} personal total sessions</p>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${studentHistory?.summary?.attendancePercentage || 0}%` }}
            />
          </div>
        </div>

        {/* Breakdown Stat Counters */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl grid grid-cols-3 gap-2 text-center sm:col-span-2 lg:col-span-1">
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-1" />
            <span className="text-xl font-bold text-white">{studentHistory?.summary?.present || 0}</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Present</span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <Clock className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-xl font-bold text-white">{studentHistory?.summary?.late || 0}</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Late</span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <AlertCircle className="w-5 h-5 text-rose-400 mb-1" />
            <span className="text-xl font-bold text-white">{studentHistory?.summary?.absent || 0}</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Absent</span>
          </div>
        </div>

      </div>

      {/* Personal Analytics Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        
        {/* Personal Status Pie Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col items-center">
          <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center space-x-2 self-start">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            <span>Personal Attendance Status Breakdown</span>
          </h3>
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={studentPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
                  {studentPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Personal Session Bar Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl">
          <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <span>Personal Session Count Breakdown</span>
          </h3>
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studentBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Bar dataKey="count" name="Sessions" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Personal Attendance History Table */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl">
        <h2 className="text-base font-bold text-white flex items-center space-x-2 mb-4">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <span>My Attendance Record History</span>
        </h2>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading personal records...</div>
        ) : !studentHistory?.records || studentHistory.records.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">No attendance history recorded yet for your student profile.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Time Recorded</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Network / IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {studentHistory.records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-300">{rec.date}</td>
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
                    <td className="py-3.5 px-4 font-mono text-slate-400">{rec.ipAddress || 'Institute Network'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
