// pages/api/users.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getUsersByRole } from "@/utils/firebaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
    try {

      if (req.method === "GET") {
        const role = req.query.role?.toString() || "member";
        const users = await getUsersByRole(role);
        res.status(200).json(users);
      }

    return res.status(405).end();

    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil data users" });
    }

  
}
