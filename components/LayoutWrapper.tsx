"use client";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // const isBlogPage = pathname?.startsWith("/blog");
  const isHomePage = pathname === "/";

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-12 pb-4">{children}</main>
      {isHomePage && <Footer />}
    </>
  );
}
