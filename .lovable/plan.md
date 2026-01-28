
# HTML 部署功能实现计划

## 概述
实现真正的 HTML 文件部署功能，用户上传的 HTML 文件将存储到云端，并生成唯一的可访问链接。

## 实现架构

```text
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   前端      │ ───► │  Edge Function│ ───► │  Storage    │
│  (React)    │      │  (deploy)     │      │  (Bucket)   │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │  Database   │
                     │(deployments)│
                     └─────────────┘
```

## 实现步骤

### 1. 创建数据库表
创建 `deployments` 表存储部署记录：
- `id` - 唯一标识符 (UUID)
- `slug` - 短链接标识 (如 abc123)
- `file_name` - 原始文件名
- `file_path` - 存储路径
- `public_url` - 公开访问 URL
- `created_at` - 创建时间

### 2. 创建存储桶
创建名为 `html-pages` 的公开存储桶，用于存储 HTML 文件。

### 3. 创建 Edge Function
创建 `deploy` 边缘函数处理部署逻辑：
- 接收 HTML 内容和文件名
- 生成唯一的 6 位短链接 slug
- 将 HTML 文件上传到存储桶
- 在数据库中记录部署信息
- 返回公开访问链接

### 4. 更新前端代码
修改 `Index.tsx` 中的 `handleDeploy` 函数：
- 调用 deploy Edge Function
- 显示部署成功后的链接
- 处理错误情况

### 5. 创建访问页面
创建 `/p/:slug` 路由用于访问已部署的页面：
- 根据 slug 从数据库获取文件信息
- 从存储桶获取 HTML 内容
- 渲染完整的 HTML 页面

---

## 技术细节

### 数据库迁移 SQL
```sql
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
```

### Edge Function 核心逻辑
- 使用 `nanoid` 或自定义函数生成 6 位随机 slug
- 文件路径格式：`{slug}/index.html`
- 公开 URL 格式：`https://{project_id}.supabase.co/storage/v1/object/public/html-pages/{slug}/index.html`

### 文件变更清单
| 文件 | 操作 | 说明 |
|------|------|------|
| `supabase/functions/deploy/index.ts` | 新建 | 部署处理 Edge Function |
| `src/pages/Index.tsx` | 修改 | 集成真实部署 API |
| `src/pages/ViewPage.tsx` | 新建 | 查看已部署页面 |
| `src/App.tsx` | 修改 | 添加 /p/:slug 路由 |
