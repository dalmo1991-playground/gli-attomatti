"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export function LayoutWrapper({ children, content }: { children: React.ReactNode, content: any }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Navbar content={content} />
      <main className="min-h-screen pt-20">
        {children}
      </main>
      <Footer content={content} />
    </>
  );
}
