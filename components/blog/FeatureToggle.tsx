import { ReactNode } from 'react'
import { useBlogStore } from '@/lib/stores/blog-store'

interface FeatureToggleProps {
  feature: 'total_views' | 'total_likes' | 'total_comments' | 'ai_summaries' | 'ai_questions'
  children: ReactNode
  fallback?: ReactNode
}

export function FeatureToggle({ feature, children, fallback = null }: FeatureToggleProps) {
  const featureToggles = useBlogStore(state => state.featureToggles)

  if (!featureToggles?.[feature]) {
    return <>{fallback}</>
  }

  return <>{children}</>
}