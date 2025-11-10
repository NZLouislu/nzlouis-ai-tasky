"use client";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to AI Tasky
          </h2>
          <p className="text-gray-600">
            Sign in to start creating user stories with AI
          </p>
        </div>
        
        <button
          onClick={() => signIn("google", { callbackUrl: "/ai-tasky" })}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
        >
          <FcGoogle size={28} />
          <span className="text-lg font-medium">Sign in with Google</span>
        </button>
        
        <p className="mt-6 text-center text-sm text-gray-500">
          By signing in, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
