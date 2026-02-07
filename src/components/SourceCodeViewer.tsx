import { useState } from 'react';
import { Code2, Copy, Check, Download, Save, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface SourceCodeViewerProps {
  content: string;
  fileName?: string;
  className?: string;
  editable?: boolean;
  onContentChange?: (newContent: string) => void;
}

export function SourceCodeViewer({ 
  content, 
  fileName = 'index.html', 
  className,
  editable = false,
  onContentChange
}: SourceCodeViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(isEditing ? editedContent : content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([isEditing ? editedContent : content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    if (onContentChange) {
      onContentChange(editedContent);
    }
    setIsEditing(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setEditedContent(content);
      setIsEditing(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn("gap-2", className)}
      >
        <Code2 className="w-4 h-4" />
        {editable ? '查看/编辑源码' : '查看源码'}
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="flex items-center gap-2">
                <Code2 className="w-5 h-5" />
                源代码 - {fileName}
                {isEditing && <span className="text-xs text-primary">(编辑中)</span>}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {editable && !isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    编辑
                  </Button>
                )}
                {isEditing && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSave}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    保存
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  {copied ? '已复制' : '复制'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  下载
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          {isEditing ? (
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="flex-1 mt-4 font-mono text-sm resize-none text-foreground"
            />
          ) : (
            <div className="flex-1 mt-4 rounded-lg border border-border bg-muted/50 overflow-auto">
              <pre className="p-4 text-sm font-mono text-foreground whitespace-pre-wrap break-all">
                <code>{content}</code>
              </pre>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
