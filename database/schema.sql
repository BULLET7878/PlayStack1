-- Playstake Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Charities Table
CREATE TABLE charities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    website_url TEXT,
    contribution_percentage INTEGER DEFAULT 10,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users Table (Extending Supabase Auth users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    charity_id UUID REFERENCES charities(id),
    charity_contribution_percentage INTEGER DEFAULT 10 CHECK (charity_contribution_percentage >= 10),
    subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'expired', 'cancelled')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions History
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    plan_type TEXT CHECK (plan_type IN ('monthly', 'yearly')),
    status TEXT DEFAULT 'active',
    amount DECIMAL(10, 2),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Golf Scores Table
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    value INTEGER NOT NULL CHECK (value >= 1 AND value <= 45),
    score_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Unique constraint to prevent multiple scores on the same date for a user
    UNIQUE (user_id, score_date)
);

-- Draw Records Table
CREATE TABLE draws (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draw_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    draw_type TEXT CHECK (draw_type IN ('random', 'algorithm')),
    winning_numbers INTEGER[] NOT NULL,
    jackpot_amount DECIMAL(15, 2) DEFAULT 0,
    is_simulation BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Winners Table
CREATE TABLE winners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    match_type INTEGER CHECK (match_type IN (3, 4, 5)),
    prize_amount DECIMAL(15, 2) NOT NULL,
    proof_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'paid')),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    type TEXT CHECK (type IN ('subscription_payment', 'prize_payout', 'charity_donation')),
    status TEXT DEFAULT 'success',
    stripe_payment_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function to handle 5-score limit
CREATE OR REPLACE FUNCTION handle_max_scores()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM scores
    WHERE id IN (
        SELECT id FROM scores
        WHERE user_id = NEW.user_id
        ORDER BY score_date ASC, created_at ASC
        OFFSET 5
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce 5-score limit
-- Note: This deletes the OLDEST scores if we have MORE THAN 5.
-- Since we want to keep ONLY the latest 5, we can use a simpler approach in the trigger
-- OR handle it in the application layer. The PRD says "If new score added -> oldest score removed automatically".
-- Let's refine the trigger to keep ONLY the top 5 by date.

CREATE OR REPLACE FUNCTION enforce_five_score_limit()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM scores
  WHERE id NOT IN (
    SELECT id
    FROM scores
    WHERE user_id = NEW.user_id
    ORDER BY score_date DESC, created_at DESC
    LIMIT 5
  )
  AND user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER score_limit_trigger
AFTER INSERT ON scores
FOR EACH ROW
EXECUTE FUNCTION enforce_five_score_limit();

-- Insert initial charities
INSERT INTO charities (name, description, contribution_percentage, is_featured) VALUES
('Green Grass Foundation', 'Helping veterans through golf and community.', 10, true),
('Score for Kids', 'Providing golf equipment and lessons to underprivileged children.', 10, false),
('Hole in One Heart', 'Supporting cardiac research through sporting events.', 15, false);
