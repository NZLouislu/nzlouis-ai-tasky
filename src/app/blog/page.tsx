"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Blog from "@/components/blog/Blog";
import BlogSkeleton from "@/components/blog/BlogSkeleton";

export default function BlogPage() {
  const router = useRouter();
  const { status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/admin/verify', {
          credentials: 'include'
        });
        setIsAdmin(response.ok);
      } catch {
        setIsAdmin(false);
      }
      setChecking(false);
    };

    checkAdmin();
  }, []);

  useEffect(() => {
    if (!checking && status === "unauthenticated" && !isAdmin) {
      router.replace("/auth/signin");
    }
  }, [status, isAdmin, checking, router]);

  if (status === "loading" || checking) {
    return <BlogSkeleton />;
  }

  if (status === "unauthenticated" && !isAdmin) {
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
