"use client";

import React, { useEffect, useState } from "react";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import axios from "axios";
import { EditIcon } from "lucide-react";

const MySwal = withReactContent(Swal);

export default function UserTable() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const paginatedUsers = users.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(users.length / itemsPerPage);


  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/users?role=member");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async () => {
    const { value: formValues } = await MySwal.fire({
      title: "Tambah User",
      html:
        '<input id="swal-username" class="swal2-input" placeholder="Username">' +
        '<input id="swal-password" type="password" class="swal2-input" placeholder="Password">',
      focusConfirm: false,
      showCancelButton: true,
      cancelButtonText: "Batal",
      preConfirm: () => {
        const username = (document.getElementById("swal-username") as HTMLInputElement).value.toUpperCase();
        const password = (document.getElementById("swal-password") as HTMLInputElement).value;
        if (!username || !password) {
          Swal.showValidationMessage("Username dan Password wajib diisi");
          return;
        }
        return { username, password };
      },
    });

    if (formValues) {
      try {
        await axios.post("/api/create.user/", {
          ...formValues
        });
        Swal.fire("Berhasil", "User berhasil ditambahkan", "success");
        fetchUsers();
      } catch (err: any) {
        Swal.fire("Gagal", err.response?.data?.message || "Terjadi kesalahan", "error");
      }
    }
  };

  const handleEdit = async (user: any) => {
    const { value: formValues } = await MySwal.fire({
      title: `Edit ${user.username}`,
      html:
        `<input id="swal-username" class="swal2-input" value="${user.username}" placeholder="Username">` +
        '<input id="swal-password" type="password" class="swal2-input" placeholder="Password (opsional)">',
      focusConfirm: false,
      showCancelButton: true,
      cancelButtonText: "Batal",
      preConfirm: () => {
        const username = (document.getElementById("swal-username") as HTMLInputElement).value;
        const password = (document.getElementById("swal-password") as HTMLInputElement).value;
        if (!username) {
          Swal.showValidationMessage("Username wajib diisi");
          return;
        }
        return { username, password };
      },
    });

    if (formValues) {
      try {
        await axios.post(`/api/edit.user/`, {
          id: user.id,
          ...formValues
        });
        Swal.fire("Berhasil", "User diperbarui", "success");
        fetchUsers();
      } catch (err: any) {
        Swal.fire("Gagal", err.response?.data?.message || "Terjadi kesalahan", "error");
      }
    }
  };

  const handleDelete = async (user: any) => {
    const result = await Swal.fire({
      title: `Hapus ${user.username}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Ya, hapus!",
    });

    if (result.isConfirmed) {
      try {
        await axios.post(`/api/delete.user`, { id: user.id });
        Swal.fire("Dihapus!", "User telah dihapus.", "success");
        fetchUsers();
      } catch (err: any) {
        Swal.fire("Gagal", err.response?.data?.message || "Terjadi kesalahan", "error");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">List Member ({users.length})</h2>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
        >
          <PlusIcon className="w-5 h-5" /> Tambah User
        </button>
      </div>
      <table className="min-w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white uppercase text-sm tracking-wider rounded-t-lg">
            <th className="px-6 py-3 text-left">Username</th>
            <th className="px-6 py-3 text-left">Role</th>
            <th className="px-6 py-3 text-left">Created At</th>
            <th className="px-6 py-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {paginatedUsers.map((u, idx) => (
            <tr
              key={u.id}
              className={`transition-shadow duration-300 hover:shadow-md ${
                idx % 2 === 0 ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-900"
              }`}
            >
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800 dark:text-gray-200">
                {u.username.toUpperCase()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{u.role}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                {u.createdAt?.seconds
                  ? new Date(u.createdAt.seconds * 1000).toLocaleString()
                  : "-"}
              </td>
              <td className="px-6 py-4 text-center space-x-4">
                <button
                  aria-label={`Edit ${u.username}`}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  onClick={() => handleEdit(u)}
                >
                  <EditIcon className="w-6 h-6 inline" />
                </button>
                <button
                  aria-label={`Delete ${u.username}`}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  onClick={() => handleDelete(u)}
                >
                  <TrashIcon className="w-6 h-6 inline" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-gray-700 dark:text-gray-300">
          Halaman {currentPage} dari {totalPages}
        </div>
        <div className="inline-flex shadow-sm rounded-md overflow-hidden border border-gray-300 dark:border-gray-600">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 text-sm font-medium ${
              currentPage === 1
                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white"
            }`}
          >
            ← Sebelumnya
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-600 ${
              currentPage === totalPages
                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white"
            }`}
          >
            Berikutnya →
          </button>
        </div>
      </div>
    </div>
  );
}
