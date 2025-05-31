import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sub = searchParams.get('sub');
  const network = searchParams.get('network');

  if (!sub || !network) {
    return NextResponse.json({ error: "Missing variable.." }, { status: 400 });
  }

  try {
    const getClick = await axios.get('https://realtime.balanesohib.eu.org/api/c', {
      params: { sub, network }
    });

    if (getClick.status === 200) {
      return NextResponse.json({ clickId: getClick.data?.data }, { status: 200 });
    } else {
      return NextResponse.json({ error: "Failed to fetch click data" }, { status: getClick.status });
    }
  } catch (error: any) {
    console.error("Click fetch failed:", error);
    return NextResponse.json({ error: 'Server error!' }, { status: 500 });
  }
}