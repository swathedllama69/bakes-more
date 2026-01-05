"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, X, Plus, Save, Trash2, Bell, Volume2, VolumeX, Timer as TimerIcon, Check } from "lucide-react";
import { useTimerStore } from "@/lib/store/timer-store";

// Types
type Preset = {
    id: string;
    label: string;
    duration: number;
};

export default function TimerPage() {
    // Global State
    const { timers, addTimer: addGlobalTimer, deleteTimer, toggleTimer, resetTimer, dismissAlarm: dismissGlobalAlarm, tick } = useTimerStore();

    // Local State
    const [presets, setPresets] = useState<Preset[]>([]);
    const [isMuted, setIsMuted] = useState(false);

    // Input State for New Timer
    const [newHours, setNewHours] = useState(0);
    const [newMinutes, setNewMinutes] = useState(0);
    const [newSeconds, setNewSeconds] = useState(0);
    const [newLabel, setNewLabel] = useState("");
    const [showPresetForm, setShowPresetForm] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize Audio & Load Presets
    useEffect(() => {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audioRef.current.loop = true;

        const savedPresets = localStorage.getItem('bakery_timer_presets');
        if (savedPresets) {
            setPresets(JSON.parse(savedPresets));
        } else {
            // Default Presets
            setPresets([
                { id: '1', label: 'Sponge Rise', duration: 1500 }, // 25m
                { id: '2', label: 'Cookie Bake', duration: 720 },  // 12m
                { id: '3', label: 'Bread Proof', duration: 3600 }, // 60m
            ]);
        }
    }, []);

    // Timer Tick Logic (Global)
    useEffect(() => {
        const interval = setInterval(() => {
            tick();
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Handle Ringing Effects
    useEffect(() => {
        const ringingTimers = timers.filter(t => t.isRinging);

        if (ringingTimers.length > 0) {
            // Play Sound
            if (!isMuted && audioRef.current && audioRef.current.paused) {
                audioRef.current.play().catch(e => console.log("Audio play failed", e));
            }
            // Vibrate
            if (navigator.vibrate) {
                navigator.vibrate([500, 200, 500, 200, 500]);
            }
            // Notify (only once per new ring ideally, but simple for now)
            if ("Notification" in window && Notification.permission === "granted") {
                // Debounce notification?
            }
        } else {
            // Stop Sound
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }
    }, [timers, isMuted]);


    const stopAlarm = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    // --- Actions ---

    const addTimer = (duration: number, label: string = "Timer") => {
        if (duration <= 0) return;
        addGlobalTimer(duration, label);

        // Reset inputs
        setNewHours(0);
        setNewMinutes(0);
        setNewSeconds(0);
        setNewLabel("");

        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    };

    // const deleteTimer = (id: string) => { ... } // Handled by store
    // const toggleTimer = (id: string) => { ... } // Handled by store
    // const resetTimer = (id: string) => { ... } // Handled by store
    // const dismissAlarm = (id: string) => { ... } // Handled by store

    const savePreset = () => {
        const duration = (newHours * 3600) + (newMinutes * 60) + newSeconds;
        if (duration <= 0 || !newLabel) return;

        const newPreset: Preset = {
            id: Date.now().toString(),
            label: newLabel,
            duration
        };

        const updatedPresets = [...presets, newPreset];
        setPresets(updatedPresets);
        localStorage.setItem('bakery_timer_presets', JSON.stringify(updatedPresets));
        setShowPresetForm(false);
    };

    const deletePreset = (id: string) => {
        const updatedPresets = presets.filter(p => p.id !== id);
        setPresets(updatedPresets);
        localStorage.setItem('bakery_timer_presets', JSON.stringify(updatedPresets));
    };

    // --- Helpers ---

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="p-4 md:p-8 min-h-screen bg-[#FAFAFA] flex flex-col items-center">

            {/* Header */}
            <div className="w-full max-w-7xl flex justify-between items-center mb-8">
                <h1 className="text-3xl md:text-4xl font-serif text-[#B03050] flex items-center gap-3">
                    <TimerIcon className="w-10 h-10" /> Kitchen Timers
                </h1>
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-slate-200 text-slate-500' : 'bg-pink-100 text-[#B03050]'}`}
                >
                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
            </div>

            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Create & Presets */}
                <div className="space-y-6">

                    {/* Create New Timer Card */}
                    <div className="bg-white rounded-[2rem] shadow-md border border-[#E8ECE9] p-8">
                        <h2 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2">
                            <Plus className="w-6 h-6 text-[#B03050]" /> New Timer
                        </h2>

                        <div className="flex justify-center gap-3 mb-6">
                            <TimeInput value={newHours} onChange={setNewHours} label="Hr" />
                            <span className="text-4xl font-bold text-slate-300 mt-4">:</span>
                            <TimeInput value={newMinutes} onChange={setNewMinutes} label="Min" />
                            <span className="text-4xl font-bold text-slate-300 mt-4">:</span>
                            <TimeInput value={newSeconds} onChange={setNewSeconds} label="Sec" />
                        </div>

                        <input
                            type="text"
                            placeholder="Label (e.g. Brownies)"
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 mb-6 text-lg focus:outline-none focus:border-[#B03050] transition-colors"
                        />

                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => addTimer((newHours * 3600) + (newMinutes * 60) + newSeconds, newLabel)}
                                className="bg-[#B03050] text-white py-4 text-lg rounded-2xl font-bold shadow-xl shadow-pink-200 hover:bg-[#902040] hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Play className="w-5 h-5 fill-current" /> Start Timer
                            </button>
                            <button
                                onClick={() => setShowPresetForm(!showPresetForm)}
                                className="bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Save className="w-5 h-5" /> Save as Preset
                            </button>
                        </div>

                        {/* Save Preset Form */}
                        {showPresetForm && (
                            <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                                <p className="text-xs text-slate-500 mb-2">Save current duration as preset?</p>
                                <button
                                    onClick={savePreset}
                                    className="w-full py-2 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600"
                                >
                                    Confirm Save
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Presets List */}
                    <div className="bg-white rounded-3xl shadow-sm border border-[#E8ECE9] p-6">
                        <h2 className="font-bold text-slate-800 mb-4">Saved Presets</h2>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {presets.map(preset => (
                                <div key={preset.id} className="group flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-pink-50 transition-colors border border-transparent hover:border-pink-100">
                                    <button
                                        onClick={() => addTimer(preset.duration, preset.label)}
                                        className="flex-1 text-left"
                                    >
                                        <div className="font-bold text-slate-700">{preset.label}</div>
                                        <div className="text-xs text-slate-400 font-mono">{formatTime(preset.duration)}</div>
                                    </button>
                                    <button
                                        onClick={() => deletePreset(preset.id)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        title="Delete Preset"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {presets.length === 0 && (
                                <p className="text-sm text-slate-400 italic text-center py-4">No saved presets yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Active Timers Grid */}
                <div className="lg:col-span-2">
                    <h2 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                        <span>Active Timers</span>
                        <span className="bg-[#B03050] text-white text-xs px-2 py-1 rounded-full">{timers.length}</span>
                    </h2>

                    {timers.length === 0 ? (
                        <div className="h-64 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400">
                            <TimerIcon className="w-12 h-12 mb-2 opacity-20" />
                            <p>No active timers</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {timers.map(timer => (
                                <TimerCard
                                    key={timer.id}
                                    timer={timer}
                                    onToggle={() => toggleTimer(timer.id)}
                                    onReset={() => resetTimer(timer.id)}
                                    onDelete={() => deleteTimer(timer.id)}
                                    onDismiss={() => dismissGlobalAlarm(timer.id)}
                                    formatTime={formatTime}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Sub-components

function TimeInput({ value, onChange, label }: { value: number, onChange: (v: number) => void, label: string }) {
    return (
        <div className="flex flex-col items-center gap-2">
            <input
                type="number"
                min="0"
                max="59"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                className="w-20 h-20 md:w-24 md:h-24 text-center text-3xl md:text-4xl font-bold bg-slate-50 rounded-2xl border-2 border-slate-200 focus:border-[#B03050] focus:outline-none transition-all"
            />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        </div>
    );
}

function TimerCard({ timer, onToggle, onReset, onDelete, onDismiss, formatTime }: any) {
    const progress = ((timer.duration - timer.timeLeft) / timer.duration) * 100;

    return (
        <div className={`relative overflow-hidden bg-white rounded-[2rem] p-8 shadow-md border transition-all hover:shadow-xl ${timer.isRinging ? 'border-red-500 shadow-red-100 ring-4 ring-red-100' : 'border-[#E8ECE9]'}`}>

            {/* Progress Bar Background */}
            <div className="absolute bottom-0 left-0 h-2 bg-slate-100 w-full">
                <div
                    className={`h-full transition-all duration-1000 ${timer.isActive ? 'bg-[#B03050]' : 'bg-slate-300'}`}
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-bold text-slate-700 text-xl md:text-2xl">{timer.label}</h3>
                    <p className="text-sm text-slate-400 font-medium mt-1">Total: {formatTime(timer.duration)}</p>
                </div>
                <button
                    onClick={onDelete}
                    className="bg-red-50 text-red-500 p-3 rounded-xl hover:bg-red-100 transition-colors active:scale-95"
                    title="Delete Timer"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="text-center py-8">
                <div className={`text-6xl md:text-7xl font-mono font-bold tracking-widest ${timer.isRinging ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
                    {timer.timeLeft === 0 ? "00:00" : formatTime(timer.timeLeft)}
                </div>
                {timer.isRinging && <p className="text-red-500 font-bold text-lg mt-2 animate-bounce">TIME'S UP!</p>}
            </div>

            <div className="flex gap-4 mt-6">
                {timer.isRinging ? (
                    <button
                        onClick={onDismiss}
                        className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-red-200 hover:bg-red-600 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        <Bell className="w-6 h-6" /> Dismiss Alarm
                    </button>
                ) : (
                    <>
                        <button
                            onClick={onToggle}
                            className={`flex-1 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-3 ${timer.isActive ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-[#B03050] text-white shadow-lg shadow-pink-200 hover:bg-[#902040] hover:-translate-y-1'}`}
                        >
                            {timer.isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                            {timer.isActive ? "Pause" : "Start"}
                        </button>
                        <button
                            onClick={onReset}
                            className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                        >
                            <RotateCcw className="w-6 h-6" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
