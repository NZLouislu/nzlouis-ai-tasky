'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatbotRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/ai-tasky');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Redirecting to AI Tasky...</p>
    </div>
  );
}
