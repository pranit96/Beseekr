/**
 * Utility to assess feature flags dynamically based on environment variables or persistent runtime cookies.
 */

export function getIsNewMode(): boolean {
  // 1. Primary: Check static environment injection
  const envFlag = import.meta.env.VITE_IS_NEW_EXPERIENCE === "Y";

  // 2. Dynamic Fallback: Check persistent runtime cookies (prevents needing build cycles to toggle)
  if (typeof document !== "undefined") {
    const cookieMatch = document.cookie
      .split("; ")
      .find((row) => row.startsWith("IsNewChatPage="))
      ?.split("=")[1];

    if (cookieMatch === "true") return true;
    if (cookieMatch === "false") return false;
  }

  return envFlag;
}
