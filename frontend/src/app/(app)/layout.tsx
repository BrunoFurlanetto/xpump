import TopBar from "./_components/topbar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="bg-background min-h-screen flex flex-col">
      <TopBar />
      {children}
    </main>
  );
}
