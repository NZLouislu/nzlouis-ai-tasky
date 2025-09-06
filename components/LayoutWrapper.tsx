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
  const isChatbotPage = pathname?.startsWith("/chatbot");

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16 pb-4">{children}</main>
      {!isChatbotPage && <Footer className="shrink-0" />}
    </>
  );
}