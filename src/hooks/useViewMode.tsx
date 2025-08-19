import { useState, useEffect } from 'react';

export type ViewMode = 'list' | 'grid-small' | 'grid-medium' | 'grid-large' | 'kanban';

interface UseViewModeProps {
  defaultView?: ViewMode;
  storageKey?: string;
}

export const useViewMode = ({ 
  defaultView = 'list', 
  storageKey = 'viewMode' 
}: UseViewModeProps = {}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const saved = localStorage.getItem(storageKey);
      return (saved as ViewMode) || defaultView;
    }
    return defaultView;
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.setItem(storageKey, viewMode);
    }
  }, [viewMode, storageKey]);

  return { viewMode, setViewMode };
};