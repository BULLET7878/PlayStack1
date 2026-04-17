const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isValidUrl = (url) => url && url.startsWith('https://');

if (!isValidUrl(supabaseUrl) || !supabaseAnonKey || supabaseAnonKey.includes('placeholder')) {
    console.error('CRITICAL: Invalid or missing Supabase configuration in .env!');
    console.error('You must provide a valid SUPABASE_URL (starting with https://) and SUPABASE_ANON_KEY.');
}

const supabase = isValidUrl(supabaseUrl) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Use Service Role Client for admin-only operations (like bypassing RLS)
const supabaseAdmin = supabaseServiceRoleKey ? createClient(supabaseUrl, supabaseServiceRoleKey) : null;

module.exports = { supabase, supabaseAdmin };
