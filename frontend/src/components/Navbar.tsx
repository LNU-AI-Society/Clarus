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
};

const Navbar = ({
  backTo,
  backAriaLabel,
  actions,
  className,
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
        className={`relative mx-auto flex w-full max-w-layout items-center justify-between px-4 py-4 sm:px-6 `}
      >
        <div className="flex items-center gap-3">
          <Link to="/" className="font-display text-ink text-[20px] font-bold">
            Clarus
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {actions}
          <LanguageSwitch />
          <SignedOut>
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <button className="border-border/90 bg-surface/85 text-muted hover:border-border-strong hover:text-brand inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-px">
                  {t('auth.signIn')}
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-brand shadow-brand hover:bg-brand-hover inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px">
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
