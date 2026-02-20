import { SignOutButton } from '@clerk/clerk-react';
import { useTranslate } from '@tolgee/react';
import { User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type ProfileMenuProps = {
  className?: string;
};

const ProfileMenu = ({ className }: ProfileMenuProps) => {
  const { t } = useTranslate();
  const [isOpen, setIsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div ref={profileRef} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t('auth.profileMenu')}
        className="border-border/90 bg-surface/85 text-muted hover:border-border-strong hover:text-brand inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-soft transition-all duration-200 hover:-translate-y-px hover:shadow-soft-hover"
      >
        <User className="h-4 w-4" aria-hidden="true" />
      </button>
      <div
        role="menu"
        aria-hidden={!isOpen}
        className={`border-border/80 bg-surface/95 text-ink shadow-popover absolute right-0 top-full z-20 mt-2 w-52 rounded-2xl border p-2 text-sm backdrop-blur-sm transition-all duration-150 ${
          isOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-1 opacity-0'
        }`}
      >
        <SignOutButton>
          <button
            type="button"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="text-muted hover:bg-surface-muted flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left font-medium transition-colors"
          >
            {t('auth.signOut')}
          </button>
        </SignOutButton>
      </div>
    </div>
  );
};

export default ProfileMenu;
