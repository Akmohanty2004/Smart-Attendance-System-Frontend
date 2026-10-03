import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle2, AlertCircle, RefreshCw, UserPlus, Sparkles, ShieldCheck, Eye, EyeOff, Lock } from 'lucide-react';
import { detectFaceAndExtractDescriptor } from '../services/faceApiService';
import { registerStudent } from '../services/api';

export default function StudentRegistration({ onRegistered }) {
  const videoRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    course: 'Computer Science',
    batch: '2024-2028'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedDescriptor, setCapturedDescriptor] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Start webcam
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
      console.error('Error accessing webcam:', err);
      setStatusMessage({
        type: 'error',
        text: 'Unable to access camera. Please allow camera permissions.'
      });
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setStreamActive(false);
    }
  };

  useEffect(() => {
    startWebcam();
    return () => stopWebcam();
  }, []);

  const handleCaptureFace = async () => {
    if (!videoRef.current || !streamActive) return;
    setIsCapturing(true);
    setStatusMessage({ type: 'info', text: 'Analyzing camera stream and extracting face descriptor...' });

    try {
      const result = await detectFaceAndExtractDescriptor(videoRef.current);
      if (result && result.descriptor && result.descriptor.length === 128) {
        setCapturedDescriptor(result.descriptor);
        setStatusMessage({
          type: 'success',
          text: `Face biometric descriptor successfully captured! (128-point vector generated, confidence ${(result.score * 100).toFixed(0)}%)`
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'No clear face detected in frame. Please center your face in the camera view.'
        });
      }
    } catch (err) {
      console.error('Error capturing face:', err);
      setStatusMessage({ type: 'error', text: 'Failed to process face biometrics.' });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!capturedDescriptor) {
      setStatusMessage({
        type: 'error',
        text: 'Please capture your face biometric data before submitting.'
      });
      return;
    }

    if (formData.password.length < 6) {
      setStatusMessage({
        type: 'error',
        text: 'Password must be at least 6 characters long.'
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setStatusMessage({
        type: 'error',
        text: 'Password and Confirm Password do not match.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await registerStudent({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        studentId: formData.studentId,
        course: formData.course,
        batch: formData.batch,
        faceDescriptor: capturedDescriptor
      });

      if (response.success) {
        setStatusMessage({
          type: 'success',
          text: response.message || 'Student profile, password & face biometrics registered successfully!'
        });
        setFormData({
          name: '', email: '', password: '', confirmPassword: '', studentId: '', course: 'Computer Science', batch: '2024-2028'
        });
        setCapturedDescriptor(null);
        if (onRegistered) onRegistered(response.student);
      } else {
        setStatusMessage({
          type: 'error',
          text: response.message || 'Failed to register student.'
        });
      }
    } catch (err) {
      console.error('Registration error:', err);
      setStatusMessage({ type: 'error', text: 'Server error during student registration.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Biometric & Password Enrollment</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Student Registration</h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-lg mx-auto">
          Capture high-precision face biometrics and create your personal password for secure attendance portal login.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: Camera & Face Capture */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col items-center">
          <h2 className="text-base font-bold text-slate-200 flex items-center space-x-2 mb-4 self-start">
            <Camera className="w-5 h-5 text-cyan-400" />
            <span>Webcam Biometric Capture</span>
          </h2>

          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border-2 border-slate-700/80 shadow-inner flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />

            {/* Target Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full border-2 border-dashed transition-all duration-300 ${
                capturedDescriptor ? 'border-emerald-400 bg-emerald-500/10 scale-105' : 'border-cyan-400/70 animate-pulse'
              } flex items-center justify-center`}>
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border border-cyan-500/30" />
              </div>
            </div>

            {/* Scanning Line effect during capture */}
            {isCapturing && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-laser-scan pointer-events-none shadow-[0_0_15px_#06b6d4]" />
            )}
          </div>

          <div className="w-full flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={handleCaptureFace}
              disabled={!streamActive || isCapturing}
              className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 transition-all shadow-lg ${
                capturedDescriptor
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/25'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isCapturing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extracting Biometrics...</span>
                </>
              ) : capturedDescriptor ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Re-Capture Face</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Capture & Extract Face Data</span>
                </>
              )}
            </button>
          </div>

          {capturedDescriptor && (
            <div className="mt-4 w-full p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>128D Vector Encoded & Ready</span>
            </div>
          )}
        </div>

        {/* Right Side: Registration Form with Password */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl">
          <h2 className="text-base font-bold text-slate-200 flex items-center space-x-2 mb-6">
            <UserPlus className="w-5 h-5 text-cyan-400" />
            <span>Student Account & Password Setup</span>
          </h2>

          {statusMessage.text && (
            <div className={`p-4 rounded-xl mb-6 text-xs flex items-start space-x-2 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                : 'bg-sky-950/60 border-sky-500/40 text-sky-300'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Student Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Johnson"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Institute Email *</label>
              <input
                type="email"
                required
                placeholder="alex.j@institute.edu"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Create Student Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Student ID *</label>
                <input
                  type="text"
                  required
                  placeholder="STU-2024-001"
                  value={formData.studentId}
                  onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Course / Branch *</label>
                <select
                  value={formData.course}
                  onChange={e => setFormData({ ...formData, course: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Comm.">Electronics & Comm.</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Batch / Year</label>
              <input
                type="text"
                placeholder="2024-2028"
                value={formData.batch}
                onChange={e => setFormData({ ...formData, batch: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting || !capturedDescriptor}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Enrolling Student...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Complete Registration & Save Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
