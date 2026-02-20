import { ArrowLeft } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

type BackNavigationProps = {
  to: string;
  ariaLabel: string;
  className?: string;
  isFixed?: boolean;
};

const BackNavigation = ({ to, ariaLabel, className, isFixed = true }: BackNavigationProps) => {
  const navigate = useNavigate();
  const positionClassName = isFixed ? 'fixed left-4 top-4 z-30 sm:left-6 sm:top-6' : '';

  return (
    <nav
      aria-label={ariaLabel}
      className={`${positionClassName} ${className ?? ''}`}
    >
      <button
        type="button"
        onClick={() => navigate({ to })}
        aria-label={ariaLabel}
        className="border-border/90 bg-surface/85 text-muted hover:border-border-strong hover:text-brand inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 hover:-translate-y-px"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
    </nav>
  );
};

export default BackNavigation;
