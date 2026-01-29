import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Trash2, History, Filter, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Deployment {
  id: string;
  slug: string;
  file_name: string;
  public_url: string;
  category: string | null;
  status: string | null;
  created_at: string | null;
}

const CATEGORIES = [
  { value: 'all', label: '全部分类' },
  { value: 'default', label: '默认' },
  { value: 'portfolio', label: '作品集' },
  { value: 'landing', label: '落地页' },
  { value: 'demo', label: '演示' },
  { value: 'test', label: '测试' },
];

export function DeploymentHistory() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchDeployments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('deployments')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDeployments(data || []);
    } catch (error) {
      console.error('Error fetching deployments:', error);
      toast.error('获取部署历史失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, [filterCategory]);

  const handleUnpublish = async (deployment: Deployment) => {
    try {
      const { error } = await supabase
        .from('deployments')
        .update({ status: 'unpublished' })
        .eq('id', deployment.id);

      if (error) throw error;

      toast.success('页面已下架');
      fetchDeployments();
    } catch (error) {
      console.error('Error unpublishing:', error);
      toast.error('下架失败');
    }
  };

  const handleCopyLink = async (slug: string, id: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('链接已复制');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryLabel = (category: string | null) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat?.label || category || '默认';
  };

  if (deployments.length === 0 && !loading) {
    return null;
  }

  return (
    <Card className="border-border bg-card/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="w-5 h-5 text-primary" />
            部署历史
          </CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-32 h-8 text-sm">
                <SelectValue />
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
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">加载中...</div>
        ) : (
          deployments.map((deployment) => (
            <div
              key={deployment.id}
              className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground truncate">
                    {deployment.file_name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {getCategoryLabel(deployment.category)}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>/{deployment.slug}</span>
                  <span>{formatDate(deployment.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleCopyLink(deployment.slug, deployment.id)}
                >
                  {copiedId === deployment.id ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(`/p/${deployment.slug}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认下架</AlertDialogTitle>
                      <AlertDialogDescription>
                        确定要下架 "{deployment.file_name}" 吗？下架后该链接将无法访问。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleUnpublish(deployment)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        确认下架
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
