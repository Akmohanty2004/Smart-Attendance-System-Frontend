import React, { useState } from 'react';
import { FastForward, Clock, CheckCircle2, AlertTriangle, ShieldAlert, RotateCcw, Sparkles } from 'lucide-react';
import { updateSystemSettings, triggerCronManual } from '../services/api';

export default function TimeMachineSimulator({ networkStatus, onSettingsUpdated }) {
  const currentSimulated = networkStatus?.simulatedTime || '';
  const [isUpdating, setIsUpdating] = useState(false);

  const applyTimePreset = async (timeVal, presetName) => {
    setIsUpdating(true);
    try {
      const res = await updateSystemSettings({ simulatedTime: timeVal });
      if (res.success) {
        if (onSettingsUpdated) onSettingsUpdated();
      }
    } catch (err) {
      console.error('Time machine update error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCronTriggerWarp = async () => {
    setIsUpdating(true);
    try {
      await updateSystemSettings({ simulatedTime: '10:30' });
      const cronRes = await triggerCronManual();
      if (cronRes.success) {
        alert(`⏰ Time set to 10:30 AM! Auto-Absent Cron Job executed.\n\n${cronRes.message}`);
        if (onSettingsUpdated) onSettingsUpdated();
      }
    } catch (err) {
      console.error('Cron warp error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border-b border-cyan-500/30 px-4 py-2 text-xs font-mono backdrop-blur-md sticky top-[65px] z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Title */}
        <div className="flex items-center space-x-2 text-cyan-300 font-bold shrink-0">
          <FastForward className="w-4 h-4 animate-pulse text-cyan-400" />
          <span>EVALUATION TIME MACHINE SIMULATOR:</span>
          {currentSimulated ? (
            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
              Simulated Clock: {currentSimulated}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
              Live System Clock
            </span>
          )}
        </div>

        {/* Preset Buttons */}
        <div className="flex items-center space-x-2 overflow-x-auto max-w-full py-0.5">
          {/* Preset 0: Reset to Live Clock */}
          <button
            onClick={() => applyTimePreset('', 'Live Clock')}
            disabled={isUpdating}
            className={`px-3 py-1 rounded-lg border text-[11px] font-semibold flex items-center space-x-1.5 transition-all ${
              !currentSimulated
                ? 'bg-emerald-700 border-emerald-400 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-slate-950 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/60'
            }`}
            title="Use Real Live System Clock"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live System Clock</span>
          </button>

          {/* Preset 1: Present */}
          <button
            onClick={() => applyTimePreset('09:15', 'Present Slot')}
            disabled={isUpdating}
            className={`px-3 py-1 rounded-lg border text-[11px] font-semibold flex items-center space-x-1.5 transition-all ${
              currentSimulated === '09:15'
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-slate-950 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>09:15 AM (Present Rule)</span>
          </button>

          {/* Preset 2: Late */}
          <button
            onClick={() => applyTimePreset('09:45', 'Late Slot')}
            disabled={isUpdating}
            className={`px-3 py-1 rounded-lg border text-[11px] font-semibold flex items-center space-x-1.5 transition-all ${
              currentSimulated === '09:45'
                ? 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-500/25'
                : 'bg-slate-950 border-amber-500/30 text-amber-300 hover:bg-amber-950/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>09:45 AM (Late Rule)</span>
          </button>

          {/* Preset 3: Closed */}
          <button
            onClick={() => applyTimePreset('10:15', 'Closed Slot')}
            disabled={isUpdating}
            className={`px-3 py-1 rounded-lg border text-[11px] font-semibold flex items-center space-x-1.5 transition-all ${
              currentSimulated === '10:15'
                ? 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-500/25'
                : 'bg-slate-950 border-rose-500/30 text-rose-300 hover:bg-rose-950/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>10:15 AM (Closed Rule)</span>
          </button>

          {/* Preset 4: Trigger Auto-Absent Cron */}
          <button
            onClick={handleCronTriggerWarp}
            disabled={isUpdating}
            className="px-3 py-1 rounded-lg bg-indigo-950 border border-indigo-500/50 text-indigo-300 hover:bg-indigo-900/80 text-[11px] font-semibold flex items-center space-x-1.5 transition-all shadow"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>10:30 AM (Auto-Absent Cron)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
