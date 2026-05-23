import React, { createContext, useContext, type ReactNode } from "react";
import { useDeviceType, type DeviceType } from "../hooks/use-device-type";

// ─── Context Shape ───────────────────────────────────────────────────────────

interface DeviceContextValue {
  /** One of: "mobile" | "tablet" | "desktop" */
  deviceType: DeviceType;
  /** Convenience flags */
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const DeviceContext = createContext<DeviceContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

/**
 * DeviceProvider
 *
 * Wrap this around your app root (or inside App.tsx).
 * Detects device type immediately on mount — works from any page/route.
 *
 * Usage:
 *   <DeviceProvider>
 *     <App />
 *   </DeviceProvider>
 *
 * Then anywhere in the tree:
 *   const { deviceType, isMobile, isTablet, isDesktop } = useDevice();
 */
export function DeviceProvider({ children }: { children: ReactNode }) {
  const deviceType = useDeviceType();

  const value: DeviceContextValue = {
    deviceType,
    isMobile: deviceType === "mobile",
    isTablet: deviceType === "tablet",
    isDesktop: deviceType === "desktop",
  };

  return (
    <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * useDevice
 *
 * Returns the current device type flag and convenience booleans.
 * Must be used inside <DeviceProvider>.
 *
 * @example
 *   const { deviceType, isMobile } = useDevice();
 *   // deviceType → "mobile" | "tablet" | "desktop"
 */
export function useDevice(): DeviceContextValue {
  const ctx = useContext(DeviceContext);
  if (!ctx) {
    throw new Error("useDevice must be used inside <DeviceProvider>");
  }
  return ctx;
}
