import React, { useState, useEffect } from 'react';
import { Toast, ToastProps } from './Toast';

interface CountdownTimerProps {
  initialSeconds?: number;
  isPaused?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ initialSeconds = 14400, isPaused = false }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);
  const [alerted5Min, setAlerted5Min] = useState(false);
  const [alerted1Min, setAlerted1Min] = useState(false);

  useEffect(() => {
    if (initialSeconds !== undefined) {
      setSecondsLeft(initialSeconds);
    }
  }, [initialSeconds]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused]);

  useEffect(() => {
    if (isPaused) return;
    if (secondsLeft <= 300 && secondsLeft > 60 && !alerted5Min) {
      setToast({ type: 'warning', title: 'Time is Running Out!', message: 'Only 5 minutes left to solve your scenarios. Hurry up!', duration: 5000 });
      setAlerted5Min(true);
    }
    if (secondsLeft <= 60 && secondsLeft > 0 && !alerted1Min) {
      setToast({ type: 'error', title: 'Critical Warning!', message: 'Only 1 minute remaining! Submit your flags immediately!', duration: 8000 });
      setAlerted1Min(true);
    }
  }, [secondsLeft, alerted5Min, alerted1Min, isPaused]);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  const isLowTime = secondsLeft <= 300 && secondsLeft > 0;
  const isCriticalTime = secondsLeft <= 60 && secondsLeft > 0;

  return (
    <>
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}
      <span className={`font-mono tracking-wider transition-colors ${isCriticalTime ? 'text-red-500 animate-pulse font-black' : isLowTime ? 'text-amber-500 font-bold' : ''}`}>
        {pad(hours)}h : {pad(minutes)}m : {pad(seconds)}s {isPaused && <span className="text-amber-500 text-[10px] uppercase ml-1 animate-pulse">PAUSED</span>}
      </span>
    </>
  );
};

export default CountdownTimer;
