import { useState, useEffect } from 'react';

export function useTavilyKeyStatus() {
  const [hasTavilyKey, setHasTavilyKey] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkTavilyKey = async () => {
      try {
        const response = await fetch('/api/check-tavily-key');
        const data = await response.json();
        setHasTavilyKey(data.hasKey || false);
      } catch (error) {
        console.error('Failed to check Tavily API key:', error);
        setHasTavilyKey(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkTavilyKey();
  }, []);

  return { hasTavilyKey, isChecking };
}
