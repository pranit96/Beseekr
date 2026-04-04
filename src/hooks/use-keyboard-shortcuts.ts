// src/hooks/use-keyboard-shortcuts.ts - KEYBOARD NAVIGATION & SHORTCUTS
import { useEffect, useCallback, useRef } from "react";

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  callback: (event: KeyboardEvent) => void;
  description?: string;
  preventDefault?: boolean;
}

export function useKeyboardShortcut(shortcut: KeyboardShortcut) {
  const callbackRef = useRef(shortcut.callback);

  useEffect(() => {
    callbackRef.current = shortcut.callback;
  }, [shortcut.callback]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const {
        key,
        ctrl = false,
        shift = false,
        alt = false,
        meta = false,
        preventDefault = true,
      } = shortcut;

      const isMatch =
        event.key.toLowerCase() === key.toLowerCase() &&
        event.ctrlKey === ctrl &&
        event.shiftKey === shift &&
        event.altKey === alt &&
        event.metaKey === meta;

      if (isMatch) {
        if (preventDefault) {
          event.preventDefault();
        }
        callbackRef.current(event);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcut]);
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcutsRef.current) {
        const {
          key,
          ctrl = false,
          shift = false,
          alt = false,
          meta = false,
          callback,
          preventDefault = true,
        } = shortcut;

        const isMatch =
          event.key.toLowerCase() === key.toLowerCase() &&
          event.ctrlKey === ctrl &&
          event.shiftKey === shift &&
          event.altKey === alt &&
          event.metaKey === meta;

        if (isMatch) {
          if (preventDefault) {
            event.preventDefault();
          }
          callback(event);
          break; // Only trigger first matching shortcut
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

/**
 * Hook for escape key handling
 */
export function useEscapeKey(callback: () => void, enabled = true) {
  useKeyboardShortcut({
    key: "Escape",
    callback,
    preventDefault: true,
  });
}

/**
 * Hook for arrow key navigation
 */
export function useArrowNavigation(options: {
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  enabled?: boolean;
}) {
  const { onUp, onDown, onLeft, onRight, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          onUp?.();
          break;
        case "ArrowDown":
          event.preventDefault();
          onDown?.();
          break;
        case "ArrowLeft":
          event.preventDefault();
          onLeft?.();
          break;
        case "ArrowRight":
          event.preventDefault();
          onRight?.();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onUp, onDown, onLeft, onRight, enabled]);
}

/**
 * Hook to get all registered shortcuts for help dialog
 */
export function useShortcutRegistry() {
  const shortcuts = useRef<KeyboardShortcut[]>([]);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    shortcuts.current.push(shortcut);
  }, []);

  const getShortcuts = useCallback(() => {
    return shortcuts.current;
  }, []);

  return { registerShortcut, getShortcuts };
}
