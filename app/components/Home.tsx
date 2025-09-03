import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-2">
              Welcome to AI Tasky
            </h1>
            
            <p className="text-gray-600 text-center mb-8">
              Your intelligent task management assistant powered by AI
            </p>
            
            <div className="flex justify-center">
              <Link
                href="/editor"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
              >
                <span>Go to Editor</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
          
          <div className="bg-gray-50 px-8 py-6">
            <div className="flex justify-center space-x-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="text-center">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 mx-auto mb-2" />
                  <span className="text-sm text-gray-600">Feature {item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}