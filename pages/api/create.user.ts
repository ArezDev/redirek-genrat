import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/utils/firebaseAdmin";
import bcrypt from "bcryptjs";
import { FieldValue } from "firebase-admin/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi" });
  }

  try {
    const snapshot = await db.collection("users").where("username", "==", username).get();
    if (!snapshot.empty) {
      return res.status(400).json({ message: "Username sudah digunakan" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.collection("users").add({
      username,
      password: hashed,
      role: "member",
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(201).json({ message: "User berhasil dibuat" });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: "Terjadi kesalahan saat membuat user" });
  }
}
