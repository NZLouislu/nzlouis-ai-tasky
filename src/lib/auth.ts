/**
 * Authentication utilities for cross-browser compatibility
 * Handles authentication in different browser environments including embedded browsers
 */

export interface AuthResult {
  success: boolean;
  error?: string;
}

/**
 * Login function with enhanced compatibility for embedded browsers
 */
export async function login(
  username: string,
  password: string
): Promise<AuthResult> {
  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();

      // Store token in localStorage as backup for embedded browsers
      if (data.token) {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem(
          "adminTokenExpiry",
          (Date.now() + 24 * 60 * 60 * 1000).toString()
        );
      }

      return { success: true };
    } else {
      const errorData = await response.json();
      return { success: false, error: errorData.error || "Login failed" };
    }
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Network error. Please try again." };
  }
}

/**
 * Verify authentication with fallback methods
 */
export async function verifyAuth(): Promise<boolean> {
  try {
    // First, try the standard cookie-based verification
    const response = await fetch("/api/admin/verify", {
      method: "GET",
      credentials: "include",
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.authenticated) {
        return true;
      }
    }

    // Fallback: try with localStorage token in Authorization header
    const token = localStorage.getItem("adminToken");
    const expiry = localStorage.getItem("adminTokenExpiry");

    if (token && expiry && Date.now() < parseInt(expiry)) {
      const fallbackResponse = await fetch("/api/admin/verify", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });

      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        return data.authenticated;
      }
    } else if (token) {
      // Token expired, clean up
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminTokenExpiry");
    }

    return false;
  } catch (error) {
    console.error("Auth verification error:", error);
    return false;
  }
}

/**
 * Logout function
 */
export async function logout(): Promise<void> {
  try {
    // Clear localStorage
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminTokenExpiry");

    // Try to clear server-side cookie (may not work in all embedded browsers)
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => {
      // Ignore errors for logout endpoint that may not exist
    });
  } catch (error) {
    console.error("Logout error:", error);
  }
}

/**
 * Check if running in an embedded browser environment
 */
export function isEmbeddedBrowser(): boolean {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent;
  return (
    userAgent.includes("Electron") ||
    userAgent.includes("Qoder") ||
    window.location.protocol === "file:" ||
    window.parent !== window
  ); // iframe detection
}
