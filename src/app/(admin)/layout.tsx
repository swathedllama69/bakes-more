import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import MobileHeader from "@/components/MobileHeader";
import TheOrb from "@/components/ai/TheOrb";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bakery-bg">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Navigation */}
      <MobileHeader />
      <MobileNav />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-20 lg:ml-72 min-h-screen pt-16 pb-24 md:pt-0 md:pb-0">
        {children}
      </main>

      {/* AI Assistant */}
      <TheOrb />
    </div>
  );
}
