import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";

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
    // suppressHydrationWarning: the `dark` class is set on the client by
    // theme logic (and browser extensions like Grammarly mutate <html> /
    // <body> attributes before React hydrates). Both are expected — React
    // would otherwise flag the className diff as a hydration mismatch.
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col font-['Plus_Jakarta_Sans']"
        suppressHydrationWarning
      >
        <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontSize: "13px",
              padding: "10px 14px",
              borderRadius: "10px",
            },
            success: { iconTheme: { primary: "#0d9488", secondary: "#fff" } },
            error: { iconTheme: { primary: "#dc2626", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
