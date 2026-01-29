import { useState, useCallback } from 'react';
import { Code2, Zap } from 'lucide-react';
import { FileUploader } from '@/components/FileUploader';
import { HTMLPreview } from '@/components/HTMLPreview';
import { DeployButton } from '@/components/DeployButton';
import { DeployedLink } from '@/components/DeployedLink';
import { DeploymentHistory } from '@/components/DeploymentHistory';
import { CategorySelect } from '@/components/CategorySelect';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState<string>('');
  const [category, setCategory] = useState<string>('default');
  const [notes, setNotes] = useState<string>('');
  const [historyKey, setHistoryKey] = useState(0);

  const handleFileSelect = (content: string, name: string) => {
    setHtmlContent(content);
    setFileName(name);
    setDeployedUrl('');
  };

  const handleClear = () => {
    setHtmlContent('');
    setFileName('');
    setDeployedUrl('');
    setNotes('');
  };

  const handleDeploy = async () => {
    if (!htmlContent || !fileName) {
      toast.error('请先上传 HTML 文件');
      return;
    }

    setIsDeploying(true);
    
    try {
      const response = await supabase.functions.invoke('deploy', {
        body: {
          htmlContent,
          fileName,
          category,
          notes: notes.trim() || null,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || '部署失败');
      }

      const { publicUrl, slug } = response.data;
      
      // Use the app's own route for viewing
      const viewUrl = `${window.location.origin}/p/${slug}`;
      setDeployedUrl(viewUrl);
      toast.success('部署成功！');
      // Refresh history
      setHistoryKey(prev => prev + 1);
    } catch (error) {
      console.error('Deploy error:', error);
      toast.error(error instanceof Error ? error.message : '部署失败，请稍后重试');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Code2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">HTMLDrop</h1>
              <p className="text-xs text-muted-foreground">预览 & 部署 HTML</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="w-4 h-4 text-primary" />
            <span>即时部署</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero */}
          <div className="text-center space-y-4 py-8">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              一键部署你的 <span className="text-primary">HTML</span> 页面
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              上传 HTML 文件，即时预览效果，一键部署到网络，自动生成专属链接
            </p>
          </div>

          {/* Upload Section */}
          <section className="space-y-4">
            <FileUploader 
              onFileSelect={handleFileSelect}
              selectedFileName={fileName}
              onClear={handleClear}
            />
          </section>

          {/* Preview Section */}
          {htmlContent && (
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                预览
              </h3>
              <HTMLPreview content={htmlContent} fileName={fileName} />
            </section>
          )}

          {/* Deploy Section */}
          {htmlContent && (
            <section className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <CategorySelect value={category} onChange={setCategory} />
                </div>
                <Textarea
                  placeholder="添加备注（可选）：描述这个页面的用途、版本信息等..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none h-20 text-foreground"
                />
                <DeployButton 
                  disabled={!htmlContent}
                  isDeploying={isDeploying}
                  onClick={handleDeploy}
                />
              </div>
              
              {deployedUrl && <DeployedLink url={deployedUrl} />}
            </section>
          )}

          {/* Deployment History */}
          <DeploymentHistory key={historyKey} />

          {/* Features */}
          {!htmlContent && (
            <section className="grid md:grid-cols-3 gap-6 py-8">
              {[
                { 
                  title: '拖放上传', 
                  desc: '支持拖放或点击选择 HTML 文件',
                  icon: '📁'
                },
                { 
                  title: '实时预览', 
                  desc: '桌面、平板、手机三种视图模式',
                  icon: '👁️'
                },
                { 
                  title: '即时部署', 
                  desc: '一键部署，自动生成访问链接',
                  icon: '🚀'
                },
              ].map((feature) => (
                <div 
                  key={feature.title}
                  className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>HTMLDrop - 简单、快速的 HTML 部署平台</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
