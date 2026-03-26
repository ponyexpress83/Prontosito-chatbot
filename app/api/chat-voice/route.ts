import { NextRequest, NextResponse } from "next/server";
import { getAI } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 }
      );
    }

    // Convert audio blob to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    // Determine mime type from the uploaded file
    const mimeType = audioFile.type || "audio/webm";

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          text: "Trascrivi questo audio in italiano. Rispondi SOLO con il testo trascritto, senza aggiungere nulla.",
        },
        {
          inlineData: {
            mimeType,
            data: base64Audio,
          },
        },
      ],
    });

    const transcript =
      response.text ??
      (response as Record<string, unknown>).candidates?.[0]?.content?.parts?.[0]
        ?.text ??
      "";

    if (!transcript.trim()) {
      return NextResponse.json(
        { error: "Could not transcribe audio" },
        { status: 422 }
      );
    }

    return NextResponse.json({ transcript: transcript.trim() });
  } catch (error) {
    console.error("[/api/chat-voice] Error:", error);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 }
    );
  }
}
