"use client";
import { useState } from "react";
import { FaBars as Menu, FaTimes as X } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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
          </div>
        </div>
      )}
    </nav>
  );
}
