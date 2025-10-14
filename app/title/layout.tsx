import AppHeader from '@/components/AppHeader';

export default function TitleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
