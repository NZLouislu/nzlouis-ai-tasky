"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Blog from "@/components/blog/Blog";

export default function BlogPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/blog/admin/login");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="h-screen overflow-hidden">
      <Blog />
    </div>
  );
}
