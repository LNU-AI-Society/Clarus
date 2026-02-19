import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
        onClick={() => navigate(to)}
        aria-label={ariaLabel}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(229,222,216,0.9)] bg-white/85 text-[#5c6664] transition-all duration-200 hover:-translate-y-[1px] hover:border-[#a7b9b4] hover:text-[#0f7a6a]"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
    </nav>
  );
};

export default BackNavigation;
