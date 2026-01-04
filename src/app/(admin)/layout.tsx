import Sidebar from "@/components/Sidebar";
import TheOrb from "@/components/ai/TheOrb";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bakery-bg">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-20 lg:ml-72 min-h-screen">
        {children}
      </main>

      {/* AI Assistant */}
      <TheOrb />
    </div>
  );
}
