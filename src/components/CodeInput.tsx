import { useState } from 'react';
import { Code2, FileCode, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CodeInputProps {
  onCodeSubmit: (content: string, fileName: string) => void;
  className?: string;
}

export function CodeInput({ onCodeSubmit, className }: CodeInputProps) {
  const [code, setCode] = useState('');
  const [fileName, setFileName] = useState('index.html');

  const handleSubmit = () => {
    if (!code.trim()) return;
    
    // Ensure filename ends with .html
    let finalName = fileName.trim() || 'index.html';
    if (!finalName.endsWith('.html') && !finalName.endsWith('.htm')) {
      finalName += '.html';
    }
    
    onCodeSubmit(code, finalName);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <FileCode className="w-4 h-4 text-muted-foreground" />
          <Input
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="文件名 (如 index.html)"
            className="max-w-xs text-foreground"
          />
        </div>
      </div>
      
      <div className="relative">
        <Textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={`粘贴或输入 HTML 代码...\n\n例如:\n<!DOCTYPE html>\n<html>\n<head>\n  <title>我的页面</title>\n</head>\n<body>\n  <h1>Hello World!</h1>\n</body>\n</html>`}
          className="min-h-[300px] font-mono text-sm resize-none text-foreground"
        />
        <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
          {code.length} 字符
        </div>
      </div>
      
      <Button 
        onClick={handleSubmit}
        disabled={!code.trim()}
        className="w-full gap-2"
      >
        <Check className="w-4 h-4" />
        导入代码
      </Button>
    </div>
  );
}
