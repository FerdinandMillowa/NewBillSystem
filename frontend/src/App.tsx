import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Layout } from "./components/layout/Layout";
import { Login } from "./pages/Login";
import { QuickActions } from "./pages/QuickActions";
import { Dashboard } from "./pages/Dashboard";
import { Customers } from "./pages/Customers";
import { Bills } from "./pages/Bills";
import { Payments } from "./pages/Payments";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { CustomerDetails } from "./pages/CustomerDetails";
import { Products } from "./pages/Products";
import { DailySales } from "./pages/DailySales";
import { Users } from "./pages/Users";
import { Profile } from "./pages/Profile";

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  // Initialize theme on app mount
  useEffect(() => {
    const initializeTheme = () => {
      const savedPreferences = localStorage.getItem("app-preferences");

      if (savedPreferences) {
        try {
          const preferences = JSON.parse(savedPreferences);
          const theme = preferences.theme || "light";

          const root = document.documentElement;
          root.classList.remove("dark", "light");

          if (theme === "dark") {
            root.classList.add("dark");
          } else if (theme === "light") {
            root.classList.add("light");
          } else if (theme === "auto") {
            if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
              root.classList.add("dark");
            } else {
              root.classList.add("light");
            }
          }
        } catch (error) {
          console.error("Failed to parse preferences:", error);
          document.documentElement.classList.add("light");
        }
      } else {
        // Default to light theme
        document.documentElement.classList.add("light");
      }
    };

    initializeTheme();

    // Listen for system theme changes when in auto mode
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const savedPreferences = localStorage.getItem("app-preferences");
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        if (preferences.theme === "auto") {
          const root = document.documentElement;
          root.classList.remove("dark", "light");
          if (mediaQuery.matches) {
            root.classList.add("dark");
          } else {
            root.classList.add("light");
          }
        }
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                {/* Quick Actions - Landing page for ALL users */}
                <Route path="/quick-actions" element={<QuickActions />} />

                {/* Dashboard and other pages */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/customers/:id" element={<CustomerDetails />} />
                <Route path="/bills" element={<Bills />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/products" element={<Products />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/daily-sales" element={<DailySales />} />
                <Route path="/users" element={<Users />} />
                <Route path="/profile" element={<Profile />} />

                {/* Redirect root to Quick Actions for ALL users */}
                <Route
                  path="/"
                  element={<Navigate to="/quick-actions" replace />}
                />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#363636",
                color: "#fff",
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#fff",
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// 404 Page
const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Go Home
        </a>
      </div>
    </div>
  );
};

export default App;
