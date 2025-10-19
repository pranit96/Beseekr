// src/components/KeyboardShortcutsDialog.tsx - KEYBOARD SHORTCUTS HELP
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Keyboard, Command } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ['Ctrl', 'B'], description: 'Toggle conversation sidebar', category: 'Navigation' },
  { keys: ['Ctrl', 'N'], description: 'New conversation', category: 'Navigation' },
  { keys: ['↑', '↓'], description: 'Navigate conversations', category: 'Navigation' },
  { keys: ['Enter'], description: 'Open selected conversation', category: 'Navigation' },
  
  // Chat
  { keys: ['Enter'], description: 'Send message', category: 'Chat' },
  { keys: ['Shift', 'Enter'], description: 'New line in message', category: 'Chat' },
  { keys: ['Esc'], description: 'Cancel current operation', category: 'Chat' },
  
  // General
  { keys: ['Ctrl', '/'], description: 'Show keyboard shortcuts', category: 'General' },
  { keys: ['Ctrl', 'K'], description: 'Quick search', category: 'General' },
];

export const KeyboardShortcutsDialog = () => {
  const [open, setOpen] = useState(false);
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setOpen(true);
      }
    };

    const handleOpenHelp = () => {
      setOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-help', handleOpenHelp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-help', handleOpenHelp);
    };
  }, []);

  const formatKey = (key: string) => {
    if (isMac) {
      if (key === 'Ctrl') return '⌘';
      if (key === 'Alt') return '⌥';
      if (key === 'Shift') return '⇧';
    }
    return key;
  };

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-labelledby="shortcuts-title">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" aria-hidden="true" />
            <DialogTitle id="shortcuts-title">Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and interact with the application more efficiently
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1" role="group" aria-label={`Shortcut: ${shortcut.keys.join(' + ')}`}>
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <Badge
                            variant="secondary"
                            className="font-mono text-xs px-2 py-1 bg-muted border border-border"
                          >
                            {formatKey(key)}
                          </Badge>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground text-xs">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-start gap-3">
            <Command className="w-5 h-5 text-primary mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Pro Tip</p>
              <p className="text-xs text-muted-foreground">
                Press <Badge variant="secondary" className="font-mono text-xs mx-1">Ctrl</Badge> + 
                <Badge variant="secondary" className="font-mono text-xs mx-1">/</Badge> anytime to view this dialog
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
