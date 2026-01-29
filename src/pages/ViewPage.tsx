import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft } from 'lucide-react';
import { SourceCodeViewer } from '@/components/SourceCodeViewer';

const ViewPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) {
        setError('无效的页面链接');
        setLoading(false);
        return;
      }

      try {
        // Get deployment record
        const { data: deployment, error: dbError } = await supabase
          .from('deployments')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (dbError) {
          console.error('Database error:', dbError);
          setError('加载页面失败');
          setLoading(false);
          return;
        }

        if (!deployment) {
          setError('页面不存在');
          setLoading(false);
          return;
        }

        // Check if page is unpublished
        if (deployment.status === 'unpublished') {
          setError('该页面已下架');
          setLoading(false);
          return;
        }

        // Fetch HTML content from storage
        const { data, error: storageError } = await supabase.storage
          .from('html-pages')
          .download(deployment.file_path);

        if (storageError) {
          console.error('Storage error:', storageError);
          setError('加载页面内容失败');
          setLoading(false);
          return;
        }

        const content = await data.text();
        setHtmlContent(content);
      } catch (err) {
        console.error('Error fetching page:', err);
        setError('发生未知错误');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">出错了</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <Link 
          to="/" 
          className="flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      <iframe
        srcDoc={htmlContent}
        className="w-full h-full border-0"
        title="Deployed Page"
        sandbox="allow-scripts allow-same-origin"
      />
      
      {/* Floating source code button */}
      <div className="fixed bottom-4 right-4 z-50">
        <SourceCodeViewer 
          content={htmlContent} 
          fileName={`${slug}.html`}
          className="shadow-lg"
        />
      </div>
    </div>
  );
};

export default ViewPage;
