import { db } from "@/utils/firebaseAdmin";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    if (req.method === "POST") {
        await db.collection("users").doc(req.body.id as string).delete();
        return res.status(200).json({ message: "User dihapus" });
    }

  return res.status(405).end();

}