import { useState } from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeployedLinkProps {
  url: string;
}

export function DeployedLink({ url }: DeployedLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 bg-accent/50 rounded-xl border border-primary/30 animate-fade-in">
      <p className="text-sm text-muted-foreground mb-2">🎉 部署成功！你的网页链接：</p>
      
      <div className="flex items-center gap-2">
        <div className="flex-1 px-3 py-2 bg-background rounded-lg border border-border">
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline font-mono text-sm break-all"
          >
            {url}
          </a>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
          className="shrink-0"
        >
          {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          asChild
          className="shrink-0"
        >
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
