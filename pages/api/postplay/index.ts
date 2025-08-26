import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  
  const { url, img, userId } = req.body;
  
  if (!url || !img || !userId) return res.status(400).json({ message: 'Invalid payload' });

  try {
    //make shortcode
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let shortcode = '';
    for (let i = 0; i < 10; i++) {
      shortcode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    //kirim data ke Server
    const [result]: any = await db.execute(`INSERT INTO 
        postplay_redirect (url, img, user_id, shortcode)
        VALUES (?, ?, ?, ?)
        `, [url, img, userId, shortcode]);

    if (result.affectedRows === 1) {
        return res.status(200).json({ status: 'ok', data: shortcode });
    }

  } catch (error: any) {
    console.error('Database error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      message: 'Shortening failed',
      error: errorMessage,
    });
  }

}