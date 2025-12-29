import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";

export function usePomodoro() {
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Pomodoro countdown
  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      // Celebration! 🎉
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#F25C54", "#FFD93D", "#6BCB77", "#4D96FF"],
      });
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, secondsLeft]);

  const startPomodoro = () => {
    if (!isRunning) {
      setSecondsLeft(pomodoroMinutes * 60);
      setIsRunning(true);
    } else {
      // Stop
      setIsRunning(false);
      setSecondsLeft(0);
    }
  };

  const adjustMinutes = (delta: number) => {
    if (!isRunning) {
      setPomodoroMinutes((m) => Math.max(5, Math.min(60, m + delta)));
    }
  };

  const formatPomodoro = () => {
    if (isRunning || secondsLeft > 0) {
      const mins = Math.floor(secondsLeft / 60);
      const secs = secondsLeft % 60;
      return `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${pomodoroMinutes.toString().padStart(2, "0")}:00`;
  };

  return {
    pomodoroMinutes,
    isRunning,
    startPomodoro,
    adjustMinutes,
    formatPomodoro,
  };
}
