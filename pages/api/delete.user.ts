//import { db } from "@/utils/firebaseAdmin";
import db from "@/utils/db";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    if (req.method === "POST") {

      //Firebase
      //await db.collection("users").doc(req.body.id as string).delete();

      await db.execute('DELETE FROM users WHERE id = ?', [req.body.id]);

      return res.status(200).json({ message: "User dihapus" });
    }

  return res.status(405).end();

}