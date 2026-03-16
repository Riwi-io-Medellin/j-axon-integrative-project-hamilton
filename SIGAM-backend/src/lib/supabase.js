import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos para inicializar Supabase');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function testSupabaseConnection() {
    const { error } = await supabase.from('_not_a_table_').select('*').limit(1);

    // Depending on PostgREST/Supabase version, missing table can return
    // PGRST116 or PGRST205. Both indicate the API is reachable.
    const allowedMissingTableCodes = new Set(['PGRST116', 'PGRST205']);
    if (error && !allowedMissingTableCodes.has(error.code)) {
        throw error;
    }

    return { ok: true };
}
