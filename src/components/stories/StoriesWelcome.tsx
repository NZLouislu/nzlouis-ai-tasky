"use client";
import React from "react";
import { useStoriesStore } from "@/lib/stores/stories-store";

interface StoriesWelcomeProps {
  onConnectJira: () => void;
  onConnectTrello: () => void;
}

export default function StoriesWelcome({
  onConnectJira,
  onConnectTrello,
}: StoriesWelcomeProps) {
  const { platforms } = useStoriesStore();
  const jiraStatus = platforms.find(p => p.name === 'jira')?.connectionStatus || 'disconnected';
  const trelloStatus = platforms.find(p => p.name === 'trello')?.connectionStatus || 'disconnected';
  
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Stories
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your project management workflow by connecting your Jira or Trello boards
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div
            onClick={onConnectJira}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border-2 border-transparent hover:border-blue-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative p-8">
              <div className="flex items-center justify-center w-20 h-20 bg-blue-100 rounded-2xl mb-6 mx-auto group-hover:scale-110 transition-transform">
                <svg className="w-12 h-12 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.94 4.34 4.34 4.34V2.84a.84.84 0 0 0-.84-.84h-9.63zM2 11.53c2.4 0 4.35 1.97 4.35 4.35v1.78h1.7c2.4 0 4.34 1.94 4.34 4.34H2.84a.84.84 0 0 1-.84-.84v-9.63z"/>
                </svg>
              </div>
              
              <div className="flex items-center justify-center mb-3">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  jiraStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <h2 className="text-2xl font-bold text-gray-900">
                  Connect Jira
                </h2>
              </div>
              
              <p className="text-gray-600 text-center mb-6">
                Sync your Jira projects and create comprehensive reports and user stories
              </p>
              
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Access all your projects
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Generate AI-powered stories
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sync back to Jira
                </li>
              </ul>
              
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors group-hover:shadow-lg">
                Connect to Jira
              </button>
            </div>
          </div>

          <div
            onClick={onConnectTrello}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border-2 border-transparent hover:border-blue-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative p-8">
              <div className="flex items-center justify-center w-20 h-20 bg-blue-100 rounded-2xl mb-6 mx-auto group-hover:scale-110 transition-transform">
                <svg className="w-12 h-12 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 0H3C1.343 0 0 1.343 0 3v18c0 1.656 1.343 3 3 3h18c1.656 0 3-1.344 3-3V3c0-1.657-1.344-3-3-3zM10.44 18.18c0 .795-.645 1.44-1.44 1.44H4.56c-.795 0-1.44-.646-1.44-1.44V4.56c0-.795.645-1.44 1.44-1.44H9c.795 0 1.44.645 1.44 1.44v13.62zm9.44-6.54c0 .794-.645 1.44-1.44 1.44H14c-.795 0-1.44-.646-1.44-1.44V4.56c0-.795.646-1.44 1.44-1.44h4.44c.795 0 1.44.645 1.44 1.44v7.08z"/>
                </svg>
              </div>
              
              <div className="flex items-center justify-center mb-3">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  trelloStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <h2 className="text-2xl font-bold text-gray-900">
                  Connect Trello
                </h2>
              </div>
              
              <p className="text-gray-600 text-center mb-6">
                Import your Trello boards and streamline your workflow documentation
              </p>
              
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Access all your boards
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Create detailed reports
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sync back to Trello
                </li>
              </ul>
              
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors group-hover:shadow-lg">
                Connect to Trello
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
            How it works
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4 mx-auto">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Connect</h4>
              <p className="text-sm text-gray-600">
                Link your Jira or Trello account securely
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4 mx-auto">
                <span className="text-xl font-bold text-blue-600">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Select</h4>
              <p className="text-sm text-gray-600">
                Choose projects or boards to work with
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4 mx-auto">
                <span className="text-xl font-bold text-blue-600">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Create</h4>
              <p className="text-sm text-gray-600">
                Generate reports and stories with AI assistance
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Your credentials are encrypted and stored securely. We never share your data.
          </p>
        </div>
      </div>
    </div>
  );
}
