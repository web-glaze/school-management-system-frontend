import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { Google_Sans } from "next/font/google";

export const metadata: Metadata = {
  title: "ECOLE ERP",
  description: "School Maintenance ERP",
};

const googleSans = Google_Sans({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-['Google_Sans']">
        <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            classNames: {
              title: "!font-bold font-['Google_Sans']",
              description: "font-['Google_Sans']",
            },
          }}
        />
      </body>
    </html>
  );
}