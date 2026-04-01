import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  linkClassName?: string;
  to?: string;
  onClick?: () => void;
}

export function Logo({ className, linkClassName, to = '/', onClick }: LogoProps) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={cn("font-black tracking-tighter transition-opacity hover:opacity-80", linkClassName)}
    >
      <span className={cn("text-xl", className)}>
        beseekr<span className="text-primary">.</span>
      </span>
    </Link>
  );
}
