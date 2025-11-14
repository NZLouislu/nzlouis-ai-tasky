-- 创建 model_test_results 表来保存模型测试结果
CREATE TABLE IF NOT EXISTS model_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  model_id VARCHAR(100) NOT NULL,
  success BOOLEAN NOT NULL,
  tested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  error_message TEXT,
  response_text TEXT,
  CONSTRAINT fk_model_test_results_user FOREIGN KEY (user_id) 
    REFERENCES user_profiles(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_model UNIQUE (user_id, model_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_model_test_results_user 
  ON model_test_results(user_id);

CREATE INDEX IF NOT EXISTS idx_model_test_results_user_model 
  ON model_test_results(user_id, model_id);