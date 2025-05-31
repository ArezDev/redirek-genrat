//HALAMAN REDIREK LINK
'use client';

import { uuid2bin } from '@/utils/bin2hex';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getDocs, query, collection } from 'firebase/firestore';
import { db } from '@/utils/firebase';
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
          return;
        }

        const [sub, networkCode] = parts;

        // 🔍 Fetch smartlink data
        const get_smartlink = await getDocs(query(collection(db, 'smartlinks')));
        let matchedNetwork: any = null;

        get_smartlink.forEach(doc => {
          const docId = doc.id.toUpperCase();
          const netCode = networkCode.toUpperCase();

          if (
            (netCode.includes('IMO') && docId.includes('IMO')) ||
            (netCode.includes('LP') && docId.includes('LP')) ||
            (netCode.includes('TF') && docId.includes('TF'))
          ) {
            matchedNetwork = doc.data();
          }
        });

        if (!matchedNetwork) {
          setStatusText('Network not found in smartlinks.');
          return;
        }

        console.log(matchedNetwork)

        setNetworkData(JSON.stringify(matchedNetwork));
        setStatusText('Creating click record...');

        const create_clicks = await axios.get(`/api/click?sub=${sub}&network=${networkCode}`);
        if (create_clicks.status !== 200) {
          setStatusText('Failed to create click record.');
          return;
        }

        const leadsId = create_clicks?.data?.clickId;

        // Replace placeholders
        const finalUrl = matchedNetwork.url
          .replaceAll('{user}', sub)
          .replaceAll('{leads}', leadsId);
          console.log(finalUrl)

        // Redirect
        setStatusText('Redirecting to destination...');
        //setTimeout(() => router.push(finalUrl), 1000);

      } catch (err) {
        console.error(err);
        setStatusText('Error during processing.');
      }
    };

    const timeout = setTimeout(processRedirect, 1000);

    return () => clearTimeout(timeout);
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
        {networkData && (
          <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">
            Network: <code>{networkData}</code>
          </p>
        )}
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Redirecting to destination shortly...
        </p>
      </div>
    </div>
  );
}