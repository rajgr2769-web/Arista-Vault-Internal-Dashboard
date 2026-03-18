import Sidebar from "@/components/sidebar/Sidebar";
import Navbar from "@/components/navbar/Navbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background transition-colors duration-300">
      <Sidebar role="admin" />
      <div className="flex-1 ml-64">
        <Navbar title="Admin Dashboard" />
        <main className="p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
