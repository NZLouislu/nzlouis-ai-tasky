"use client";
import { useState, useEffect } from "react";
import { FaBars as Menu, FaTimes as X } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [imageError, setImageError] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const { data: session } = useSession();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/verify', {
          credentials: 'include'
        });
        
        if (response.ok) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        setIsAdmin(false);
      }
    };

    checkAuth();
  }, [pathname]);

  useEffect(() => {
    if (session?.user?.name) {
      setUsername(session.user.name);
      setUserImage(session.user.image || null);
      setImageError(false);
    } else if (isAdmin) {
      setUsername("Admin");
      setUserImage(null);
      setImageError(false);
    } else {
      setUsername(null);
      setUserImage(null);
      setImageError(false);
    }
  }, [session, isAdmin]);

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
      if (session?.user) {
        await signOut({ redirect: false });
        router.push("/");
      }
      else if (isAdmin) {
        // Clear admin session
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminTokenExpiry");
        }

        // Clear both old and new admin cookies
        document.cookie =
          "adminToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        document.cookie =
          "admin-session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";

        // Call logout API
        try {
          await fetch('/api/admin/logout', { method: 'POST' });
        } catch (error) {
          console.error('Logout API error:', error);
        }

        setIsAdmin(false);
        router.push("/admin/login");
      }

      setUsername(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const items = [
    { label: "Home", href: "/" },
    { label: "Stories", href: "/stories" },
    { label: "Blog", href: "/blog" },
    { label: "Chatbot", href: "/chatbot" },
    { label: "Tasks", href: "/tasklist" },
    { label: "Workspace", href: "/workspace" },
  ];

  const linkCls = (isActive: boolean) =>
    `relative text-sm md:text-base font-medium transition-colors hover:text-indigo-600 ${isActive
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
              unoptimized
              className="w-[100px] h-[30px] object-contain"
            />
          </div>
        </Link>

        <div className="flex-1"></div>

        <div className="hidden md:flex items-center gap-6">
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

          {username && (
            <div className="flex items-center gap-4 border-l border-gray-200 pl-6">
              {/* User Avatar */}
              {userImage && !imageError ? (
                <div className="relative w-8 h-8 flex-shrink-0">
                  <Image
                    src={userImage}
                    alt={username || ""}
                    fill
                    sizes="32px"
                    className="rounded-full object-cover"
                    unoptimized
                    onError={() => setImageError(true)}
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                  {username?.charAt(0).toUpperCase()}
                </div>
              )}
              
              <span className="text-sm text-gray-700 font-medium">
                {username}
              </span>

              {isAdmin && (
                <Link
                  href="/blog/admin"
                  className="text-sm text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  Admin Panel
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="text-sm text-gray-700 hover:text-indigo-600 transition-colors underline"
              >
                Logout
              </button>
            </div>
          )}
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
                <div className="flex items-center gap-3 px-2 py-1">
                  {/* User Avatar */}
                  {userImage && !imageError ? (
                    <div className="relative w-8 h-8 flex-shrink-0">
                      <Image
                        src={userImage}
                        alt={username || ""}
                        fill
                        sizes="32px"
                        className="rounded-full object-cover"
                        unoptimized
                        onError={() => setImageError(true)}
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                      {username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-700 font-medium">
                    {username}
                  </div>
                </div>

                {isAdmin && (
                  <Link
                    href="/blog/admin"
                    className="text-sm text-gray-700 hover:text-indigo-600 px-2 py-1 transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}

                <button
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className="text-sm text-gray-700 hover:text-indigo-600 px-2 py-1 text-left transition-colors underline"
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
