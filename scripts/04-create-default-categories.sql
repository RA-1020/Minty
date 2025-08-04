-- Function to create default categories for a user
CREATE OR REPLACE FUNCTION create_default_categories(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Insert default expense categories
  INSERT INTO categories (user_id, name, color, type, monthly_limit, alert_enabled, alert_threshold) VALUES
    (user_id, 'Food & Dining', '#8884d8', 'expense', 800, true, 90),
    (user_id, 'Transportation', '#82ca9d', 'expense', 400, true, 85),
    (user_id, 'Shopping', '#ffc658', 'expense', 500, true, 90),
    (user_id, 'Entertainment', '#ff7300', 'expense', 300, false, 80),
    (user_id, 'Bills & Utilities', '#00ff00', 'expense', 600, true, 95),
    (user_id, 'Healthcare', '#22c55e', 'expense', 200, true, 90),
    (user_id, 'Travel', '#06b6d4', 'expense', 0, false, 90);

  -- Insert default income categories
  INSERT INTO categories (user_id, name, color, type) VALUES
    (user_id, 'Salary', '#22c55e', 'income'),
    (user_id, 'Freelance', '#84cc16', 'income'),
    (user_id, 'Investments', '#06b6d4', 'income'),
    (user_id, 'Other Income', '#8b5cf6', 'income');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
