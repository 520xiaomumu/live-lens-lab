import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tag } from 'lucide-react';

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
}

const CATEGORIES = [
  { value: 'default', label: '默认' },
  { value: 'portfolio', label: '作品集' },
  { value: 'landing', label: '落地页' },
  { value: 'demo', label: '演示' },
  { value: 'test', label: '测试' },
];

export function CategorySelect({ value, onChange }: CategorySelectProps) {
  return (
    <div className="flex items-center gap-2">
      <Tag className="w-4 h-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-32 h-9">
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
