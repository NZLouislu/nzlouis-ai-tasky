import React from "react";

/**
 * BlogSkeleton - Modern skeleton loading screen for blog page
 * Displays a realistic preview of the blog layout while content is loading
 */
export default function BlogSkeleton() {
  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden w-full">
      {/* Sidebar Skeleton */}
      <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-4 space-y-4 animate-pulse">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-200 rounded w-24"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>

          {/* Search Bar */}
          <div className="h-10 bg-gray-100 rounded-lg mb-4"></div>

          {/* Post Items */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center space-x-2 p-2 rounded-lg">
                {/* Icon */}
                <div className="h-5 w-5 bg-gray-200 rounded flex-shrink-0"></div>
                {/* Title */}
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
              </div>
              {/* Sub-items (for some posts) */}
              {i % 2 === 0 && (
                <div className="ml-7 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-12 animate-pulse">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gray-200 rounded"></div>
              <div className="h-10 w-10 bg-gray-200 rounded"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-9 w-24 bg-gray-200 rounded"></div>
              <div className="h-9 w-9 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Cover Image Skeleton */}
          <div className="mb-8 rounded-xl overflow-hidden">
            <div className="h-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer"></div>
          </div>

          {/* Icon and Title */}
          <div className="mb-8 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
              <div className="h-10 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>

          {/* Content Blocks */}
          <div className="space-y-6">
            {/* Paragraph 1 */}
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-11/12"></div>
              <div className="h-4 bg-gray-200 rounded w-10/12"></div>
            </div>

            {/* Heading */}
            <div className="h-7 bg-gray-300 rounded w-1/2 mt-8"></div>

            {/* Paragraph 2 */}
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-10/12"></div>
              <div className="h-4 bg-gray-200 rounded w-11/12"></div>
              <div className="h-4 bg-gray-200 rounded w-9/12"></div>
            </div>

            {/* List Items */}
            <div className="space-y-3 ml-4">
              <div className="flex items-start space-x-3">
                <div className="h-2 w-2 bg-gray-300 rounded-full mt-2"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="h-2 w-2 bg-gray-300 rounded-full mt-2"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="h-2 w-2 bg-gray-300 rounded-full mt-2"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
              </div>
            </div>

            {/* Paragraph 3 */}
            <div className="space-y-3 mt-6">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-10/12"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Add shimmer animation styles */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
          background-size: 1000px 100%;
        }
      `}</style>
    </div>
  );
}
