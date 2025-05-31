import axios from 'axios';
import { NextApiResponse, NextApiRequest } from 'next';

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  const { sub, network } = req.query;

  if (!sub || !network) {
    res.status(401).json({ error: "Missing variable.." });
  }

  try {

    const getClick = await axios.get('https://realtime.balanesohib.eu.org/api/c', {
        params:{ sub: sub, network: network }
    });

    if(getClick.status === 200) {
        return res.status(200).json({ clickId: getClick?.data?.data });
    }

  } catch (error: any) {
    return new Response(
      JSON.stringify({
        message: 'Proxy error',
        detail: error.response?.data || error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}