import type { NextApiRequest, NextApiResponse } from "next";
//import { db } from "@/utils/firebaseAdmin";
import bcrypt from "bcryptjs";
import { FieldValue } from "firebase-admin/firestore";
import db from "@/utils/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi" });
  }

  try {

    //Firebase
    // const snapshot = await db.collection("users").where("username", "==", username).get();
    // if (!snapshot.empty) {
    //   return res.status(400).json({ message: "Username sudah digunakan" });
    // }

    // MySQL2: Check if username already exists
    const [rows] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
    if ((rows as any[]).length > 0) {
      return res.status(400).json({ message: "Username sudah digunakan" });
    }

    const hashed = await bcrypt.hash(password, 10);

    //Firebase
    // await db.collection("users").add({
    //   username,
    //   password: hashed,
    //   role: "member",
    //   createdAt: FieldValue.serverTimestamp(),
    // });

    const [result] = await db.execute(
      'INSERT INTO users (username, password, role, createdAt) VALUES (?, ?, ?, NOW())',
      [username, hashed, 'member']
    );

    if ((result as any).affectedRows === 1) {
      return res.status(201).json({ success: true, message: "User berhasil dibuat" });
    } else {
      return res.status(500).json({ success: false, message: "Gagal membuat user" });
    }

    //return res.status(201).json({ message: "User berhasil dibuat" });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: "Terjadi kesalahan saat membuat user" });
  }
}
