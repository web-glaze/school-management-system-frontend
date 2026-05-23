import type { Metadata } from "next";
import "./globals.css";

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
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body
        className="min-h-full flex flex-col font-['Plus_Jakarta_Sans']"
      >
        {children}
      </body>
    </html>
  );
}