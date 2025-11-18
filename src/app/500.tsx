import React from 'react';

export default function Custom500() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-red-500 mb-2">500</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Internal Server Error
          </h2>
          <p className="text-gray-600 mb-6">
            Sorry, the server encountered an error and could not complete your request.
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Reload Page
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Go Back
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="block w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>If the problem persists, please contact technical support.</p>
        </div>
      </div>
    </div>
  );
}