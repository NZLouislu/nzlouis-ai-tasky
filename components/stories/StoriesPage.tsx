"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import StoriesSidebar from "./StoriesSidebar";
import StoriesContent from "./StoriesContent";
import { useStoriesStore } from "@/lib/stores/stories-store";

export default function StoriesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { setUserId, userId } = useStoriesStore();

  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const response = await fetch('/api/admin/verify', {
          credentials: 'include'
        });
        
        if (response.ok) {
          console.log("✅ Admin session detected, using admin-user-id");
          setUserId('admin-user-id');
          setIsAdmin(true);
          setIsCheckingAdmin(false);
          return;
        }
      } catch (error) {
        console.log("No admin session found");
      }
      setIsCheckingAdmin(false);
    };

    checkAdminSession();
  }, [setUserId]);

  useEffect(() => {
    if (isCheckingAdmin) return;

    console.log("Session status:", sessionStatus);
    console.log("Session data:", session);
    console.log("Current userId:", userId);

    if (session?.user?.id && userId !== session.user.id && userId !== 'admin-user-id') {
      console.log("✅ Setting userId from NextAuth session:", session.user.id);
      setUserId(session.user.id);
    } else if (userId === "00000000-0000-0000-0000-000000000000") {
      console.warn("⚠️ No valid user ID available. User may need to log in.");
      console.warn("Session status:", sessionStatus);
    } else {
      console.log("✅ Using existing userId:", userId);
    }
  }, [session, userId, setUserId, sessionStatus, isCheckingAdmin]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  }, [isMobile, sidebarOpen, sidebarCollapsed]);

  if (sessionStatus === "loading" || isCheckingAdmin) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      <StoriesSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        isMobile={isMobile}
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isMobile 
          ? (sidebarOpen ? 'ml-0' : 'ml-0') 
          : (sidebarCollapsed ? 'ml-16' : 'ml-80')
      }`}>
        <StoriesContent />
      </div>
    </div>
  );
}