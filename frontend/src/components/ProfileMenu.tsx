import { Menu } from '@base-ui/react';
import { SignOutButton } from '@clerk/clerk-react';
import { useTranslate } from '@tolgee/react';
import { User } from 'lucide-react';

type ProfileMenuProps = {
  className?: string;
};

const ProfileMenu = ({ className }: ProfileMenuProps) => {
  const { t } = useTranslate();

  return (
    <div className={`relative ${className ?? ''}`}>
      <Menu.Root>
        <Menu.Trigger
          aria-label={t('auth.profileMenu')}
          className="border-border/90 bg-surface/85 text-muted hover:border-border-strong hover:text-brand shadow-soft hover:shadow-soft-hover inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 hover:-translate-y-px"
        >
          <User className="h-4 w-4" aria-hidden="true" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="z-50">
            <Menu.Popup className="border-border/80 bg-surface/95 text-ink shadow-popover absolute top-full right-0 z-50 mt-2 w-52 rounded-2xl border p-2 text-sm backdrop-blur-sm transition-all duration-150 data-[state=closed]:pointer-events-none data-[state=closed]:translate-y-1 data-[state=closed]:opacity-0 data-[state=open]:translate-y-0 data-[state=open]:opacity-100">
              <SignOutButton>
                <Menu.Item
                  render={<button type="button" />}
                  className="text-muted hover:bg-surface-muted flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left font-medium transition-colors"
                >
                  {t('auth.signOut')}
                </Menu.Item>
              </SignOutButton>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
};

export default ProfileMenu;
