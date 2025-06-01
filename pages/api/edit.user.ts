import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/utils/firebaseAdmin";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { id, username, password } = req.body;

    if (!username) return res.status(400).json({ message: "Username wajib diisi" });

    const updateData: any = { username };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    try {
      const userRef = db.collection("users").doc(id as string);
      await userRef.update(updateData);
      return res.status(200).json({ message: "User diperbarui" });
    } catch (error) {
      return res.status(500).json({ message: "Gagal memperbarui user" });
    }
  }

  return res.status(405).end(); // Method Not Allowed
}