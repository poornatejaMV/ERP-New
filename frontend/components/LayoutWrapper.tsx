'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { AuthProvider } from './AuthProvider';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <AuthProvider>
      {!isLoginPage && <Sidebar />}
      <div className={isLoginPage ? '' : 'ml-64 p-6'}>
        {children}
      </div>
    </AuthProvider>
  );
}

