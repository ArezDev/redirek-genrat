import { db } from '@/utils/firebaseAdmin';
import { NextApiRequest, NextApiResponse } from 'next';
import dayjs from 'dayjs';
import axios from 'axios';
import { Timestamp } from 'firebase-admin/firestore';

interface ClickData {
  user: string;
  network: string;
  country: string;
  source: string;
  gadget: string;
  ip: string;
  created_at: Timestamp;
}

interface SummaryData {
  user: string;
  total_click: number;
  total_earning: number;
  created_at: Timestamp;
  created_date: string;
  created_hour: string;
  created_week: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const now = Timestamp.now();
  const nowJS = new Date();
  const createdDate = dayjs(nowJS).format('YYYY-MM-DD');
  const createdHour = dayjs(nowJS).format('HH:00');
  const createdWeek = dayjs(nowJS).startOf('week').format('YYYY-MM-DD');
  const startOfDay = dayjs(nowJS).startOf('day').toDate();
  const endOfDay = dayjs(nowJS).endOf('day').toDate();
  let whatsCountry = '';
  let whatIsp = '';
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '';
  const userAgent = req.headers["user-agent"] || "Unknown";
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  //block bot trafik
  const blockedIsps = ['Facebook', 'Google', 'Meta', 'Googlebot'];
  const getCountry = async ()  => {
    try {
      const result = await axios.get(`https://ipwhois.pro/${ip}`, {
        params: {
          key: '4OehYgGBlw8CpI5x'
        }
      });
      if (result && result.data) {
        whatsCountry = result.data.country_code;
        whatIsp = result.data?.connection?.isp || '';
      }
      return whatsCountry  || 'XX';
    } catch (error) {
      return whatsCountry  || 'XX';
    }
  };

  await getCountry();
  for (const blocked of blockedIsps) {
    if (whatIsp.includes(blocked)) {
      return res.status(403).json({ error: `Access denied!` });
    }
  }

  const sub = Array.isArray(req.query.sub) ? req.query.sub[0] : (req.query.sub ?? 'unknown');
  const network = Array.isArray(req.query.network) ? req.query.network[0] : (req.query.network ?? 'unknown');
  const userId = sub;

  if (!req.query.sub || !req.query.network) {
    res.status(400).json({error: 'Missing sub or network.'});
  }

  const networkId = 
        network.includes('IMO') ? 'IMONETIZEIT' :  
        network.includes('LP') ? 'TORAZZO' :
        network.includes('TF') ? 'LOSPOLLOS' : 
        network;
        
  const cekUser = await db
    .collection('users')
    .where('username', '==', sub)
    .limit(1)
    .get();

  if (cekUser.empty) {
    return res.status(404).json({ error: `User ${sub} not found. Click is invalid.` });
  }

  const sourceType =
    userAgent.includes("Instagram") ? "instagram"
    : userAgent.includes("[FBAN") ? "facebook"
    : userAgent.includes("[FB_IAB") ? "facebook"
    : userAgent.includes("/FBIOS") ? "facebook"
    : userAgent.includes(";FBAV") ? "facebook"
    : userAgent.includes(";FBDV") ? "facebook"
    : userAgent.includes("Chrome") ? "chrome"
    : userAgent.includes("Safari") ? "safari"
    : "default";

  const gadget = isMobile ? 'WAP' : 'WEB';
  //const encoded = Buffer.from(`${sub}|${await getCountry()}|${ip}|${gadget}|${networkId}`).toString('base64');
  const rawEncoded = Buffer.from(`${sub},${await getCountry()},${ip},${gadget},${networkId}`).toString('base64');
  const encoded = rawEncoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  try {
    // Kirim ke socket
    await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_URL}/broadcast`, {
      event: "user-klik",
      payload: {
        message: `User: ${sub} connected.`,
        data: { sub, ip, gadget, source: sourceType },
      }
    });

    const clickPayload: ClickData = {
      user: sub,
      network: networkId,
      country: await getCountry(),
      source: userAgent,
      gadget: sourceType,
      ip: ip || '',
      created_at: now,
    };

    await db.collection('clicks').add(clickPayload);

    // Cek apakah summary hari ini untuk user sudah ada
    const summaryDocId = `${userId}_${createdDate}`;
    const summaryRef = db.collection('user_summary').doc(summaryDocId);
    const summarySnap = await summaryRef.get();

    if (summarySnap.exists) {
      // Kalau sudah ada, cukup update total_click dan created_hour
      const current = summarySnap.data() as SummaryData;

      await summaryRef.set({
        total_click: (current.total_click || 0) + 1,
        created_at: now,
        created_hour: createdHour, // tetap simpan jam klik terakhir
      }, { merge: true });

    } else {
      // Kalau belum ada, hitung earning hari ini
      const leadsSnap = await db.collection("leads")
        .where("userId", "==", userId)
        .where("created_at", ">=", Timestamp.fromDate(startOfDay))
        .where("created_at", "<=", Timestamp.fromDate(endOfDay))
        .get();

      let earningToday = 0;
      leadsSnap.forEach(doc => {
        const data = doc.data();
        if (data.created_at && typeof data.earning === 'number') {
          earningToday += data.earning;
        }
      });

      const newSummary: SummaryData = {
        user: userId,
        total_click: 1,
        total_earning: earningToday,
        created_at: now,
        created_date: createdDate,
        created_hour: createdHour,
        created_week: createdWeek,
      };

      await summaryRef.set(newSummary);
    }

    // Save live click
    await db.collection('live_clicks').doc(`LiveClick_${userId}_${dayjs(nowJS).format('HHmmss')}`).set({
      ...clickPayload,
      user: userId,
    });

    return res.status(200).json({
      clickId: encoded,
      status: 'OK',
      message: 'Click successfully tracked!',
    });

  } catch (error) {
    console.error("❌ Error handling click:", error);
    return res.status(500).json({ error: 'Server error', details: error instanceof Error ? error.message : error });
  }
}