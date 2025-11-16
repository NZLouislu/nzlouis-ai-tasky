/**
 * Keyboard Shortcuts Hook and Component
 * Provides keyboard shortcuts for Stories functionality
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  category: 'navigation' | 'editing' | 'sync' | 'general';
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    const key = getKeyString(event);
    const shortcut = shortcuts.find(s => s.key === key);
    
    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);
}

function getKeyString(event: KeyboardEvent): string {
  const parts: string[] = [];
  
  if (event.ctrlKey || event.metaKey) parts.push('cmd');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');
  
  parts.push(event.key.toLowerCase());
  
  return parts.join('+');
}

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

export function KeyboardShortcutsDialog({ isOpen, onClose, shortcuts }: KeyboardShortcutsDialogProps) {
  const categories = {
    navigation: 'Navigation',
    editing: 'Editing',
    sync: 'Synchronization',
    general: 'General'
  };

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="font-semibold text-lg mb-3">{categories[category as keyof typeof categories]}</h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                    <span className="text-sm">{shortcut.description}</span>
                    <KeyboardKey keyString={shortcut.key} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-500 mt-4">
          <p>Shortcuts work when not typing in text fields. Press <KeyboardKey keyString="?" /> to toggle this dialog.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function KeyboardKey({ keyString }: { keyString: string }) {
  const parts = keyString.split('+');
  
  const keyMap: Record<string, string> = {
    'cmd': '⌘',
    'ctrl': 'Ctrl',
    'alt': '⌥',
    'shift': '⇧',
    'enter': '↵',
    'escape': 'Esc',
    'arrowup': '↑',
    'arrowdown': '↓',
    'arrowleft': '←',
    'arrowright': '→',
    ' ': 'Space'
  };

  return (
    <div className="flex items-center gap-1">
      {parts.map((part, index) => (
        <Badge key={index} variant="outline" className="text-xs font-mono px-2 py-1">
          {keyMap[part] || part.toUpperCase()}
        </Badge>
      ))}
    </div>
  );
}

/**
 * Stories-specific keyboard shortcuts hook
 */
interface UseStoriesShortcutsProps {
  onNewStory?: () => void;
  onSave?: () => void;
  onSyncJira?: () => void;
  onSyncTrello?: () => void;
  onTogglePreview?: () => void;
  onShowShortcuts?: () => void;
  onSearch?: () => void;
  onNewProject?: () => void;
  enabled?: boolean;
}

export function useStoriesShortcuts({
  onNewStory,
  onSave,
  onSyncJira,
  onSyncTrello,
  onTogglePreview,
  onShowShortcuts,
  onSearch,
  onNewProject,
  enabled = true
}: UseStoriesShortcutsProps) {
  const shortcuts: KeyboardShortcut[] = [
    // Navigation
    {
      key: 'cmd+k',
      description: 'Search projects and documents',
      action: () => onSearch?.(),
      category: 'navigation'
    },
    {
      key: 'cmd+shift+n',
      description: 'Create new project',
      action: () => onNewProject?.(),
      category: 'navigation'
    },
    {
      key: 'cmd+n',
      description: 'Create new story',
      action: () => onNewStory?.(),
      category: 'navigation'
    },

    // Editing
    {
      key: 'cmd+s',
      description: 'Save document',
      action: () => onSave?.(),
      category: 'editing'
    },
    {
      key: 'cmd+shift+p',
      description: 'Toggle preview',
      action: () => onTogglePreview?.(),
      category: 'editing'
    },

    // Synchronization
    {
      key: 'cmd+shift+j',
      description: 'Sync to Jira',
      action: () => onSyncJira?.(),
      category: 'sync'
    },
    {
      key: 'cmd+shift+t',
      description: 'Sync to Trello',
      action: () => onSyncTrello?.(),
      category: 'sync'
    },

    // General
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => onShowShortcuts?.(),
      category: 'general'
    }
  ];

  useKeyboardShortcuts({ shortcuts, enabled });

  return shortcuts;
}

/**
 * Command Palette Component
 * Quick access to actions via keyboard
 */
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Array<{
    id: string;
    title: string;
    description?: string;
    action: () => void;
    shortcut?: string;
    category?: string;
  }>;
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = commands.filter(command =>
    command.title.toLowerCase().includes(search.toLowerCase()) ||
    command.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, selectedIndex, filteredCommands]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0">
        <div className="border-b">
          <input
            type="text"
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 text-sm border-0 outline-none"
            autoFocus
          />
        </div>

        <div className="max-h-80 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No commands found
            </div>
          ) : (
            <div className="py-2">
              {filteredCommands.map((command, index) => (
                <div
                  key={command.id}
                  className={`px-4 py-2 cursor-pointer flex items-center justify-between ${
                    index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    command.action();
                    onClose();
                  }}
                >
                  <div>
                    <div className="font-medium text-sm">{command.title}</div>
                    {command.description && (
                      <div className="text-xs text-gray-500">{command.description}</div>
                    )}
                  </div>
                  {command.shortcut && (
                    <KeyboardKey keyString={command.shortcut} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}