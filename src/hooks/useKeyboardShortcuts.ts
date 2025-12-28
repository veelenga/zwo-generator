import { useEffect } from 'react';
import { useHistory } from './useHistory';

export function useKeyboardShortcuts(): void {
  const { canUndo, canRedo, undo, redo } = useHistory();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? event.metaKey : event.ctrlKey;

      if (!modifier) return;

      if (event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo) {
          undo();
        }
        return;
      }

      if ((event.key === 'z' && event.shiftKey) || event.key === 'y') {
        event.preventDefault();
        if (canRedo) {
          redo();
        }
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);
}
