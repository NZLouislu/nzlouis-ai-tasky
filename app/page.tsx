import GoogleAnalytics from "@/components/GoogleAnalytics";
import Link from "next/link";

export default function Page() {
  return (
    <>
      <GoogleAnalytics />
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to AI Tasky</h1>
          <Link
            href="/editor"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Go to Editor
          </Link>
        </div>
      </div>
    </>
  );
}
