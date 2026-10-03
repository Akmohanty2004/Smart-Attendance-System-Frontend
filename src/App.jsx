import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Navbar from './components/Navbar';
import TimeMachineSimulator from './components/TimeMachineSimulator';
import AttendancePage from './pages/AttendancePage';
import StudentRegistration from './pages/StudentRegistration';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { fetchNetworkStatus } from './services/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function App() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [socket, setSocket] = useState(null);
  const [networkStatus, setNetworkStatus] = useState(null);

  // Initialize Socket.io connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('⚡ Connected to Socket.io server:', newSocket.id);
    });

    newSocket.on('settings_updated', () => {
      loadNetworkStatus();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const loadNetworkStatus = async () => {
    try {
      const res = await fetchNetworkStatus();
      if (res.success) {
        setNetworkStatus(res);
      }
    } catch (err) {
      console.error('Error fetching network status:', err);
    }
  };

  useEffect(() => {
    loadNetworkStatus();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        networkStatus={networkStatus}
      />

      {/* Evaluation Time Machine Simulator Header */}
      <TimeMachineSimulator
        networkStatus={networkStatus}
        onSettingsUpdated={() => loadNetworkStatus()}
      />

      {/* Main View Container */}
      <main className="flex-1 pb-16">
        {activeTab === 'attendance' && (
          <AttendancePage
            networkStatus={networkStatus}
            onAttendanceMarked={() => loadNetworkStatus()}
          />
        )}

        {activeTab === 'student-register' && (
          <StudentRegistration
            onRegistered={() => {
              setActiveTab('student-dashboard');
            }}
          />
        )}

        {activeTab === 'student-dashboard' && (
          <StudentDashboard />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            socket={socket}
            networkStatus={networkStatus}
            onSettingsUpdated={() => loadNetworkStatus()}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 bg-slate-950 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Smart Attendance System • AI Face Recognition & Institute Network Protocol</span>
          <span className="font-mono text-[11px]">Smart Attendance AI</span>
        </div>
      </footer>
    </div>
  );
}
