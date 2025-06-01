// pages/api/login.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getUserByUsername } from "@/utils/firebaseAdmin"; // asumsi ada fungsi ambil user
import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { username, password } = req.body;
  const user = await getUserByUsername(username);

  if (!user || !(await compare(password, user.password))) {
    return res.status(401).json({ message: "Username atau password salah" });
  }

  const token = jwt.sign(
    { username: user.username, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "2h" }
  );

  // Set HTTP-only cookie
  res.setHeader("Set-Cookie", `session_member=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax; Secure`);

  return res.status(200).json({ token });
}