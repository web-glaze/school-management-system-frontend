import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "ECOLE ERP",
  description: "School Maintenance ERP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-['Plus_Jakarta_Sans']">
        <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            classNames: {
              title: "!font-bold font-['Plus_Jakarta_Sans']",
              description: "font-['Plus_Jakarta_Sans']",
            },
          }}
        />
      </body>
    </html>
  );
}
