import { useState } from 'react';
import { ExternalLink, Copy, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';

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

  const handleDownloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'qrcode.png';
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="p-4 bg-accent/50 rounded-xl border border-primary/30 animate-fade-in">
      <p className="text-sm text-muted-foreground mb-3">🎉 部署成功！你的网页链接：</p>
      
      <div className="flex flex-col md:flex-row gap-4">
        {/* QR Code */}
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 bg-white rounded-lg">
            <QRCodeSVG 
              id="qr-code-svg"
              value={url} 
              size={120}
              level="M"
              includeMargin={false}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadQR}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <Download className="w-3 h-3 mr-1" />
            下载二维码
          </Button>
        </div>

        {/* Link and actions */}
        <div className="flex-1 flex flex-col justify-center gap-2">
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
          
          <p className="text-xs text-muted-foreground">
            扫描二维码或点击链接访问页面
          </p>
        </div>
      </div>
    </div>
  );
}
