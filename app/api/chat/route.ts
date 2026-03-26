import { NextRequest, NextResponse } from "next/server";
import { getAI } from "@/lib/gemini";

const SYSTEM_PROMPT = `Sei l'assistente ProntoSito, un chatbot amichevole ed entusiasta che aiuta le piccole imprese italiane a creare un'anteprima del loro sito web in pochi minuti.

REGOLE IMPORTANTI:
- Rispondi SEMPRE in italiano
- Fai MASSIMO 3 domande in totale prima di generare l'anteprima
- Risposte BREVI: 2-3 frasi massimo
- Sii caloroso, entusiasta, usa qualche emoji (senza esagerare)
- Deduci automaticamente stile, tono, colori e sezioni dal tipo di attività

FLUSSO CONVERSAZIONE:
1. PRIMO SCAMBIO: Ottieni nome dell'attività + cosa fanno (potrebbe arrivare da trascrizione vocale, sii flessibile)
2. SECONDO SCAMBIO: Chiedi se hanno un sito web esistente o pagine social (URL)
3. TERZO SCAMBIO (opzionale): Chiedi preferenze specifiche OPPURE conferma e genera

SE l'utente fornisce un URL, imposta action su "analyze_url".
DOPO 2-3 scambi quando hai abbastanza informazioni, imposta action su "generate_preview".

RISPONDI SEMPRE in formato JSON valido con questa struttura:
{
  "reply": "il tuo messaggio di risposta all'utente",
  "extractedData": {
    "businessName": "nome attività (se menzionato)",
    "category": "categoria (es. ristorazione, parrucchiere, artigiano...)",
    "subcategory": "sottocategoria se applicabile",
    "city": "città se menzionata",
    "goal": "obiettivo del sito",
    "services": ["lista", "servizi", "menzionati"],
    "style": "stile dedotto (moderno, elegante, minimal, tradizionale...)",
    "tone": "tono dedotto (professionale, amichevole, lusso, informale...)"
  },
  "action": null,
  "actionData": {}
}

Per extractedData: includi solo i campi che hai effettivamente estratto dalla conversazione.
Per action: usa null, "analyze_url" o "generate_preview".
Per actionData: se action è "analyze_url", includi {"url": "l'url fornito"}.`;

interface ChatRequestBody {
  messages: Array<{ role: string; content: string }>;
  conversationData?: Record<string, unknown>;
  analysisData?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();
    const { messages, conversationData, analysisData } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Build prompt contents
    let fullPrompt = SYSTEM_PROMPT + "\n\n";

    if (conversationData && Object.keys(conversationData).length > 0) {
      fullPrompt += `DATI GIÀ RACCOLTI: ${JSON.stringify(conversationData)}\n\n`;
    }

    if (analysisData) {
      fullPrompt += `RISULTATI ANALISI SITO ESISTENTE: ${JSON.stringify(analysisData)}\nUsa questi dati per arricchire le tue risposte e le informazioni estratte.\n\n`;
    }

    fullPrompt += "CONVERSAZIONE:\n";
    for (const msg of messages) {
      const label = msg.role === "user" ? "UTENTE" : "ASSISTENTE";
      fullPrompt += `${label}: ${msg.content}\n`;
    }
    fullPrompt += "\nASSISTENTE (rispondi in JSON):";

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    });

    // Extract text from response
    const rawText =
      response.text ??
      (response as Record<string, unknown>).candidates?.[0]?.content?.parts?.[0]
        ?.text ??
      "";

    // Parse JSON from response (handle markdown code blocks)
    let parsed: {
      reply: string;
      extractedData?: Record<string, unknown>;
      action?: string | null;
      actionData?: Record<string, unknown>;
    };

    try {
      // Strip markdown code fences if present
      const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // If JSON parsing fails, treat the whole response as the reply
      parsed = {
        reply:
          rawText.trim() ||
          "Mi scusi, non ho capito bene. Può ripetere?",
        extractedData: {},
        action: null,
        actionData: {},
      };
    }

    return NextResponse.json({
      reply: parsed.reply,
      extractedData: parsed.extractedData ?? {},
      action: parsed.action ?? null,
      actionData: parsed.actionData ?? {},
    });
  } catch (error) {
    console.error("[/api/chat] Error:", error);
    return NextResponse.json(
      {
        reply: "Mi dispiace, si è verificato un errore tecnico. Riprova tra un momento.",
        extractedData: {},
        action: null,
        actionData: {},
      },
      { status: 500 }
    );
  }
}
