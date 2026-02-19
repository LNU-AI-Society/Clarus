import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-react';
import { Link } from '@tanstack/react-router';
import { useTranslate } from '@tolgee/react';
import { ReactNode } from 'react';
import BackNavigation from './BackNavigation';
import LanguageSwitch from './LanguageSwitch';
import ProfileMenu from './ProfileMenu';

type NavbarProps = {
  backTo?: string;
  backAriaLabel?: string;
  actions?: ReactNode;
  className?: string;
  containerClassName?: string;
};

const Navbar = ({
  backTo,
  backAriaLabel,
  actions,
  className,
  containerClassName,
}: NavbarProps) => {
  const { t } = useTranslate();
  const resolvedBackLabel = backAriaLabel ?? t('nav.back');

  return (
    <header
      className={`sticky top-0 z-30 bg-transparent backdrop-blur-[18px] ${
        className ?? ''
      } relative`}
    >
      {backTo && (
        <div className="absolute left-4 top-1/2 z-10 -translate-y-1/2 sm:left-6">
          <BackNavigation to={backTo} ariaLabel={resolvedBackLabel} isFixed={false} />
        </div>
      )}
      <div
        className={`relative mx-auto flex w-full max-w-[1120px] items-center justify-between px-[18px] py-4 sm:px-6 ${
          containerClassName ?? ''
        }`}
      >
        <div className="flex items-center gap-3">
          <Link to="/" className="font-['Sora'] text-[20px] font-bold text-[#1f2937]">
            Clarus
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {actions}
          <LanguageSwitch />
          <SignedOut>
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <button className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(167,185,180,0.7)] bg-white/90 px-4 py-2 text-sm font-semibold text-[#0f7a6a] transition-all duration-200 hover:shadow-[0_14px_30px_rgba(31,41,55,0.1)]">
                  {t('auth.signIn')}
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0f7a6a] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(15,122,106,0.28)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#0b6b5e]">
                  {t('auth.signUp')}
                </button>
              </SignUpButton>
            </div>
          </SignedOut>
          <SignedIn>
            <ProfileMenu />
          </SignedIn>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
