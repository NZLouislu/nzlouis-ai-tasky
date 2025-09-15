"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Blog from "@/components/Blog";

export default function BlogPage() {
  const router = useRouter();

  useEffect(() => {
    // 检查用户是否已认证
    const checkAuth = async () => {
      try {
        // 尝试从cookie获取token
        let token = null;
        if (typeof document !== "undefined") {
          const cookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith("adminToken="));
          if (cookie) {
            token = cookie.split("=")[1];
          }
        }

        // 如果cookie中没有token，尝试从localStorage获取
        if (!token && typeof localStorage !== "undefined") {
          token = localStorage.getItem("adminToken");
        }

        // 如果没有token，重定向到登录页面
        if (!token) {
          router.push("/blog/admin/login");
          return;
        }

        // 验证token的有效性
        const response = await fetch("/api/admin/verify", {
          method: "GET",
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          // Token无效，重定向到登录页面
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
