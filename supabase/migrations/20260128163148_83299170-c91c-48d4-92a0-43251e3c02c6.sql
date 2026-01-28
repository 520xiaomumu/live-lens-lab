-- 创建 deployments 表
CREATE TABLE public.deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(10) UNIQUE NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  public_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

-- 允许任何人读取部署记录（公开访问）
CREATE POLICY "Anyone can read deployments"
  ON public.deployments FOR SELECT
  USING (true);

-- 允许通过 service role 插入（Edge Function 使用）
CREATE POLICY "Service role can insert deployments"
  ON public.deployments FOR INSERT
  WITH CHECK (true);

-- 创建存储桶
INSERT INTO storage.buckets (id, name, public) 
VALUES ('html-pages', 'html-pages', true);

-- 允许公开读取存储桶文件
CREATE POLICY "Public read access for html-pages"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'html-pages');

-- 允许 service role 上传文件
CREATE POLICY "Service role can upload to html-pages"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'html-pages');