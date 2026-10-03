import React, { useState, useEffect, useRef } from 'react';
import { Camera, ShieldCheck, ShieldAlert, CheckCircle2, Clock, AlertTriangle, RefreshCw, Sparkles, User, WifiOff } from 'lucide-react';
import confetti from 'canvas-confetti';
import { detectFaceAndExtractDescriptor } from '../services/faceApiService';
import { markAttendance, fetchStudents, fetchNetworkStatus } from '../services/api';

export default function AttendancePage({ networkStatus, onAttendanceMarked }) {
  const videoRef = useRef(null);
  const [streamActive, setStreamActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [resultAlert, setResultAlert] = useState(null);
  const [lastMarkedRecord, setLastMarkedRecord] = useState(null);

  // Time cutoff display
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: true }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load students roster for dropdown fallback/select
  useEffect(() => {
    fetchStudents()
      .then(res => {
        if (res.success) setStudents(res.students || []);
      })
      .catch(err => console.error('Error fetching students:', err));
  }, []);

  // Auto start webcam
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setResultAlert({
        type: 'error',
        title: 'Camera Access Error',
        message: 'Could not access webcam. Please allow browser camera access.'
      });
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setStreamActive(false);
    }
  };

  useEffect(() => {
    startWebcam();
    return () => stopWebcam();
  }, []);

  // Auto/Manual Face Scan Handler
  const handleScanAndMark = async (overrideStudentId = null) => {
    if (isScanning || !streamActive) return;
    setIsScanning(true);
    setResultAlert(null);

    try {
      // 1. Extract biometric descriptor from frame
      const faceResult = await detectFaceAndExtractDescriptor(videoRef.current);

      const payload = {
        studentId: overrideStudentId || selectedStudentId || null,
        faceDescriptor: faceResult?.descriptor || null
      };

      // 2. Post to backend
      const res = await markAttendance(payload);

      if (res.success) {
        setResultAlert({
          type: 'success',
          title: 'Attendance Recorded!',
          message: res.message || 'Face detected. Attendance marked successfully.',
          status: res.record?.status
        });
        setLastMarkedRecord(res.record);
        if (onAttendanceMarked) onAttendanceMarked(res.record);

        // Confetti effect
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        // Handle specific business logic error types
        if (res.errorType === 'NETWORK_RESTRICTED') {
          setResultAlert({
            type: 'network_error',
            title: 'Institute Network Blocked',
            message: 'Attendance is only allowed when connected to institute WiFi'
          });
        } else if (res.errorType === 'DUPLICATE_RECORD') {
          setResultAlert({
            type: 'warning',
            title: 'Already Recorded',
            message: 'Attendance already recorded for today',
            record: res.record
          });
        } else if (res.errorType === 'ATTENDANCE_CLOSED') {
          setResultAlert({
            type: 'error',
            title: 'Attendance Closed',
            message: res.message
          });
        } else {
          setResultAlert({
            type: 'error',
            title: 'Recognition Failed',
            message: res.message || 'Face identity not matched. Please center your face or select student ID.'
          });
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
      setResultAlert({
        type: 'error',
        title: 'Connection Error',
        message: 'Failed to communicate with attendance server.'
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Time & Attendance Rules Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold mb-1">
            <Clock className="w-4 h-4" />
            <span>LIVE TIME: {currentTime}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Smart Attendance Terminal</h1>
          <p className="text-slate-400 text-xs mt-1">Automatic face detection with institute network validation</p>
        </div>

        {/* Time Rules Badges */}
        <div className="flex items-center space-x-2 text-[11px] font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
            <span className="font-bold">&lt; 09:30 AM</span> : Present
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300">
            <span className="font-bold">09:30 - 10:00 AM</span> : Late
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300">
            <span className="font-bold">&gt; 10:00 AM</span> : Closed
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Live Biometric Camera Stream */}
        <div className="md:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col items-center">
          
          <div className="w-full flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>AI Face Detection Stream</span>
            </h2>

            {/* Network Indicator */}
            {networkStatus && (
              <span className={`text-[11px] px-2.5 py-1 rounded-full font-mono flex items-center space-x-1.5 border ${
                networkStatus.isAllowed
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                {networkStatus.isAllowed ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
                <span>{networkStatus.isAllowed ? 'WiFi Verified' : 'Network Blocked'}</span>
              </span>
            )}
          </div>

          {/* Camera Container */}
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />

            {/* Glowing Biometric Targeting Reticle */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-60 h-60 border-2 border-cyan-500/40 rounded-3xl relative animate-pulse-glow flex items-center justify-center">
                {/* Reticle Corner Brackets */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />

                <div className="text-[10px] font-mono text-cyan-300 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-500/30 absolute bottom-3">
                  {isScanning ? 'SCANNING BIOMETRICS...' : 'FACE TARGET ACQUIRED'}
                </div>
              </div>
            </div>

            {/* Laser Scan line when scanning */}
            {isScanning && (
              <div className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-laser-scan pointer-events-none shadow-[0_0_20px_#06b6d4]" />
            )}
          </div>

          {/* Scan Action Button */}
          <div className="w-full mt-6">
            <button
              onClick={() => handleScanAndMark()}
              disabled={isScanning || !streamActive}
              className="w-full py-3.5 px-6 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Comparing Biometric Descriptors...</span>
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  <span>Mark Attendance Now (Auto Face Recognition)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right 1 Col: Student Selection & Status Confirmation Box */}
        <div className="space-y-6">
          
          {/* Quick Select Student */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <User className="w-4 h-4 text-cyan-400" />
              <span>Select Student (Optional)</span>
            </h3>

            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="">-- Auto-Detect Face from Camera --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id} - {s.course})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-2">
              If auto-face recognition isn't instant, selecting your ID allows direct biometric verification.
            </p>
          </div>

          {/* Alert / Confirmation Box */}
          {resultAlert && (
            <div className={`glass-panel rounded-2xl p-5 border shadow-2xl transition-all animate-in fade-in duration-300 ${
              resultAlert.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                : resultAlert.type === 'network_error'
                ? 'bg-rose-950/80 border-rose-500/60 text-rose-200'
                : resultAlert.type === 'warning'
                ? 'bg-amber-950/70 border-amber-500/50 text-amber-200'
                : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
            }`}>
              <div className="flex items-start space-x-3">
                {resultAlert.type === 'success' && <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />}
                {resultAlert.type === 'network_error' && <WifiOff className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />}
                {resultAlert.type === 'warning' && <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />}
                {resultAlert.type === 'error' && <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />}

                <div>
                  <h4 className="font-bold text-sm">{resultAlert.title}</h4>
                  <p className="text-xs mt-1 leading-relaxed">{resultAlert.message}</p>

                  {resultAlert.status && (
                    <div className="mt-3 inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-xs font-mono">
                      <span>Status Granted:</span>
                      <span className={`font-bold ${
                        resultAlert.status === 'Present' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {resultAlert.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Last Marked Summary Card */}
          {lastMarkedRecord && (
            <div className="glass-panel rounded-2xl p-5 border border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Latest Session</h4>
              <div className="space-y-1 text-xs text-slate-300 font-mono">
                <div><span className="text-slate-500">Student:</span> {lastMarkedRecord.studentName}</div>
                <div><span className="text-slate-500">ID:</span> {lastMarkedRecord.studentId}</div>
                <div><span className="text-slate-500">Time:</span> {lastMarkedRecord.time}</div>
                <div><span className="text-slate-500">IP:</span> {lastMarkedRecord.ipAddress}</div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
