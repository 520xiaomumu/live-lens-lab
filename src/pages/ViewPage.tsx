import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, ExternalLink } from 'lucide-react';

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
    <div className="min-h-screen bg-background">
      {/* Floating toolbar */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
        <Link 
          to="/" 
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          首页
        </Link>
        <div className="w-px h-4 bg-border" />
        <a
          href={`${window.location.origin}/p/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          新窗口
        </a>
      </div>

      {/* Full page iframe */}
      <iframe
        srcDoc={htmlContent}
        className="w-full h-screen border-0"
        title="Deployed Page"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export default ViewPage;
