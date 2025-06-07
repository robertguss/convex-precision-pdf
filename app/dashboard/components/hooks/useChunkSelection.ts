// ABOUTME: Custom hook for managing chunk selection state and interactions
// ABOUTME: Handles single and multi-selection of chunks with keyboard modifiers
import { useState } from 'react';

interface UseChunkSelectionReturn {
  activeChunkId: string | null;
  multiSelectedChunkIds: string[];
  handleChunkClick: (chunkId: string, event: React.MouseEvent) => void;
  clearSelection: () => void;
}

export function useChunkSelection(): UseChunkSelectionReturn {
  const [activeChunkId, setActiveChunkId] = useState<string | null>(null);
  const [multiSelectedChunkIds, setMultiSelectedChunkIds] = useState<string[]>(
    [],
  );

  const handleChunkClick = (chunkId: string, event: React.MouseEvent) => {
    setActiveChunkId(chunkId); // Always set the last clicked as active

    const isCtrlCmd = event.metaKey || event.ctrlKey; // Check for Ctrl (Windows) or Cmd (Mac)

    if (isCtrlCmd) {
      // Ctrl/Cmd + Click: Toggle selection for this chunk
      setMultiSelectedChunkIds((prevSelected) => {
        const newSelection = prevSelected.includes(chunkId)
          ? prevSelected.filter((id) => id !== chunkId)
          : [...prevSelected, chunkId];

        return newSelection;
      });
    } else {
      // Single Click: Select only this chunk

      setMultiSelectedChunkIds([chunkId]);
    }
  };

  const clearSelection = () => {
    setActiveChunkId(null);
    setMultiSelectedChunkIds([]);
  };

  return {
    activeChunkId,
    multiSelectedChunkIds,
    handleChunkClick,
    clearSelection,
  };
}
