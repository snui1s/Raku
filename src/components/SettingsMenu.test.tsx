// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SettingsMenu } from "./SettingsMenu";
import { DEFAULT_SETTINGS } from "../utils/settings";

afterEach(cleanup);

const setup = (open = true, settings = DEFAULT_SETTINGS) => {
  const p = {
    setOpen: vi.fn(),
    update: vi.fn(),
    resetZoom: vi.fn(),
    reset: vi.fn(),
    setIsDark: vi.fn(),
    setCurrentTheme: vi.fn(),
  };
  render(
    <SettingsMenu
      open={open}
      settings={settings}
      isDark={false}
      currentTheme="classic"
      version="1.2.3"
      {...p}
    />
  );
  return p;
};

describe("SettingsMenu", () => {
  it("opens from the gear button", () => {
    const p = setup(false);
    fireEvent.click(screen.getByTitle("Settings"));
    expect(p.setOpen).toHaveBeenCalledWith(true);
  });

  it("zoom slider updates paperZoom", () => {
    const p = setup();
    fireEvent.change(screen.getByLabelText("Paper zoom"), { target: { value: "150" } });
    expect(p.update).toHaveBeenCalledWith({ paperZoom: 150 });
  });

  it("reset zoom is disabled at 100% and enabled otherwise", () => {
    setup();
    expect((screen.getByLabelText("Reset zoom") as HTMLButtonElement).disabled).toBe(true);
    cleanup();
    const p = setup(true, { ...DEFAULT_SETTINGS, paperZoom: 130 });
    const btn = screen.getByLabelText("Reset zoom") as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    fireEvent.click(btn);
    expect(p.resetZoom).toHaveBeenCalled();
  });

  it("segmented options and toggles send the right patch", () => {
    const p = setup();
    fireEvent.click(screen.getByRole("radio", { name: "Wide" }));
    expect(p.update).toHaveBeenCalledWith({ paperWidth: "wide" });
    fireEvent.click(screen.getByRole("radio", { name: "Relaxed" }));
    expect(p.update).toHaveBeenCalledWith({ lineHeight: 2.1 });
    fireEvent.click(screen.getByRole("radio", { name: "5s" }));
    expect(p.update).toHaveBeenCalledWith({ autosaveDelay: 5000 });
    fireEvent.click(screen.getByRole("switch", { name: "Spell check" }));
    expect(p.update).toHaveBeenCalledWith({ spellcheck: true });
    fireEvent.click(screen.getByRole("switch", { name: "Dark mode" }));
    expect(p.setIsDark).toHaveBeenCalledWith(true);
  });

  it("theme swatch, reset and Escape", () => {
    const p = setup();
    fireEvent.click(screen.getByLabelText("Matcha Zen"));
    expect(p.setCurrentTheme).toHaveBeenCalledWith("matcha");
    fireEvent.click(screen.getByText("Reset to defaults"));
    expect(p.reset).toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(p.setOpen).toHaveBeenCalledWith(false);
    expect(screen.getByText("Raku v1.2.3")).toBeTruthy();
  });
});

describe("SettingsMenu interface scale", () => {
  it("offers 50/75/100/125% and sends uiScale", () => {
    const update = vi.fn();
    render(
      <SettingsMenu
        open
        setOpen={() => {}}
        settings={DEFAULT_SETTINGS}
        update={update}
        resetZoom={() => {}}
        reset={() => {}}
        isDark={false}
        setIsDark={() => {}}
        currentTheme="classic"
        setCurrentTheme={() => {}}
        version="1"
      />
    );
    for (const s of ["50%", "75%", "100%", "125%"]) {
      expect(screen.getByRole("radio", { name: s })).toBeTruthy();
    }
    fireEvent.click(screen.getByRole("radio", { name: "75%" }));
    expect(update).toHaveBeenCalledWith({ uiScale: 75 });
  });
});
