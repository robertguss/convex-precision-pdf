// ABOUTME: Custom hook for subscribing to document updates via Supabase Realtime
// ABOUTME: Provides instant updates when document processing completes
import { useEffect, useCallback } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { Database } from '~/lib/database.types';

type DocumentRow = Database['public']['Tables']['documents']['Row'];

interface UseDocumentRealtimeParams {
  documentId: string | null;
  onDocumentUpdate: (document: DocumentRow) => void;
  enabled: boolean;
}

export function useDocumentRealtime({
  documentId,
  onDocumentUpdate,
  enabled,
}: UseDocumentRealtimeParams) {
  const supabase = useSupabase();

  const handleRealtimeUpdate = useCallback(
    (payload: RealtimePostgresChangesPayload<DocumentRow>) => {
      if (payload.eventType === 'UPDATE' && payload.new) {
        console.log('[Realtime] Document update received:', {
          documentId: payload.new.id,
          status: payload.new.status,
          hasMarkdown: !!payload.new.parsed_markdown,
          hasChunks: !!payload.new.parsed_chunks,
        });
        onDocumentUpdate(payload.new);
      }
    },
    [onDocumentUpdate]
  );

  useEffect(() => {
    if (!enabled || !documentId) {
      return;
    }

    console.log('[Realtime] Setting up subscription for document:', documentId);

    // Subscribe to updates for the specific document
    const channel = supabase
      .channel(`document-${documentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'documents',
          filter: `id=eq.${documentId}`,
        },
        handleRealtimeUpdate
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
      });

    // Cleanup subscription on unmount or when dependencies change
    return () => {
      console.log('[Realtime] Cleaning up subscription for document:', documentId);
      supabase.removeChannel(channel);
    };
  }, [supabase, documentId, enabled, handleRealtimeUpdate]);
}