// File: supabase/functions/convert-pdf-to-png/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { getDocument } from "https://cdn.skypack.dev/pdfjs-dist@3.4.120/build/pdf.mjs";
import { corsHeaders } from "../_shared/cors.ts";
// File: supabase/functions/_shared/cors.ts

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET, PUT, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, X-Client-Info, X-Supabase-Client, X-Supabase-Auth-Token, x-client-info, x-supabase-client, x-supabase-auth-token",
};

const DEBUG = true;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const payload = await req.json();
    if (!payload.pdfUrl || !payload.userId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (DEBUG) {
      console.log(`Converting PDF to PNG for user ${payload.userId}`);
      console.log(`PDF URL: ${payload.pdfUrl}`);
    }

    const urlParts = payload.pdfUrl.split('/');
    const pdfFilename = urlParts[urlParts.length - 1];
    const baseFilename = pdfFilename.replace(/\.pdf$/i, '');
    const pngFilename = `${baseFilename}_${Date.now()}.png`;

    if (DEBUG) {
      console.log(`Generated PNG filename: ${pngFilename}`);
    }

    const pdfResponse = await fetch(payload.pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
    }

    const pdfData = await pdfResponse.arrayBuffer();
    const pngData = await convertPdfFirstPageToPng(pdfData);

    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('resumes')
      .upload(`${payload.userId}/${pngFilename}`, pngData, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload PNG: ${uploadError.message}`);
    }

    const { data: urlData } = supabaseAdmin
      .storage
      .from('resumes')
      .getPublicUrl(`${payload.userId}/${pngFilename}`);

    const pngUrl = urlData?.publicUrl;

    if (DEBUG) {
      console.log(`Successfully uploaded PNG`);
      console.log(`PNG Public URL: ${pngUrl}`);
    }

    return new Response(JSON.stringify({ success: true, pngUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in convert-pdf-to-png:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

async function convertPdfFirstPageToPng(pdfData: ArrayBuffer): Promise<Uint8Array> {
  const loadingTask = getDocument({ data: new Uint8Array(pdfData) });
  const pdfDocument = await loadingTask.promise;
  const page = await pdfDocument.getPage(1);

  const scale = 2.0;
  const viewport = page.getViewport({ scale });

  const canvas = new OffscreenCanvas(viewport.width, viewport.height);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    throw new Error("Failed to get canvas context");
  }

  context.fillStyle = 'white';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: context, viewport }).promise;

  const pngBlob = await canvas.convertToBlob({ type: 'image/png' });
  if (pngBlob.type !== 'image/png') {
    throw new Error("Generated blob is not a valid PNG");
  }

  const pngArrayBuffer = await pngBlob.arrayBuffer();
  return new Uint8Array(pngArrayBuffer);
}