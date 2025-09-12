import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">AI Tasky</h3>
            <p className="text-gray-300 mb-4 max-w-md">
              Your intelligent task management assistant powered by AI. Boost
              productivity and streamline your workflow.
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://www.nzlouis.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors"
              >
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm5.568 8.16c-.169 1.858-.896 3.391-2.108 4.608-1.227 1.236-2.896 1.928-4.898 1.928-.348 0-.686-.024-1.016-.07v-2.183c.33.046.668.07 1.016.07 1.423 0 2.688-.49 3.594-1.388.906-.898 1.388-2.171 1.388-3.594 0-.348-.024-.686-.07-1.016H12.46v-2.183c.33-.046.668-.07 1.016-.07 1.902 0 3.67.692 4.898 1.928 1.212 1.217 1.939 2.75 2.108 4.608L20.48 12l-.912-.84z" />
                </svg>
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Features</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/workspace"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Workspace
                </Link>
              </li>
              <li>
                <Link
                  href="/tasklist"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Task Management
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/chatbot"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  AI Chatbot
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/blog"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/chatbot"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.nzlouis.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 NZLouis AI Tasky. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link
              href="https://www.nzlouis.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="https://www.nzlouis.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
