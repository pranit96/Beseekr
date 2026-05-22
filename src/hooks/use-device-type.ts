import { useState, useEffect } from "react";

// ─── Breakpoints ────────────────────────────────────────────────────────────
// < 768px  → mobile
// 768-1023px → tablet
// ≥ 1024px → desktop
export type DeviceType = "mobile" | "tablet" | "desktop";

const MOBILE_MAX = 767;   // px (inclusive upper bound)
const TABLET_MAX = 1023;  // px (inclusive upper bound)

function getDeviceType(): DeviceType {
  const width = window.innerWidth;
  if (width <= MOBILE_MAX) return "mobile";
  if (width <= TABLET_MAX) return "tablet";
  return "desktop";
}

/**
 * useDeviceType
 *
 * Returns one of: "mobile" | "tablet" | "desktop"
 *
 * - Computed immediately on first render (no flash of wrong value)
 * - Reactive: updates automatically on window resize / orientation change
 * - Uses matchMedia listeners for efficiency (avoids polling)
 */
export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>(() =>
    // Safe SSR guard: default to "desktop" if window is not available
    typeof window !== "undefined" ? getDeviceType() : "desktop"
  );

  useEffect(() => {
    const mqlMobile = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);
    const mqlTablet = window.matchMedia(
      `(min-width: ${MOBILE_MAX + 1}px) and (max-width: ${TABLET_MAX}px)`
    );

    const handleChange = () => {
      setDeviceType(getDeviceType());
    };

    // Modern browsers
    mqlMobile.addEventListener("change", handleChange);
    mqlTablet.addEventListener("change", handleChange);

    // Sync immediately in case window resized before effect ran
    handleChange();

    return () => {
      mqlMobile.removeEventListener("change", handleChange);
      mqlTablet.removeEventListener("change", handleChange);
    };
  }, []);

  return deviceType;
}
