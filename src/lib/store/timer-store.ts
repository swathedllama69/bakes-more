import { create } from 'zustand';

type Timer = {
    id: string;
    label: string;
    duration: number; // total seconds
    timeLeft: number;
    isActive: boolean;
    isRinging: boolean;
};

type TimerStore = {
    timers: Timer[];
    addTimer: (duration: number, label: string) => void;
    deleteTimer: (id: string) => void;
    toggleTimer: (id: string) => void;
    resetTimer: (id: string) => void;
    dismissAlarm: (id: string) => void;
    tick: () => void;
};

export const useTimerStore = create<TimerStore>((set, get) => ({
    timers: [],

    addTimer: (duration, label) => {
        const newTimer: Timer = {
            id: Date.now().toString() + Math.random(),
            label: label || "Timer",
            duration,
            timeLeft: duration,
            isActive: true,
            isRinging: false
        };
        set(state => ({ timers: [...state.timers, newTimer] }));
    },

    deleteTimer: (id) => set(state => ({
        timers: state.timers.filter(t => t.id !== id)
    })),

    toggleTimer: (id) => set(state => ({
        timers: state.timers.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t)
    })),

    resetTimer: (id) => set(state => ({
        timers: state.timers.map(t => t.id === id ? { ...t, timeLeft: t.duration, isActive: false, isRinging: false } : t)
    })),

    dismissAlarm: (id) => set(state => ({
        timers: state.timers.map(t => t.id === id ? { ...t, isRinging: false } : t)
    })),

    tick: () => set(state => ({
        timers: state.timers.map(timer => {
            if (timer.isActive && timer.timeLeft > 0) {
                return { ...timer, timeLeft: timer.timeLeft - 1 };
            } else if (timer.isActive && timer.timeLeft === 0 && !timer.isRinging) {
                return { ...timer, isActive: false, isRinging: true };
            }
            return timer;
        })
    }))
}));
