import React from 'react';
import { Scan, ShieldCheck, ShieldAlert, Radio, UserCheck, LayoutDashboard, UserPlus, Camera } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, networkStatus }) {
  const isNetworkAllowed = networkStatus?.isAllowed;
  const clientIp = networkStatus?.clientIp || 'Checking...';

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="relative p-2.5 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-xl shadow-lg shadow-cyan-500/20">
            <Scan className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
                SmartAttend
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
                AI v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Biometric Network Attendance System</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 space-x-1 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Mark Attendance</span>
          </button>

          <button
            onClick={() => setActiveTab('student-register')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
              activeTab === 'student-register'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Face</span>
          </button>

          <button
            onClick={() => setActiveTab('student-dashboard')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
              activeTab === 'student-dashboard'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Student Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Admin Portal</span>
          </button>
        </nav>

        {/* Network & Live Status Indicators */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Socket Live Sync Badge */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
            <Radio className="w-3 h-3 animate-ping text-emerald-400" />
            <span className="font-mono font-medium text-[11px]">Real-Time Sync</span>
          </div>

          {/* Network IP Badge */}
          <div
            title={`Client IP: ${clientIp}`}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all ${
              isNetworkAllowed
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {isNetworkAllowed ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-bounce" />
            )}
            <div className="flex flex-col text-[11px] leading-tight">
              <span className="font-semibold">
                {isNetworkAllowed ? 'Institute WiFi' : 'Outside Network'}
              </span>
              <span className="font-mono text-[10px] opacity-80">{clientIp}</span>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
