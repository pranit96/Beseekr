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

export function getIsBudgetEnabled(): boolean {
  const envFlag = import.meta.env.VITE_ENABLE_BUDGET === "Y";

  if (typeof document !== "undefined") {
    const cookieMatch = document.cookie
      .split("; ")
      .find((row) => row.startsWith("EnableBudget="))
      ?.split("=")[1];

    if (cookieMatch === "true") return true;
    if (cookieMatch === "false") return false;
  }

  return envFlag;
}

export function getIsSecondBrainEnabled(): boolean {
  // Active by default unless VITE_ENABLE_SECOND_BRAIN is false
  const envFlag = import.meta.env.VITE_ENABLE_SECOND_BRAIN !== "false";

  if (typeof document !== "undefined") {
    const cookieMatch = document.cookie
      .split("; ")
      .find((row) => row.startsWith("EnableSecondBrain="))
      ?.split("=")[1];

    if (cookieMatch === "true") return true;
    if (cookieMatch === "false") return false;
  }

  return envFlag;
}

export function getIsWeeklyDigestEnabled(): boolean {
  // Active by default unless VITE_ENABLE_WEEKLY_DIGEST is false
  const envFlag = import.meta.env.VITE_ENABLE_WEEKLY_DIGEST !== "false";

  if (typeof document !== "undefined") {
    const cookieMatch = document.cookie
      .split("; ")
      .find((row) => row.startsWith("EnableWeeklyDigest="))
      ?.split("=")[1];

    if (cookieMatch === "true") return true;
    if (cookieMatch === "false") return false;
  }

  return envFlag;
}

export function getIsLearnByDoingEnabled(): boolean {
  // Active by default unless VITE_ENABLE_LEARN_BY_DOING is false
  const envFlag = import.meta.env.VITE_ENABLE_LEARN_BY_DOING !== "false";

  if (typeof document !== "undefined") {
    const cookieMatch = document.cookie
      .split("; ")
      .find((row) => row.startsWith("EnableLearnByDoing="))
      ?.split("=")[1];

    if (cookieMatch === "true") return true;
    if (cookieMatch === "false") return false;
  }

  return envFlag;
}

export function getIsDhetEnabled(): boolean {
  // Defaults to false unless explicitly enabled via env or cookie
  const envFlag =
    import.meta.env.VITE_ENABLE_DHET === "true" ||
    import.meta.env.VITE_DHET === "true";

  if (typeof document !== "undefined") {
    const cookieMatch = document.cookie
      .split("; ")
      .find((row) => row.startsWith("EnableDhet="))
      ?.split("=")[1];

    if (cookieMatch === "true") return true;
    if (cookieMatch === "false") return false;
  }

  return envFlag;
}

