'use client';

import React, { useState, useEffect } from "react";
import { LogOut, Sun, Moon, UserCircle } from "lucide-react";
import { bin2uuid } from "@/utils/bin2hex";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";

type DecodedToken = {
  username: string;
  role: string;
  exp: number;
};

export default function Dashboard() {
  const [network, setNetwork] = useState("IMO");
  const [debug, setDebug] = useState("");
  const [modeLink, setModeLink] = useState("hex");
  const [shortURL, setShortURL] = useState("0");
  const [result, setResult] = useState("");
  const [resultShort, setResultShort] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingShort, setIsLoadingShort] = useState(false);

  // Login states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
  async function checkAuth() {
    setIsLoading(true);
    try {
      const res = await axios.get("/api/user/auth");
      if (res.status === 200) {
      const data = res.data;
      if (data.user.role === "member") {
        setUser(data.user);
      } else {
        // Swal for non-member
        if (typeof window !== "undefined") {
        Swal.fire({
          icon: "error",
          title: "Akses Ditolak",
          text: "Hanya member yang bisa mengakses.",
        }).then(() => {
          router.push("/login/user");
        });
        } else {
        router.push("/login/user");
        }
      }
      } else {
      // Swal for failed auth
      if (typeof window !== "undefined") {
        const Swal = (await import("sweetalert2")).default;
        Swal.fire({
        icon: "error",
        title: "Autentikasi Gagal",
        text: "Silakan login ulang.",
        }).then(() => {
        router.push("/login/user");
        });
      } else {
        router.push("/login/user");
      }
      }
    } catch (err: any) {
      // Swal for error
      if (typeof window !== "undefined") {
      const Swal = (await import("sweetalert2")).default;
      Swal.fire({
        icon: "error",
        title: "Terjadi Kesalahan",
        text: "Anda belum login.",
      }).then(() => {
        router.push("/login/user");
      });
      } else {
      router.push("/login/user");
      }
    } finally {
      setIsLoading(false);
    }
  }

  checkAuth();
}, [router]);

  // Handle login
  const handleLogin = async () => {
    setError("");
    try {
      const res = await axios.post("/api/login.user", { username, password });
      // Jika sukses, cookie token sudah otomatis diset server,
      // cukup redirect ke user
      if (res.status === 200) {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Login gagal");
    }
  };
  
  // Handle logout
  const logout = async () => {
    await axios.post("/api/user/logout");
    router.push("/login/user");
  };

  const s = (length: number) => {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    return Array.from({ length }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");
  };

  const base64UrlEncode = (str: string): string => {
    const rawEncoded = Buffer.from(str).toString('base64');
    const encoded = rawEncoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return encoded.replace(/=/g, '')  // hilangkan padding '='
      .replace(/\+/g, '-') // '+' jadi '-'
      .replace(/\//g, '_'); // '/' jadi '_'
  }

  const strToHex = (str: string) => {
    return [...str]
      .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
  }

  const createLink = async () => {
    //return `${s(3)}|${network}|${user?.username}|${s(3)}`;
    return `${user?.username}|${network}|${s(7)}`;
  };

  const generateLink = async () => {
    setIsLoading(true);
    setResultShort(""); // clear short result

    Swal.fire({
      icon: "info",
      title: "Generating Links",
      text: "Please wait while we generate 1000 links...",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    const links: string[] = [];
    const domainList = [
      "facebooke.cam",
      "friendsfb.pro",
      "fwbstars.com",
      "nkmteam.com",
      "setboy.live",
      "smartvids.live",
    ];

    for (let i = 0; i < 1000; i++) {
      let link = "";
      let selectedDomain = shortURL === "0"
      ? domainList[Math.floor(Math.random() * domainList.length)]
      : shortURL;
      if (modeLink === "hex") {
        const linkStr = await createLink();
        link = `${debug}https://${selectedDomain}/${strToHex(linkStr)}`;
      } else if (modeLink === "binary") {
        const linkStr = await createLink();
        link = `${debug}https://${selectedDomain}/${bin2uuid(linkStr)}`;
      } else if (modeLink === "base64") {
        const linkStr = await createLink();
        const linkBytes = new TextEncoder().encode(linkStr);
        link = `${debug}https://${selectedDomain}/${base64UrlEncode(String.fromCharCode(...linkBytes))}`;
      }
      links.push(link);
    }

    setResult(links.join("\n")); // gabungkan semua link dengan newline
    setIsLoading(false);

    Swal.fire({
      icon: "success",
      title: "Links Generated",
      text: "Successfully generated 1000 links.",
    });
  };

  const shortLink = async () => {
    setIsLoadingShort(true);

    try {
      const { data } = await axios.post("/api/short", {
        url: `${encodeURIComponent(`${debug}https://localhost:3000/${bin2uuid(await createLink())}`)}`,
        opt: "0", // atau sesuai kebutuhan
      });

      Swal.fire({
        icon: "success",
        title: "Shortlink Created",
        text: data.shorturl || "Berhasil",
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Shortlink Failed",
        text: err.response?.data?.message || "Unknown error",
      });
    } finally {
      setIsLoadingShort(false);
    }
  };

  // LOGIN FORM
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 dark:bg-gray-900 p-6">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
            Login Member
          </h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full mb-4 p-3 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-4 p-3 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          {error && (
            <p className="text-red-600 mb-4 text-sm">{error}</p>
          )}
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded transition"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  // DASHBOARD
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center p-6">
      {/* Topbar */}
      <div className="w-full max-w-xl flex justify-between items-center bg-white dark:bg-gray-800 shadow-md p-4 rounded-xl mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <UserCircle className="w-5 h-5 text-blue-500" />
          <span className="font-serif truncate max-w-[150px]">{user.username}</span>
        </div>
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle Dark Mode"
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {darkMode ? <Sun className="text-yellow-400" /> : <Moon className="text-gray-600" />}
          </button>
          <button
            onClick={logout}
            className="flex items-center text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600"
          >
            <LogOut className="w-5 h-5 mr-1" />
            
          </button>
        </div>
      </div>

      {/* Option Links */}
      <div className="w-full max-w-xl bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 flex flex-wrap md:flex-nowrap items-center gap-4">
        <div className="flex flex-col min-w-[150px]">
          <label className="mb-1 text-gray-700 dark:text-gray-300 font-medium">
            Network
          </label>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="IMO">iMonetizeIt</option>
            <option value="TF">Trafee</option>
            <option value="LP">Lospollos</option>
          </select>
        </div>

        {/* Debug Option */}
        <div className="flex flex-col min-w-[150px]">
          <label className="mb-1 text-gray-700 dark:text-gray-300 font-medium">
            Debugger
          </label>
          <select
            value={debug}
            onChange={(e) => setDebug(e.target.value)}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">---</option>
            <option value="https://l.wl.co/l?u=">l.wl.co</option>
          </select>
        </div>

        {/* Button short! */}
        <div className="flex flex-col justify-end min-w-[150px]">
          <label className="invisible mb-1">Action</label>
          <button
            onClick={generateLink}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition-colors whitespace-nowrap w-full"
          >
            {isLoading ? "Getting Link..." : "Get Link"}
          </button>
        </div>
      </div>

      {/* Option Link */}
      <div className="w-full max-w-xl bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 flex flex-wrap md:flex-nowrap items-center gap-4 mt-4">
        {/* Domain */}
        <div className="flex flex-col min-w-[160px]">
          <label className="mb-1 text-gray-700 dark:text-gray-300 font-medium">
            Domain
          </label>
            <select
            value={shortURL}
            onChange={(e) => setShortURL(e.target.value)}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
            <option value="0">{'{RANDOM GLOBAL DOMAIN}'}</option>
            <option value="facebooke.cam">facebooke.cam</option>
            <option value="friendsfb.pro">friendsfb.pro</option>
            <option value="fwbstars.com">fwbstars.com</option>
            <option value="nkmteam.com">nkmteam.com</option>
            <option value="setboy.live">setboy.live</option>
            <option value="smartvids.live">smartvids.live</option>
            </select>
        </div>

        {/* Mode Link */}
        <div className="flex flex-col min-w-[200px]">
          <label className="mb-1 text-gray-700 dark:text-gray-300 font-medium">
            Mode Link
          </label>
          <select
            value={modeLink}
            onChange={(e) => setModeLink(e.target.value)}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="hex">hex</option>
            <option value="binary">binary</option>
            <option value="base64">base64</option>
          </select>
        </div>

      </div>

      {/* Short URL */}
      <div hidden className="w-full max-w-xl bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 flex flex-wrap md:flex-nowrap items-center gap-4 mt-4">
        {/* Opsi Shortener */}
        <div className="flex flex-col min-w-[160px]">
          <label className="mb-1 text-gray-700 dark:text-gray-300 font-medium">
            Shortener
          </label>
            <select
            value={shortURL}
            onChange={(e) => setShortURL(e.target.value)}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
            <option value="0">is.gd</option>
            <option value="1">u.to</option>
            </select>
        </div>

        {/* Opsi Debugger */}
        <div className="flex flex-col min-w-[160px]">
          <label className="mb-1 text-gray-700 dark:text-gray-300 font-medium">
            Debugger
          </label>
          <select
            value={debug}
            onChange={(e) => setDebug(e.target.value)}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="https://l.wl.co/l?u=">l.wl.co</option>
            <option value="">---</option>
          </select>
        </div>

        {/* Tombol Short */}
        <div className="flex flex-col justify-end min-w-[120px]">
          <label className="invisible mb-1">Action</label>
          <button
            onClick={shortLink}
            disabled={isLoadingShort}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition-colors whitespace-nowrap w-full"
          >
            {isLoadingShort ? "Shortening..." : "Short"}
          </button>
        </div>
      </div>

      {/* Result - Show whichever is latest */}
      <div className="w-full max-w-xl bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 mt-4">
        <label className="block mb-2 text-gray-700 dark:text-gray-300 font-medium">
          Generated Link
        </label>
        <textarea
          wrap="off"
          value={result || resultShort || ""}
          readOnly
          rows={4}
          onClick={() => {
            navigator.clipboard.writeText(result || resultShort || "");
            Swal.fire({
              icon: "success",
              title: "Copied to Clipboard",
              text: "Link has been copied to clipboard.",
            });
          }}
          className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none border-0"
          placeholder="Hasil link akan muncul di sini..."
        />
      </div>

      {/* Footer */}
      <footer className="mt-6 text-gray-500 dark:text-gray-400">
        <p>Powered by ZDEV &copy; 2025 All rights reserved.</p>
      </footer>
    </div>
  );

}
