
import type {Metadata} from 'next';

export const metadata: Metadata = {
  title: 'Drishti Sentinel',
  description: 'Advanced AI-Powered Event Security Dashboard',
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
        {children}
    </>
  );
}
