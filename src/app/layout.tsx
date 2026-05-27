import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Ecole Globale — School ERP",
  description:
    "Boarding school management platform: gate pass, maintenance, academics & tuck shop.",
  icons: {
    icon: "/Ecole3.png",
    apple: "/Ecole3.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col font-['Plus_Jakarta_Sans']"
        suppressHydrationWarning
      >
        <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "14px",
              padding: "14px 18px",
              fontSize: "14px",
              fontWeight: 500,
            },
            success: {
              iconTheme: { primary: "#16a34a", secondary: "#fff" },
            },
            error: {
              iconTheme: { primary: "#dc2626", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}
