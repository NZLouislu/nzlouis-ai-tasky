"use client";
import { useState, useEffect } from "react";
import { FaBars as Menu, FaTimes as X } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

// 解析token的函数，与后端保持一致
const parseToken = (token: string): { username: string } | null => {
  try {
    // 与后端一致，token是base64编码的 "username:timestamp"
    const decodedString = atob(token);
    const [username] = decodedString.split(":");
    return { username };
  } catch (error) {
    console.error("Token parsing error:", error);
    return null;
  }
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // 检查用户是否已登录
  useEffect(() => {
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

        if (token) {
          // 解析token获取用户名
          const parsedToken = parseToken(token);
          if (parsedToken) {
            setUsername(parsedToken.username);
          } else {
            setUsername(null);
          }
        } else {
          setUsername(null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setUsername(null);
      }
    };

    checkAuth();
  }, [pathname]);

  const handleNavigation = (href: string) => {
    if (pathname === "/blog" && href !== "/blog") {
      window.dispatchEvent(
        new CustomEvent("routeChange", {
          detail: { pathname: href },
        })
      );

      setTimeout(() => {
        router.push(href);
      }, 100);
    } else {
      router.push(href);
    }
  };

  const handleLogout = async () => {
    try {
      // 清除localStorage中的token
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminTokenExpiry");
      }

      // 清除cookie中的token
      document.cookie =
        "adminToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";

      // 更新状态
      setUsername(null);

      // 重定向到登录页面
      router.push("/blog/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const items = [
    { label: "Home", href: "/" },
    { label: "Workspace", href: "/workspace" },
    { label: "Tasks", href: "/tasklist" },
    { label: "Blog", href: "/blog" },
    { label: "Chatbot", href: "/chatbot" },
  ];

  const linkCls = (isActive: boolean) =>
    `relative text-sm md:text-base font-medium transition-colors hover:text-indigo-600 ${
      isActive
        ? "text-indigo-600 font-bold after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-full after:bg-indigo-600"
        : "text-gray-700"
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="mx-auto flex max-w-[1200px] items-center px-6 py-4">
        <Link
          href="https://www.nzlouis.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center flex-shrink-0"
        >
          <div className="flex items-center w-[100px] h-[30px]">
            <Image
              src="/images/nzlouis-logo.png"
              alt="Nzlouis logo — Lu Louis"
              width={100}
              height={30}
              priority
              className="w-[100px] h-[30px] object-contain"
            />
          </div>
        </Link>

        <div className="flex-1"></div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {username ? (
            <div className="hidden md:flex items-center gap-4">
              <span className="text-sm text-gray-700">Admin</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-700 hover:text-indigo-600 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : null}

          <div className="hidden md:flex">
            <div className="flex gap-6">
              {items.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={linkCls(pathname === item.href)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-gray-700 hover:text-blue-600 focus:outline-none"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white/95">
          <div className="flex flex-col gap-1 p-2">
            {items.map((item) => (
              <button
                key={item.href}
                onClick={() => {
                  setOpen(false);
                  handleNavigation(item.href);
                }}
                className={linkCls(pathname === item.href)}
              >
                {item.label}
              </button>
            ))}

            {username ? (
              <div className="flex flex-col gap-1 pt-2 border-t border-gray-200 mt-2">
                <div className="text-sm text-gray-700 px-2">
                  Logged in as: Admin
                </div>
                <button
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className="text-sm text-gray-700 hover:text-indigo-600 px-2 py-1 text-left transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
}
