-- 添加分类字段到 deployments 表
ALTER TABLE public.deployments 
ADD COLUMN category VARCHAR(50) DEFAULT 'default';

-- 添加状态字段用于下架功能
ALTER TABLE public.deployments 
ADD COLUMN status VARCHAR(20) DEFAULT 'active';

-- 允许删除部署记录
CREATE POLICY "Service role can delete deployments" 
ON public.deployments FOR DELETE
USING (true);

-- 允许更新部署记录（用于下架）
CREATE POLICY "Service role can update deployments" 
ON public.deployments FOR UPDATE
USING (true);

-- 允许 service role 删除存储文件
CREATE POLICY "Service role can delete from html-pages"
ON storage.objects FOR DELETE
USING (bucket_id = 'html-pages');