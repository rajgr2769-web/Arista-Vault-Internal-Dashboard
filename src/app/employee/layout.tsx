import Sidebar from "@/components/sidebar/Sidebar";
import Navbar from "@/components/navbar/Navbar";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background transition-colors duration-300">
      <Sidebar role="employee" />
      <div className="flex-1 ml-64">
        <Navbar title="Employee Dashboard" />
        <main className="p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
