"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Blog from "@/components/blog/Blog";

export default function BlogPage() {
  const router = useRouter();

  useEffect(() => {
    // Verify user authentication status
    const checkAuth = async () => {
      try {
        // Attempt to extract token from cookie
        let token = null;
        if (typeof document !== "undefined") {
          const cookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith("adminToken="));
          if (cookie) {
            token = cookie.split("=")[1];
          }
        }

        // If no token in cookie, attempt to retrieve from localStorage
        if (!token && typeof localStorage !== "undefined") {
          token = localStorage.getItem("adminToken");
        }

        // If no token is found, redirect to login page
        if (!token) {
          router.push("/blog/admin/login");
          return;
        }

        // Verify token validity
        const response = await fetch("/api/admin/verify", {
          method: "GET",
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          // Token is invalid, redirect to login page
          router.push("/blog/admin/login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/blog/admin/login");
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="h-screen overflow-hidden">
      <Blog />
    </div>
  );
}
