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
  const isHomePage = pathname === "/";
  const isBlogPage = pathname === "/blog";
  const isWorkspacePage = pathname === "/workspace";
  const isTasksPage = pathname === "/tasklist";
  const isChatbotPage = pathname === "/chatbot" || pathname?.startsWith("/chatbot/");

  return (
    <>
      <Navbar />
      <main
        className={`flex-1 ${
          isChatbotPage || isBlogPage || isWorkspacePage || isTasksPage
            ? ""
            : "pt-12 pb-4"
        }`}
      >
        {children}
      </main>
      {isHomePage && <Footer />}
    </>
  );
}
