'use client';

import { uuid2bin } from '@/utils/bin2hex';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Link() {
  const router = useRouter();
  const pathname = usePathname();
  const [statusText, setStatusText] = useState('Loading...');
  const [networkData, setNetworkData] = useState<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    const segment = pathname.split('/')[1];
    if (!segment) {
      setStatusText('Invalid link format.');
      return;
    }

    const isBase64 = /^[A-Za-z0-9+/=]+={0,2}$/.test(segment);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(segment);
    const isHex = /^[0-9a-fA-F]+$/.test(segment) && segment.length % 2 === 0;

    const hexToAscii = (hex: string) => {
      let str = '';
      for (let i = 0; i < hex.length; i += 2) {
        const code = parseInt(hex.substr(i, 2), 16);
        if (isNaN(code)) return null;
        str += String.fromCharCode(code);
      }
      return str;
    };

    let targetId = '';

    const processRedirect = async () => {
      try {
        if (isUUID) {
          targetId = uuid2bin(segment);
        } else if (isHex) {
          const ascii = hexToAscii(segment);
          if (!ascii || !ascii.includes('|')) {
            setStatusText('Hex format not recognized or invalid.');
            return;
          }
          targetId = ascii;
        } else if (isBase64) {
          const decoded = atob(segment);
          targetId = new TextDecoder().decode(Uint8Array.from(decoded, c => c.charCodeAt(0)));
        } else {
          setStatusText('Unknown link format.');
          return;
        }

        setStatusText('Processing link...');

        const parts = targetId.split('|');
        if (parts.length < 3) {
          setStatusText('Invalid target data structure.');
          console.log('pakai shortcode');
          const ok = await axios.post('/api/postplay/check', { shortcode: segment });
          const finalUrl = ok.data.url;
          if (!finalUrl) {
              setStatusText('No URL found for this link.');
              return;
          }
          const ua = ok.data.ua || '';
          console.log(ua);
          if(ua.includes('facebookexternalhit') || ua.includes('Facebot')) {
            router.push(ok.data.img);
            return;
          }
          setStatusText('Redirecting...');
          setNetworkData(finalUrl);
          router.push(finalUrl);
          return;
        }

        // 🔍 Fetch smartlink data
        const [sub, networkCode] = parts;
        const get_smartlink = await axios.get('/api/get/smartlink', {
          params: { network: networkCode }
        });

        const matchedNetwork = get_smartlink.data.smartlink;
        if (!matchedNetwork) {
          setStatusText('Network not found in smartlinks.');
          return;
        }

        //setNetworkData(JSON.stringify(matchedNetwork));
        //setStatusText('Creating click record...');
        setStatusText('Please wait...');

        const create_clicks = await axios.get(`/api/redirect/to`,{
          params:{
            sub: sub,
            network: networkCode
          }
        });
        if (create_clicks.status !== 200) {
          setStatusText('Failed to create click record.');
          return;
        }

        // Replace placeholders
        const leadsId = create_clicks?.data?.clickId;
        const finalUrl = matchedNetwork.url
          .replaceAll('{user}', sub)
          .replaceAll('{leads}', leadsId);

        // Redirect
        setStatusText('Loading please wait...');
        setNetworkData(finalUrl);
        router.push(finalUrl);
      } catch (err) {
        console.error('[CLICK API ERROR]', err);
        setStatusText('Error during processing.');
      }
    };
    processRedirect();
  }, [pathname, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="text-center p-6 bg-white dark:bg-gray-800 shadow-lg rounded-xl">
        <div className="mb-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin mx-auto"></div>
        </div>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {statusText}
        </h1>
        {/* {networkData && (
          <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">
            Network: <code>{networkData}</code>
          </p>
        )} */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Redirecting to destination shortly...
        </p>
      </div>
    </div>
  );
}