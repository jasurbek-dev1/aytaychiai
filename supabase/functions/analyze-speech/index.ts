import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { audioBase64 } = await req.json();
    
    if (!audioBase64) {
      throw new Error("Audio ma'lumotlari topilmadi.");
    }
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    // Har qanday turdagi base64 prefiksini tozalash (Xavfsiz Regex)
    const pureBase64 = audioBase64.replace(/^data:audio\/[a-z0-9]+;base64,/, "");

    const requestBody = {
      contents: [{
        parts: [
          { 
            text: "You are an expert English language assessor. Listen to the attached audio carefully. Analyze its grammar, vocabulary, relevance, and response speed. You must strictly respond ONLY with a raw JSON object matching this structure, without markdown blocks: {\"scores\": {\"grammar\": 8, \"vocabulary\": 7, \"responseSpeed\": 9, \"relevance\": 8}, \"feedback\": [{\"original\": \"the text spoken\", \"corrected\": \"the grammatically correct version\", \"explanation\": \"in English\", \"uzbekExplanation\": \"o'zbek tilida tushuntirish\"}]}" 
          },
          {
            inlineData: {
              mimeType: "audio/webm",
              data: pureBase64
            }
          }
        ]
      }]
    };
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
}); 