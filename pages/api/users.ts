// pages/api/users.ts
import db from "@/utils/db";
import type { NextApiRequest, NextApiResponse } from "next";
//import { getUsersByRole } from "@/utils/firebaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
    try {

      if (req.method === "GET") {
        const role = req.query.role?.toString() || "member";
        //Firebase
        //const users = await getUsersByRole(role);

        // Assuming you have a MySQL connection instance named `mysql`
        const [rows] = await db.execute(
          "SELECT id, username, role, createdAt FROM users WHERE role = ?",
          [role]
        );

        const users = (rows as any[]).map((row: any) => ({
          id: row.id,
          username: row.username,
          role: row.role,
          createdAt: row.createdAt ?? null,
        }));

        res.status(200).json(users);
      }

    return res.status(405).end();

    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil data users" });
    }

  
}
