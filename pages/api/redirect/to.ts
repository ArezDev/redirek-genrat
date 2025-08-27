//import { db } from '@/utils/firebaseAdmin';
import { NextApiRequest, NextApiResponse } from "next";
import dayjs from "dayjs";
import axios from "axios";
import db from "@/utils/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const nowJS = new Date();
  //Update
  const shifted = dayjs(nowJS).subtract(5, "hour"); // Geser -5 jam
  const createdDate = shifted.format("YYYY-MM-DD");
  const createdHour = shifted.format("HH:00");
  const createdWeek = shifted.startOf("week").format("YYYY-MM-DD");
  const startOfDay = shifted.startOf("day").add(5, "hour").toDate();
  const endOfDay = dayjs(startOfDay)
    .add(1, "day")
    .subtract(1, "millisecond")
    .toDate();
  // end update

  let whatsCountry = "";
  let whatIsp = "";
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket.remoteAddress ||
    "";
  const userAgent = req.headers["user-agent"] || "Unknown";
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    );
  //block bot trafik
  const blockedIsps = ["Facebook", "Google", "Meta", "Googlebot"];
  const getCountry = async () => {
    try {
      const result = await axios.get(`https://ipwhois.pro/${ip}`, {
        params: {
          key: process.env.NEXT_PUBLIC_IPWHOIS_KEY,
        },
      });
      if (result && result.data) {
        whatsCountry = result.data.country_code;
        whatIsp = result.data?.connection?.isp || "";
      }
      return whatsCountry || "XX";
    } catch (error) {
      return whatsCountry || "XX";
    }
  };

  await getCountry();
  for (const blocked of blockedIsps) {
    if (whatIsp.includes(blocked)) {
      return res.status(403).json({ error: `Access denied!` });
    }
  }

  const sub = Array.isArray(req.query.sub)
    ? req.query.sub[0]
    : req.query.sub ?? "unknown";
  const network = Array.isArray(req.query.network)
    ? req.query.network[0]
    : req.query.network ?? "unknown";
  const userId = sub;

  if (!req.query.sub || !req.query.network) {
    res.status(400).json({ error: "Missing sub or network." });
  }

  const networkId = network.includes("IMO")
    ? "IMONETIZEIT"
    : network.includes("LP")
    ? "TORAZZO"
    : network.includes("TF")
    ? "LOSPOLLOS"
    : network;

  // check if user exists
  const [rows] = await db.execute(
    "SELECT id FROM users WHERE username = ? LIMIT 1",
    [sub]
  );

  if (!Array.isArray(rows) || rows.length === 0) {
    return res
      .status(404)
      .json({ error: `User ${sub} not found. Click is invalid.` });
  }

  const sourceType = userAgent.includes("Instagram")
    ? "instagram"
    : userAgent.includes("[FBAN")
    ? "facebook"
    : userAgent.includes("[FB_IAB")
    ? "facebook"
    : userAgent.includes("/FBIOS")
    ? "facebook"
    : userAgent.includes(";FBAV")
    ? "facebook"
    : userAgent.includes(";FBDV")
    ? "facebook"
    : userAgent.includes("Chrome")
    ? "chrome"
    : userAgent.includes("Safari")
    ? "safari"
    : "default";

  const gadget = isMobile ? "WAP" : "WEB";
  const rawEncoded = Buffer.from(
    `${sub},${await getCountry()},${ip},${gadget},${networkId}`
  ).toString("base64");
  const encoded = rawEncoded
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  //return res.status(200).json({ dev: true, clickId: encoded });

  try {
    // Kirim ke socket
    await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_URL}/broadcast`, {
      event: "user-klik",
      payload: {
        message: `User: ${sub} connected.`,
        data: { sub, ip, gadget, source: sourceType },
      },
    });

    // Insert click data into MySQL
    const clickPayload = {
      user: sub,
      network: networkId,
      country: whatsCountry,
      source: userAgent,
      gadget: sourceType,
      ip: ip || "",
      created_at: new Date(),
    };

    // Save click to MySQL (clicks table)
    await db.execute(
      `INSERT INTO clicks (user, network, country, source, gadget, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        clickPayload.user,
        clickPayload.network,
        clickPayload.country,
        clickPayload.source,
        clickPayload.gadget,
        clickPayload.ip,
        clickPayload.created_at,
      ]
    );

    // Check if summary for today exists
    const [summaryRows] = (await db.execute(
      "SELECT id, total_click, total_earning FROM user_summary WHERE user = ? AND created_date = ? LIMIT 1",
      [userId, createdDate]
    )) as [
      Array<{ id: number; total_click: number; total_earning: number }>,
      any
    ];

    if (Array.isArray(summaryRows) && summaryRows.length > 0) {
      // If exists, update total_click and created_hour
      const current = summaryRows[0];
      await db.execute(
        `UPDATE user_summary 
       SET total_click = ?, created_at = ?, created_hour = ? 
       WHERE id = ?`,
        [(current.total_click || 0) + 1, nowJS, createdHour, current.id]
      );
    } else {
      // If not exists, calculate today's earning
      const [leadsRows] = await db.execute(
        `SELECT earning FROM leads 
       WHERE userId = ? AND created_at >= ? AND created_at <= ?`,
        [userId, startOfDay, endOfDay]
      );
      let earningToday = 0;
      if (Array.isArray(leadsRows)) {
        for (const row of leadsRows as { earning: number }[]) {
          if (typeof row.earning === "number") {
            earningToday += row.earning;
          }
        }
      }
      await db.execute(
        `INSERT INTO user_summary 
        (user, total_click, total_earning, created_at, created_date, created_hour, created_week) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, 1, earningToday, nowJS, createdDate, createdHour, createdWeek]
      );
    }

    // Save live click to MySQL (live_clicks table)
    await db.execute(
      `INSERT INTO live_clicks (user, network, country, source, gadget, ip, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        clickPayload.network,
        clickPayload.country,
        clickPayload.source,
        clickPayload.gadget,
        clickPayload.ip,
        nowJS,
      ]
    );

    return res.status(200).json({
      clickId: encoded,
      status: "OK",
      message: "Click successfully tracked!",
    });

  } catch (error) {
    console.error("❌ Error handling click:", error);

    return res.status(500).json({
      error: "Server error",
      details: error instanceof Error ? error.message : error,
    });

  }
}
