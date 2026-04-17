const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from the current directory (server/)
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const initialCharities = [
    {
        name: 'Green Grass Foundation',
        description: 'Helping veterans through golf and community.',
        contribution_percentage: 10,
        is_featured: true
    },
    {
        name: 'Score for Kids',
        description: 'Providing golf equipment and lessons to underprivileged children.',
        contribution_percentage: 10,
        is_featured: false
    },
    {
        name: 'Hole in One Heart',
        description: 'Supporting cardiac research through sporting events.',
        contribution_percentage: 15,
        is_featured: false
    }
];

async function seed() {
    console.log('🌱 Seeding charities...');
    
    const { data, error } = await supabase
        .from('charities')
        .upsert(initialCharities, { onConflict: 'name' });

    if (error) {
        console.error('Error seeding charities:', error.message);
        console.error('Make sure the "charities" table exists in your database.');
    } else {
        console.log('✅ Charities seeded successfully!');
    }
}

seed();
