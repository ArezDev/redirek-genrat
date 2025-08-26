import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/utils/db';
import { redirect } from 'next/navigation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  
  const { shortcode } = req.body;
  
  if (!shortcode) return res.status(400).json({ message: 'Invalid payload' });

  try {
    //get data dari Server
    const [result]: any = await db.execute('SELECT url, img FROM postplay_redirect WHERE shortcode = ?', [shortcode]);

    if (result[0].url) {
        res.status(200).json({ status: 'ok', url: result[0].url, img: result[0].img, ua: req.headers['user-agent'] });
        // if (req.headers['user-agent']?.includes('Chrome')) {
        //     redirect(result[0].img);
        // }
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