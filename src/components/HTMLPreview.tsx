import { useState } from 'react';
import { Maximize2, Minimize2, Monitor, Smartphone, Tablet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HTMLPreviewProps {
  content: string;
  fileName: string;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const viewportSizes = {
  desktop: { width: '100%', label: '桌面' },
  tablet: { width: '768px', label: '平板' },
  mobile: { width: '375px', label: '手机' },
};

export function HTMLPreview({ content, fileName }: HTMLPreviewProps) {
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className={cn(
      "flex flex-col bg-card rounded-xl border border-border overflow-hidden animate-fade-in",
      isFullscreen && "fixed inset-4 z-50"
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/60" />
            <div className="w-3 h-3 rounded-full bg-muted-foreground/40" />
            <div className="w-3 h-3 rounded-full bg-primary/60" />
          </div>
          <span className="ml-3 text-sm font-mono text-muted-foreground">{fileName}</span>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Viewport toggles */}
          <div className="flex items-center gap-1 mr-2 p-1 bg-background rounded-lg">
            <button
              onClick={() => setViewport('desktop')}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewport === 'desktop' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title="桌面视图"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewport === 'tablet' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title="平板视图"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewport === 'mobile' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title="手机视图"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            title={isFullscreen ? "退出全屏" : "全屏预览"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {/* Preview area */}
      <div className="flex-1 bg-muted/30 p-4 overflow-auto flex justify-center">
        <div 
          className="bg-background rounded-lg shadow-lg overflow-hidden transition-all duration-300"
          style={{ 
            width: viewportSizes[viewport].width,
            maxWidth: '100%',
            height: isFullscreen ? 'calc(100vh - 120px)' : '500px'
          }}
        >
          <iframe
            srcDoc={content}
            className="w-full h-full border-0"
            title="HTML Preview"
            sandbox="allow-scripts"
          />
        </div>
      </div>
    </div>
  );
}
