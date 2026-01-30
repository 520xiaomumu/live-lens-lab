import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tag } from 'lucide-react';

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
}

const CATEGORIES = [
  { value: 'test', label: '测试' },
  { value: 'demo', label: '演示' },
  { value: 'game', label: '游戏' },
  { value: 'tool', label: '工具' },
  { value: 'app', label: '应用' },
];

export function CategorySelect({ value, onChange }: CategorySelectProps) {
  return (
    <div className="flex items-center gap-2">
      <Tag className="w-4 h-4 text-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-32 h-9 text-foreground border-foreground/30">
          <SelectValue placeholder="选择分类" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map(cat => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
