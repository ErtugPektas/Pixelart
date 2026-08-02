import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useRealtimeSync(tables: string[], onUpdate: () => void) {
  useEffect(() => {
    const channels = tables.map((table) => {
      return supabase
        .channel(`public:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          onUpdate();
        })
        .subscribe();
    });

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
