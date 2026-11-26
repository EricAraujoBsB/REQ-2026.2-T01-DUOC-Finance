import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cliente: SupabaseClient | undefined;

/** Cliente Supabase (service role) compartilhado; somente no backend. */
export function obterClienteSupabase(): SupabaseClient {
  if (!cliente) {
    const url = process.env.SUPABASE_URL;
    const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !chave) {
      throw new Error(
        'SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos.',
      );
    }
    cliente = createClient(url, chave, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cliente;
}

export function nomeBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET || 'evidencias';
}
