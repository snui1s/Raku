// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const confetti = vi.hoisted(() => vi.fn());
vi.mock("canvas-confetti", () => ({ default: confetti }));

import { usePomodoro } from "./usePomodoro";

beforeEach(() => {
  vi.useFakeTimers();
  confetti.mockReset();
});
afterEach(() => vi.useRealTimers());

const tick = (seconds: number) => {
  for (let i = 0; i < seconds; i++) act(() => void vi.advanceTimersByTime(1000));
};

describe("usePomodoro", () => {
  it("starts at 25 minutes", () => {
    const { result } = renderHook(() => usePomodoro());
    expect(result.current.formatPomodoro()).toBe("25:00");
    expect(result.current.isRunning).toBe(false);
  });

  it("changes the length in steps and keeps it between 5 and 60 minutes", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => result.current.adjustMinutes(5));
    expect(result.current.formatPomodoro()).toBe("30:00");
    act(() => result.current.adjustMinutes(100));
    expect(result.current.formatPomodoro()).toBe("60:00");
    act(() => result.current.adjustMinutes(-500));
    expect(result.current.formatPomodoro()).toBe("05:00");
  });

  it("counts down once a second", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => result.current.startPomodoro());
    expect(result.current.isRunning).toBe(true);
    expect(result.current.formatPomodoro()).toBe("25:00");
    tick(1);
    expect(result.current.formatPomodoro()).toBe("24:59");
    tick(60);
    expect(result.current.formatPomodoro()).toBe("23:59");
  });

  it("does not change the length while it is running", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => result.current.startPomodoro());
    act(() => result.current.adjustMinutes(5));
    expect(result.current.pomodoroMinutes).toBe(25);
  });

  it("stops when started again, and goes back to the chosen length", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => result.current.startPomodoro());
    tick(10);
    act(() => result.current.startPomodoro());
    expect(result.current.isRunning).toBe(false);
    expect(result.current.formatPomodoro()).toBe("25:00");
    tick(5);
    expect(result.current.formatPomodoro()).toBe("25:00");
    expect(confetti).not.toHaveBeenCalled();
  });

  it("celebrates once when the time is up", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => result.current.adjustMinutes(-20));
    act(() => result.current.startPomodoro());
    tick(299);
    expect(result.current.formatPomodoro()).toBe("00:01");
    expect(confetti).not.toHaveBeenCalled();
    tick(1);
    act(() => void vi.advanceTimersByTime(10));
    expect(result.current.isRunning).toBe(false);
    expect(confetti).toHaveBeenCalledTimes(1);
    tick(5);
    expect(confetti).toHaveBeenCalledTimes(1);
  });
});
