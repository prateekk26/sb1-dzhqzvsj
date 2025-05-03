import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getDocument } from 'https://cdn.skypack.dev/pdfjs-dist@3.4.120/build/pdf.mjs';
import { corsHeaders } from '../_shared/cors.ts';

// Request interface
interface ExtractPdfTextRequest {
  pdfUrl?: string;
  fileBase64?: string;
}

// Serve HTTP requests
serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    // Parse request payload
    const payload: ExtractPdfTextRequest = await req.json();
    
    // Validate payload - either pdfUrl or fileBase64 must be provided
    if (!payload.pdfUrl && !payload.fileBase64) {
      return new Response(
        JSON.stringify({ error: "Either pdfUrl or fileBase64 must be provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    let pdfData;
    
    if (payload.pdfUrl) {
      // Fetch PDF from URL
      const response = await fetch(payload.pdfUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      pdfData = await response.arrayBuffer();
    } else if (payload.fileBase64) {
      // Convert base64 to binary
      const binary = atob(payload.fileBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      pdfData = bytes.buffer;
    }
    
    // Extract text from PDF
    const text = await extractTextFromPdf(pdfData);
    
    // Return the extracted text
    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in extract-pdf-text:", error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

/**
 * Extract text content from a PDF
 */
async function extractTextFromPdf(pdfData: ArrayBuffer): Promise<string> {
  try {
    // Load the PDF document
    const loadingTask = getDocument({ data: new Uint8Array(pdfData) });
    const pdfDocument = await loadingTask.promise;
    
    // Get the number of pages
    const numPages = pdfDocument.numPages;
    console.log(`PDF loaded, pages: ${numPages}`);
    
    // Extract text from each page
    let fullText = "";
    
    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const content = await page.getTextContent();
      
      const pageText = content.items
        .map((item: any) => item.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      
      fullText += pageText + "\n\n";
    }
    
    console.log(`Successfully extracted ${fullText.length} characters of text`);
    return fullText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}