'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    setError("");
      Swal.fire({
        title: "Sedang masuk...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        timerProgressBar: true,
        theme: 'auto',
        timer: 2000,
        didOpen: () => {
          Swal.showLoading();
        },
      });
    try {
    const res = await axios.post("/api/user/login/", { username, password });
        if (res?.data?.success === true) {
          Swal.close(); // Tutup swal loading setelah response
          Swal.fire({
            icon: 'success',
            title: `Welcome ${username} !`,
            text: '',
            showConfirmButton: false,
            timer: 750,
            theme: 'auto',
          }).then(() => {
            router.push("/");
          });
        }
    } catch (err: any) {
        Swal.fire({
          icon: "error",
          title: "Login Gagal",
          text: err.response?.data?.message || "Login gagal",
        }).then(() => {
          setError(err.response?.data?.message || "Login gagal");
        });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Login Member</h2>
        {error && <p className="text-red-600 mb-3">{error}</p>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value.toUpperCase())}
          className="w-full mb-3 p-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 p-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
        >
          Masuk
        </button>
      </div>
    </div>
  );
}
