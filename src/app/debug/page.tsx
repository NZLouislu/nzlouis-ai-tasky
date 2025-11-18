"use client";

import { useEffect, useState } from "react";
import { supabase, supabaseService } from "@/lib/supabase/supabase-client";
import {
  getTaskySupabaseConfig,
  getTaskySupabaseServiceConfig,
} from "@/lib/environment";

export default function DebugPage() {
  const [envInfo, setEnvInfo] = useState<string>("");
  const [supabaseStatus, setSupabaseStatus] = useState<string>("");
  const [testResult, setTestResult] = useState<string>("");

  useEffect(() => {
    // Get environment variable information
    const config = getTaskySupabaseConfig();
    const serviceConfig = getTaskySupabaseServiceConfig();

    setEnvInfo(
      JSON.stringify(
        {
          config,
          serviceConfig,
          processEnv: {
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
              ? "Present"
              : "Missing",
            NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env
              .NEXT_PUBLIC_SUPABASE_ANON_KEY
              ? "Present"
              : "Missing",
            TASKY_SUPABASE_SERVICE_ROLE_KEY: process.env
              .TASKY_SUPABASE_SERVICE_ROLE_KEY
              ? "Present"
              : "Missing",
          },
        },
        null,
        2
      )
    );

    setSupabaseStatus(
      JSON.stringify(
        {
          supabase: supabase ? "Initialized" : "Not initialized",
          supabaseService: supabaseService ? "Initialized" : "Not initialized",
          supabaseDetails: supabase
            ? {
                url: config.url ? "Present" : "Missing",
              }
            : null,
          supabaseServiceDetails: supabaseService
            ? {
                url: serviceConfig.url ? "Present" : "Missing",
              }
            : null,
        },
        null,
        2
      )
    );
  }, []);

  const testSupabaseConnection = async () => {
    setTestResult("Testing connection...");

    try {
      if (supabaseService) {
        const { data, error } = await supabaseService
          .from("blog_posts")
          .select("*")
          .limit(1);

        if (error) {
          setTestResult(`Service client error: ${error.message}`);
        } else {
          setTestResult(`Service client success. Rows: ${data?.length || 0}`);
        }
      } else if (supabase) {
        const { data, error } = await supabase
          .from("blog_posts")
          .select("*")
          .limit(1);

        if (error) {
          setTestResult(`Regular client error: ${error.message}`);
        } else {
          setTestResult(`Regular client success. Rows: ${data?.length || 0}`);
        }
      } else {
        setTestResult("No Supabase client available");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setTestResult(`Test failed: ${error.message}`);
      } else {
        setTestResult(`Test failed: Unknown error`);
      }
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Information</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
        <pre className="bg-gray-100 p-4 rounded">{envInfo}</pre>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Supabase Client Status</h2>
        <pre className="bg-gray-100 p-4 rounded">{supabaseStatus}</pre>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Connection Test</h2>
        <button
          onClick={testSupabaseConnection}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Supabase Connection
        </button>
        <div className="mt-4 p-4 bg-gray-100 rounded">
          {testResult || "Click the button to test connection"}
        </div>
      </div>
    </div>
  );
}
