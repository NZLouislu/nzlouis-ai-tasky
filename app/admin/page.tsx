"use client";
import { useEffect } from "react";

export default function AdminPage() {
  useEffect(() => {
    const adminLoginUrl = `${window.location.protocol}//${window.location.host}/blog/admin/login`;
    window.location.href = adminLoginUrl;
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">
          Redirecting to the administrator login page...
        </p>
      </div>
    </div>
  );
}
