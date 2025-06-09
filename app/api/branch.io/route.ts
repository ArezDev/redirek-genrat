import { NextRequest } from 'next/server';
import axios from 'axios';
import qs from 'querystring';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { url, shorturl, opt } = body;

  if (!url) {
    return new Response(JSON.stringify({ message: 'Missing url' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = qs.stringify({
      url,
      shorturl: shorturl || '',
      opt: opt || '0',
      format: 'json',
    });

    const isgdResponse = await axios.post('https://is.gd/create.php', payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return new Response(JSON.stringify(isgdResponse.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
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