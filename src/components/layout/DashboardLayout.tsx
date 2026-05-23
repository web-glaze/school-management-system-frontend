import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-[#f5f7fb]">
      
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 h-screen w-72 z-50">
        <Sidebar />
      </div>

      {/* Main Section */}
      <div className="flex-1 ml-72">
        
        {/* Navbar */}
        <Navbar />

        {/* Content */}
        <main className="p-8 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}