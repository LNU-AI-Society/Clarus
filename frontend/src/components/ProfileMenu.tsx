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
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(167,185,180,0.7)] bg-white/90 text-[#0f7a6a] shadow-[0_10px_24px_rgba(31,41,55,0.08)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#f5f1ec] hover:shadow-[0_14px_30px_rgba(31,41,55,0.12)]"
      >
        <User className="h-4 w-4" aria-hidden="true" />
      </button>
      <div
        role="menu"
        aria-hidden={!isOpen}
        className={`absolute right-0 top-full z-20 mt-2 w-52 rounded-2xl border border-[rgba(229,222,216,0.8)] bg-white/95 p-2 text-sm text-[#1f2937] shadow-[0_18px_40px_rgba(31,41,55,0.16)] backdrop-blur-sm transition-all duration-150 ${
          isOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-1 opacity-0'
        }`}
      >
        <SignOutButton>
          <button
            type="button"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left font-medium text-[#5c6664] transition-colors hover:bg-[#f5f1ec]"
          >
            {t('auth.signOut')}
          </button>
        </SignOutButton>
      </div>
    </div>
  );
};

export default ProfileMenu;
