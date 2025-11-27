import { AlertCircle, Settings, Info } from 'lucide-react';
import Link from 'next/link';

interface TavilyKeyWarningProps {
  provider: string;
  onDismiss?: () => void;
}

export default function TavilyKeyWarning({ provider, onDismiss }: TavilyKeyWarningProps) {
  const isGoogle = provider === 'google';
  
  return (
    <div className={`mb-3 px-4 py-3 ${isGoogle ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-amber-50 border-l-4 border-amber-500'} rounded-r-lg shadow-sm`}>
      <div className="flex items-start gap-3">
        {isGoogle ? (
          <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
        ) : (
          <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
        )}
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold ${isGoogle ? 'text-blue-900' : 'text-amber-900'} mb-1`}>
            {isGoogle ? 'Using Google Search Grounding' : 'Tavily API Key Required'}
          </h3>
          <p className={`text-sm ${isGoogle ? 'text-blue-800' : 'text-amber-800'} mb-2`}>
            {isGoogle ? (
              <>
                Web search is enabled using Google's built-in Search Grounding. For enhanced search capabilities with other AI models, consider configuring a Tavily API key in Settings.
              </>
            ) : (
              <>
                Web search is enabled, but Tavily API key is not configured. Please set up your API key in Settings to use web search with this AI model.
              </>
            )}
          </p>
          <Link
            href="/chatbot/settings"
            className={`inline-flex items-center gap-2 px-3 py-1.5 ${isGoogle ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'} text-white text-sm font-medium rounded-lg transition-colors`}
          >
            <Settings size={16} />
            {isGoogle ? 'Configure Tavily (Optional)' : 'Go to Settings'}
          </Link>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`${isGoogle ? 'text-blue-600 hover:text-blue-800' : 'text-amber-600 hover:text-amber-800'} transition-colors flex-shrink-0`}
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
