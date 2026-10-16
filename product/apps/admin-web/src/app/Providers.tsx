import { I18nProvider } from '@ottimo/i18n';
import type { ReactNode } from 'react';
import { SessionProvider } from '../session/SessionProvider';
import { ThemeProvider } from './theme';
import { ToastProvider } from './toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <SessionProvider>
          <ToastProvider>{children}</ToastProvider>
        </SessionProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
