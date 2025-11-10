"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Blog from "@/components/blog/Blog";

export default function BlogPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    // Only redirect if we're sure there's no session
    if (status === "unauthenticated") {
      router.replace("/blog/admin/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      <Blog />
    </div>
  );
}
