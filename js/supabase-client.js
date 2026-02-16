/**
 * مكتبة المصباح - Supabase client
 * Creates window.supabaseClient when config is present (config.js sets SUPABASE_URL and SUPABASE_ANON_KEY)
 */
(function () {
    if (typeof window === 'undefined') return;
    if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase) {
        try {
            window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
        } catch (e) {
            console.warn('Supabase client init failed:', e);
            window.supabaseClient = null;
        }
    }
})();
