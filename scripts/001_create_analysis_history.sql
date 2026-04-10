-- Create analysis_history table for storing stock analysis and market hot records
CREATE TABLE IF NOT EXISTS analysis_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('stock', 'market_hot')),
  stock_code VARCHAR(20),
  stock_name VARCHAR(100),
  analysis_result TEXT NOT NULL,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_analysis_history_type ON analysis_history(type);
CREATE INDEX IF NOT EXISTS idx_analysis_history_created_at ON analysis_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_history_stock_code ON analysis_history(stock_code);

-- Enable Row Level Security (optional for future auth)
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now (can be restricted later with auth)
CREATE POLICY "Allow all operations on analysis_history" ON analysis_history
  FOR ALL
  USING (true)
  WITH CHECK (true);
