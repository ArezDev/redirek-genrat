import { db } from '@/utils/firebaseAdmin';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { network } = req.query;

  if (!network || typeof network !== 'string') {
    return res.status(400).json({ error: 'Missing network parameter' });
  }

  try {
    const smartlinks = await db.collection('smartlinks').get();
    let matched: any = null;

    smartlinks.forEach(doc => {
      const docId = doc.id.toUpperCase();
      const netCode = network.toUpperCase();

      if (
        (netCode.includes('IMO') && docId.includes('IMO')) ||
        (netCode.includes('LP') && docId.includes('LP')) ||
        (netCode.includes('TF') && docId.includes('TF'))
      ) {
        matched = doc.data();
      }
    });

    if (!matched) {
      return res.status(404).json({ error: 'No matching smartlink' });
    }

    return res.status(200).json({ smartlink: matched });
  } catch (e) {
    console.error("Error fetching smartlink:", e);
    return res.status(500).json({ error: 'Server error' });
  }
}
