import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFileSelect: (content: string, fileName: string) => void;
  selectedFileName?: string;
  onClear: () => void;
}

export function FileUploader({ onFileSelect, selectedFileName, onClear }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      alert('请上传 HTML 文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileSelect(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  if (selectedFileName) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-accent/50 rounded-lg border border-primary/30">
        <File className="w-5 h-5 text-primary" />
        <span className="font-mono text-sm text-foreground flex-1">{selectedFileName}</span>
        <button
          onClick={onClear}
          className="p-1 hover:bg-destructive/20 rounded transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={cn(
        "relative border-2 border-dashed rounded-xl p-12 cursor-pointer transition-all duration-200",
        "flex flex-col items-center justify-center gap-4",
        "hover:border-primary/50 hover:bg-accent/30",
        isDragging ? "border-primary bg-accent drop-zone-active" : "border-border"
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".html,.htm"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className={cn(
        "w-16 h-16 rounded-full flex items-center justify-center transition-all",
        isDragging ? "bg-primary/20 scale-110" : "bg-muted"
      )}>
        <Upload className={cn(
          "w-8 h-8 transition-colors",
          isDragging ? "text-primary" : "text-muted-foreground"
        )} />
      </div>
      
      <div className="text-center">
        <p className="text-lg font-medium text-foreground">
          {isDragging ? "松开鼠标上传" : "拖放 HTML 文件到这里"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          或点击选择文件
        </p>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="px-2 py-1 bg-muted rounded font-mono">.html</span>
        <span className="px-2 py-1 bg-muted rounded font-mono">.htm</span>
      </div>
    </div>
  );
}
