// components/AdminNavbar.tsx
"use client";
import { LogOut, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function AdminNavbar() {
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const logout = async () => {
    await axios.post("/api/logout.admin");
    router.push("/login/admin");
  };


  return (
    <div className="max-w-4xl mx-auto flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-md rounded-xl mb-4">
      <div className="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-7 h-7 text-gray-800 dark:text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <circle cx="12" cy="8" r="4" strokeWidth="2" />
          <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 20c0-2.5 3.5-4 8-4s8 1.5 8 4"
          />
        </svg>
        <span className="text-xl font-bold text-gray-800 dark:text-white">Admin</span>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? <Sun className="text-yellow-400" /> : <Moon className="text-gray-600" />}
        </button>
        <button
          onClick={logout}
          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
        >
          <LogOut />
        </button>
      </div>
    </div>
  );
}
