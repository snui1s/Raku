// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ErrorBoundary from "./ErrorBoundary";

const Boom = () => {
  throw new Error("kaboom");
};

beforeEach(() => {
  // React and the boundary both log the error on purpose
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(cleanup);

describe("ErrorBoundary", () => {
  it("shows its children when nothing goes wrong", () => {
    render(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>
    );
    expect(screen.getByText("all good")).toBeTruthy();
  });

  it("replaces a broken screen with a message that says the notes are safe", () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(screen.getByText(/Your notes are saved/)).toBeTruthy();
  });

  it("reloads the window from the Reload button", () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    expect(reload).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it("logs the error", () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(console.error).toHaveBeenCalledWith("Unhandled UI error:", expect.any(Error));
  });
});
