/**
 * Loading States and Skeleton Components
 * Provides consistent loading experiences across Stories
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, FileText, Folder, Settings } from 'lucide-react';

/**
 * Generic loading spinner component
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
}

/**
 * Full page loading component
 */
export function PageLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

/**
 * Project list skeleton
 */
export function ProjectListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <div className="flex gap-2 mt-3">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Document list skeleton
 */
export function DocumentListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
          <FileText className="h-4 w-4 text-gray-400" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-12" />
        </div>
      ))}
    </div>
  );
}

/**
 * Editor skeleton
 */
export function EditorSkeleton() {
  return (
    <div className="space-y-4">
      {/* Toolbar skeleton */}
      <div className="flex items-center gap-2 p-2 border-b">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8" />
        ))}
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="space-y-4 p-4">
        <Skeleton className="h-6 w-64" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="ml-4 space-y-1">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );
}

/**
 * Sidebar skeleton
 */
export function SidebarSkeleton() {
  return (
    <div className="w-64 border-r bg-gray-50 p-4 space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-6 w-full" />
      </div>

      {/* Projects section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-gray-400" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="ml-6 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Documents section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="ml-6 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-32" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Sync status skeleton
 */
export function SyncStatusSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-4 rounded-full" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-12" />
    </div>
  );
}

/**
 * Settings form skeleton
 */
export function SettingsFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-gray-400" />
        <Skeleton className="h-6 w-32" />
      </div>

      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-3 w-48" />
        </div>
      ))}

      <div className="flex gap-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-16" />
      </div>
    </div>
  );
}

/**
 * Table skeleton
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 p-3 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Card grid skeleton
 */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Inline loading component for buttons
 */
export function ButtonLoading({ children, isLoading }: { children: React.ReactNode; isLoading: boolean }) {
  return (
    <>
      {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
      {children}
    </>
  );
}

/**
 * Progressive loading component
 */
interface ProgressiveLoadingProps {
  stages: Array<{
    name: string;
    duration: number;
  }>;
  currentStage: number;
}

export function ProgressiveLoading({ stages, currentStage }: ProgressiveLoadingProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-2 text-sm text-gray-600">
          {stages[currentStage]?.name || 'Loading...'}
        </p>
      </div>

      <div className="space-y-2">
        {stages.map((stage, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              index < currentStage ? 'bg-green-500' :
              index === currentStage ? 'bg-blue-500 animate-pulse' :
              'bg-gray-300'
            }`} />
            <span className={`text-sm ${
              index <= currentStage ? 'text-gray-900' : 'text-gray-500'
            }`}>
              {stage.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Lazy loading wrapper with skeleton
 */
interface LazyLoadingProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  error?: string;
}

export function LazyLoading({ isLoading, skeleton, children, error }: LazyLoadingProps) {
  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (isLoading) {
    return <>{skeleton}</>;
  }

  return <>{children}</>;
}