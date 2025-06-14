import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChunkSelection } from '@/app/dashboard/components/hooks/useChunkSelection';

/**
 * Unit tests for useChunkSelection hook
 * Tests single and multi-selection of chunks with keyboard modifiers
 */

describe('useChunkSelection Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useChunkSelection());

      expect(result.current.activeChunkId).toBeNull();
      expect(result.current.multiSelectedChunkIds).toEqual([]);
    });
  });

  describe('Single Click Selection', () => {
    it('should select a single chunk on click', () => {
      const { result } = renderHook(() => useChunkSelection());

      const mockEvent = {
        metaKey: false,
        ctrlKey: false,
      } as React.MouseEvent;

      act(() => {
        result.current.handleChunkClick('chunk-1', mockEvent);
      });

      expect(result.current.activeChunkId).toBe('chunk-1');
      expect(result.current.multiSelectedChunkIds).toEqual(['chunk-1']);
    });

    it('should replace selection when clicking different chunk without modifier', () => {
      const { result } = renderHook(() => useChunkSelection());

      const mockEvent = {
        metaKey: false,
        ctrlKey: false,
      } as React.MouseEvent;

      // Select first chunk
      act(() => {
        result.current.handleChunkClick('chunk-1', mockEvent);
      });

      expect(result.current.activeChunkId).toBe('chunk-1');
      expect(result.current.multiSelectedChunkIds).toEqual(['chunk-1']);

      // Select second chunk
      act(() => {
        result.current.handleChunkClick('chunk-2', mockEvent);
      });

      expect(result.current.activeChunkId).toBe('chunk-2');
      expect(result.current.multiSelectedChunkIds).toEqual(['chunk-2']);
    });
  });

  describe('Multi-Selection with Ctrl/Cmd', () => {
    it('should add to selection with Ctrl key', () => {
      const { result } = renderHook(() => useChunkSelection());

      const normalClick = {
        metaKey: false,
        ctrlKey: false,
      } as React.MouseEvent;

      const ctrlClick = {
        metaKey: false,
        ctrlKey: true,
      } as React.MouseEvent;

      // Select first chunk normally
      act(() => {
        result.current.handleChunkClick('chunk-1', normalClick);
      });

      expect(result.current.multiSelectedChunkIds).toEqual(['chunk-1']);

      // Add second chunk with Ctrl
      act(() => {
        result.current.handleChunkClick('chunk-2', ctrlClick);
      });

      expect(result.current.activeChunkId).toBe('chunk-2');
      expect(result.current.multiSelectedChunkIds).toEqual(['chunk-1', 'chunk-2']);

      // Add third chunk with Ctrl
      act(() => {
        result.current.handleChunkClick('chunk-3', ctrlClick);
      });

      expect(result.current.activeChunkId).toBe('chunk-3');
      expect(result.current.multiSelectedChunkIds).toEqual(['chunk-1', 'chunk-2', 'chunk-3']);
    });

    it('should add to selection with Cmd key (Mac)', () => {
      const { result } = renderHook(() => useChunkSelection());

      const normalClick = {
        metaKey: false,
        ctrlKey: false,
      } as React.MouseEvent;

      const cmdClick = {
        metaKey: true,
        ctrlKey: false,
      } as React.MouseEvent;

      // Select first chunk normally
      act(() => {
        result.current.handleChunkClick('chunk-1', normalClick);
      });

      // Add second chunk with Cmd
      act(() => {
        result.current.handleChunkClick('chunk-2', cmdClick);
      });

      expect(result.current.activeChunkId).toBe('chunk-2');
      expect(result.current.multiSelectedChunkIds).toEqual(['chunk-1', 'chunk-2']);
    });

    it('should toggle selection when clicking already selected chunk with modifier', () => {
      const { result } = renderHook(() => useChunkSelection());

      const ctrlClick = {
        metaKey: false,
        ctrlKey: true,
      } as React.MouseEvent;

      // Select multiple chunks
      act(() => {
        result.current.handleChunkClick('chunk-1', ctrlClick);
      });

      act(() => {
        result.current.handleChunkClick('chunk-2', ctrlClick);
      });

      act(() => {
        result.current.handleChunkClick('chunk-3', ctrlClick);
      });

      expect(result.current.multiSelectedChunkIds).toEqual(['chunk-1', 'chunk-2', 'chunk-3']);

      // Deselect chunk-2
      act(() => {
        result.current.handleChunkClick('chunk-2', ctrlClick);
      });

      expect(result.current.activeChunkId).toBe('chunk-2');
      expect(result.current.multiSelectedChunkIds).toEqual(['chunk-1', 'chunk-3']);

      // Reselect chunk-2
      act(() => {
        result.current.handleChunkClick('chunk-2', ctrlClick);
      });

      expect(result.current.multiSelectedChunkIds).toEqual(['chunk-1', 'chunk-3', 'chunk-2']);
    });

    it('should handle deselecting all chunks', () => {
      const { result } = renderHook(() => useChunkSelection());

      const ctrlClick = {
        metaKey: false,
        ctrlKey: true,
      } as React.MouseEvent;

      // Select a chunk
      act(() => {
        result.current.handleChunkClick('chunk-1', ctrlClick);
      });

      expect(result.current.multiSelectedChunkIds).toEqual(['chunk-1']);

      // Deselect the same chunk
      act(() => {
        result.current.handleChunkClick('chunk-1', ctrlClick);
      });

      expect(result.current.activeChunkId).toBe('chunk-1');
      expect(result.current.multiSelectedChunkIds).toEqual([]);
    });
  });

  describe('Clear Selection', () => {
    it('should clear all selections', () => {
      const { result } = renderHook(() => useChunkSelection());

      const ctrlClick = {
        metaKey: false,
        ctrlKey: true,
      } as React.MouseEvent;

      // Select multiple chunks
      act(() => {
        result.current.handleChunkClick('chunk-1', ctrlClick);
        result.current.handleChunkClick('chunk-2', ctrlClick);
        result.current.handleChunkClick('chunk-3', ctrlClick);
      });

      expect(result.current.activeChunkId).toBe('chunk-3');
      expect(result.current.multiSelectedChunkIds).toHaveLength(3);

      // Clear selection
      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.activeChunkId).toBeNull();
      expect(result.current.multiSelectedChunkIds).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty chunk ID', () => {
      const { result } = renderHook(() => useChunkSelection());

      const mockEvent = {
        metaKey: false,
        ctrlKey: false,
      } as React.MouseEvent;

      act(() => {
        result.current.handleChunkClick('', mockEvent);
      });

      expect(result.current.activeChunkId).toBe('');
      expect(result.current.multiSelectedChunkIds).toEqual(['']);
    });

    it('should handle selecting same chunk multiple times without modifier', () => {
      const { result } = renderHook(() => useChunkSelection());

      const mockEvent = {
        metaKey: false,
        ctrlKey: false,
      } as React.MouseEvent;

      // Click same chunk multiple times
      act(() => {
        result.current.handleChunkClick('chunk-1', mockEvent);
      });

      act(() => {
        result.current.handleChunkClick('chunk-1', mockEvent);
      });

      act(() => {
        result.current.handleChunkClick('chunk-1', mockEvent);
      });

      expect(result.current.activeChunkId).toBe('chunk-1');
      expect(result.current.multiSelectedChunkIds).toEqual(['chunk-1']);
    });

    it('should maintain activeChunkId even when deselecting from multi-selection', () => {
      const { result } = renderHook(() => useChunkSelection());

      const normalClick = {
        metaKey: false,
        ctrlKey: false,
      } as React.MouseEvent;

      const ctrlClick = {
        metaKey: false,
        ctrlKey: true,
      } as React.MouseEvent;

      // Select first chunk
      act(() => {
        result.current.handleChunkClick('chunk-1', normalClick);
      });

      // Add more chunks
      act(() => {
        result.current.handleChunkClick('chunk-2', ctrlClick);
        result.current.handleChunkClick('chunk-3', ctrlClick);
      });

      // Deselect chunk-3 (which is currently active)
      act(() => {
        result.current.handleChunkClick('chunk-3', ctrlClick);
      });

      // activeChunkId should still be chunk-3 (last clicked)
      expect(result.current.activeChunkId).toBe('chunk-3');
      expect(result.current.multiSelectedChunkIds).toEqual(['chunk-1', 'chunk-2']);
    });

    it('should handle both metaKey and ctrlKey pressed simultaneously', () => {
      const { result } = renderHook(() => useChunkSelection());

      const bothKeysClick = {
        metaKey: true,
        ctrlKey: true,
      } as React.MouseEvent;

      // Select chunks with both keys pressed
      act(() => {
        result.current.handleChunkClick('chunk-1', bothKeysClick);
      });

      act(() => {
        result.current.handleChunkClick('chunk-2', bothKeysClick);
      });

      // Should still work as multi-selection
      expect(result.current.activeChunkId).toBe('chunk-2');
      expect(result.current.multiSelectedChunkIds).toEqual(['chunk-1', 'chunk-2']);
    });
  });

  describe('Complex Selection Scenarios', () => {
    it('should handle switching from multi-selection to single selection', () => {
      const { result } = renderHook(() => useChunkSelection());

      const normalClick = {
        metaKey: false,
        ctrlKey: false,
      } as React.MouseEvent;

      const ctrlClick = {
        metaKey: false,
        ctrlKey: true,
      } as React.MouseEvent;

      // Build multi-selection
      act(() => {
        result.current.handleChunkClick('chunk-1', ctrlClick);
        result.current.handleChunkClick('chunk-2', ctrlClick);
        result.current.handleChunkClick('chunk-3', ctrlClick);
        result.current.handleChunkClick('chunk-4', ctrlClick);
      });

      expect(result.current.multiSelectedChunkIds).toHaveLength(4);

      // Normal click should reset to single selection
      act(() => {
        result.current.handleChunkClick('chunk-5', normalClick);
      });

      expect(result.current.activeChunkId).toBe('chunk-5');
      expect(result.current.multiSelectedChunkIds).toEqual(['chunk-5']);
    });

    it('should maintain selection order', () => {
      const { result } = renderHook(() => useChunkSelection());

      const ctrlClick = {
        metaKey: false,
        ctrlKey: true,
      } as React.MouseEvent;

      // Select chunks in specific order
      const chunks = ['chunk-3', 'chunk-1', 'chunk-4', 'chunk-2'];
      
      chunks.forEach(chunkId => {
        act(() => {
          result.current.handleChunkClick(chunkId, ctrlClick);
        });
      });

      // Should maintain the order of selection
      expect(result.current.multiSelectedChunkIds).toEqual(chunks);
    });
  });
});