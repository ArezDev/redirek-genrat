// pages/R/[slug].tsx
import axios from "axios";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { useEffect, useState } from 'react';

interface RedirectPageProps {
  slug: string;
  targetId: string;
  imageUrl: string;
  title: string;
  desc: string;
  testDecode?: string;
}

function base64UrlDecode(str: string) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "="; // padding
  return decodeURIComponent(
    escape(Buffer.from(str, "base64").toString("binary"))
  );
}

export async function getServerSideProps(context: { params: { slug: string } }) {
  const { slug } = context.params;

  let targetId = "";
  let imageUrl = "";
  let title = "";
  let desc = "";
  let testDecode = "";

  // cek format slug
  //const isBase64 = /^[A-Za-z0-9+/=]+$/.test(slug);
  const isBase64 = /^[A-Za-z0-9+/=]+={0,2}$/.test(slug);

  // decode slug
  try {
    if (isBase64) {
      const decoded = Buffer.from(slug, "base64").toString("utf8");
      testDecode = decoded;

      //const decoded = base64UrlDecode(slug);
      
      const parts = decoded.split("^");
      targetId = parts[0] || "";
      title = parts[1] || "";
      desc = parts[2] || "";
      imageUrl = parts[3] || "";
    } else {
      const decodeUrl = await axios.post(`${process.env.NEXT_PUBLIC_DOMAIN}/api/postplay/check`, { shortcode: slug });
      //const decodeUrl = await axios.post(`http://localhost:3000/api/postplay/check`, { shortcode: slug });
      if (!decodeUrl.status || decodeUrl.status !== 200) {
        return { notFound: true };
      }
      if (decodeUrl.status === 200) {
        targetId = decodeUrl.data.data.url || "";
        title = decodeUrl.data.data.title || "";
        imageUrl = decodeUrl.data.data.img || null; // pastikan bukan undefined
        desc = decodeUrl.data.data.descr || "";
      }
    }
    
  } catch (e) {
    console.error("Decode error:", e);
    return { notFound: true };
  }
  return {
    props: {
      slug,
      targetId: targetId || "",
      imageUrl: imageUrl ?? null,
      title: title || "",
      desc: desc || "",
    },
  };
}

export default function RedirectPage({ slug, targetId, imageUrl, title, desc, testDecode }: RedirectPageProps) {
  //console.log("Slug:", slug);
  //console.log("Target:", targetId);
  //const router = useRouter();
  // redirect to targetId
  // useEffect(() => {
  //   if (targetId) {
  //     router.replace(targetId);
  //   }
  // }, [targetId, router]);
  
  // if (targetId) {
  //   router.push(targetId);
  // }

  console.log(testDecode);

  return (
    <>
      <Head>
        <title>{title}</title>
        {/* <meta http-equiv="refresh" content={`0;URL=${targetId}`} /> */}
        <meta httpEquiv="refresh" content={`0;URL=${targetId}`} />
        <meta name="description" content={`${desc}`} />
        <meta property="og:title" content={`${title}`} />
        <meta property="og:description" content={`${desc}`} />
        <meta property="og:image" content={`${imageUrl}`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${targetId}`} />
        <meta property="fb:app_id" content="274266067164" />
      </Head>
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="text-center p-6 bg-white dark:bg-gray-800 shadow-lg rounded-xl">
        <div className="mb-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin mx-auto"></div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Redirecting to destination shortly... 
        </p>
      </div>
    </div>
    </>
  );
}