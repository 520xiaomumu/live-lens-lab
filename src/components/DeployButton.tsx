import { Rocket, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DeployButtonProps {
  disabled: boolean;
  isDeploying: boolean;
  onClick: () => void;
}

export function DeployButton({ disabled, isDeploying, onClick }: DeployButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isDeploying}
      className={cn(
        "w-full h-14 text-lg font-semibold transition-all duration-300",
        "gradient-primary hover:opacity-90",
        !disabled && !isDeploying && "gradient-glow animate-pulse-glow"
      )}
    >
      {isDeploying ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          部署中...
        </>
      ) : (
        <>
          <Rocket className="w-5 h-5 mr-2" />
          部署到网页
        </>
      )}
    </Button>
  );
}
