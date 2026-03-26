"use client";

import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isVoice?: boolean;
  isLoading?: boolean;
}

export type ChatPhase =
  | "consent"
  | "collecting"
  | "analyzing"
  | "generating"
  | "preview_ready";

interface ConversationData {
  businessName?: string;
  category?: string;
  subcategory?: string;
  city?: string;
  goal?: string;
  services?: string[];
  style?: string;
  tone?: string;
  websiteUrl?: string;
  socialUrl?: string;
  [key: string]: unknown;
}

interface AnalysisResult {
  title?: string;
  description?: string;
  colors?: string[];
  imageCount?: number;
}

interface ChatApiResponse {
  reply: string;
  extractedData?: Partial<ConversationData>;
  action?: "analyze_url" | "generate_preview" | null;
  actionData?: { url?: string; [key: string]: unknown };
}

export interface UseChatReturn {
  messages: ChatMessage[];
  phase: ChatPhase;
  isLoading: boolean;
  previewToken: string | null;
  businessName: string;
  analyzingUrl: string | null;
  analysisStatus: "analyzing" | "complete" | "error";
  analysisResult: AnalysisResult | null;
  gdprAccepted: boolean;
  sendMessage: (text: string, isVoice?: boolean) => Promise<void>;
  acceptGdpr: (privacy: boolean, marketing: boolean) => void;
}

const URL_REGEX =
  /(?:https?:\/\/|www\.)[^\s]+|(?:@[\w.]+(?:\/[\w.]+)?)/gi;

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function createMessage(
  role: "user" | "assistant",
  content: string,
  opts?: { isVoice?: boolean; isLoading?: boolean }
): ChatMessage {
  return {
    id: generateId(),
    role,
    content,
    timestamp: new Date(),
    isVoice: opts?.isVoice,
    isLoading: opts?.isLoading,
  };
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [phase, setPhase] = useState<ChatPhase>("consent");
  const [isLoading, setIsLoading] = useState(false);
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [analyzingUrl, setAnalyzingUrl] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<
    "analyzing" | "complete" | "error"
  >("analyzing");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [gdprAccepted, setGdprAccepted] = useState(false);

  const conversationDataRef = useRef<ConversationData>({});

  // ---- helpers ----

  function mergeExtractedData(data?: Partial<ConversationData>) {
    if (!data) return;
    conversationDataRef.current = { ...conversationDataRef.current, ...data };
    if (data.businessName) {
      setBusinessName(data.businessName);
    }
  }

  function toApiMessages(msgs: ChatMessage[]) {
    return msgs
      .filter((m) => !m.isLoading)
      .map((m) => ({ role: m.role, content: m.content }));
  }

  function detectUrls(text: string): string[] {
    return text.match(URL_REGEX) ?? [];
  }

  // ---- public actions ----

  const acceptGdpr = useCallback(
    (privacy: boolean, marketing: boolean) => {
      if (!privacy) return; // privacy consent is required
      setGdprAccepted(true);
      conversationDataRef.current = {
        ...conversationDataRef.current,
        gdprPrivacy: privacy,
        gdprMarketing: marketing,
      };

      const greeting = createMessage(
        "assistant",
        "Ciao! 👋 Sono l'assistente ProntoSito. Raccontami della tua attività: come si chiama e cosa fai? Puoi anche inviarmi un messaggio vocale!"
      );
      setMessages([greeting]);
      setPhase("collecting");
    },
    []
  );

  const sendMessage = useCallback(
    async (text: string, isVoice = false) => {
      if (phase === "consent" || isLoading) return;

      // 1. Add user message
      const userMsg = createMessage("user", text, { isVoice });
      const loadingMsg = createMessage("assistant", "", { isLoading: true });

      setMessages((prev) => [...prev, userMsg, loadingMsg]);
      setIsLoading(true);

      try {
        // Check for URLs in user message
        const detectedUrls = detectUrls(text);

        // 2. Call chat API
        const allMessages = [...messages, userMsg]; // use stale-safe copy
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: toApiMessages(allMessages),
            conversationData: conversationDataRef.current,
          }),
        });

        if (!res.ok) throw new Error("Chat API error");

        const data: ChatApiResponse = await res.json();

        // 3. Merge extracted data
        mergeExtractedData(data.extractedData);

        // 4. Replace loading message with actual response
        const aiMsg = createMessage("assistant", data.reply);
        setMessages((prev) =>
          prev.map((m) => (m.id === loadingMsg.id ? aiMsg : m))
        );

        // 5. Handle actions
        if (data.action === "analyze_url") {
          const url =
            data.actionData?.url ??
            detectedUrls[0] ??
            conversationDataRef.current.websiteUrl;

          if (url) {
            setAnalyzingUrl(url as string);
            setAnalysisStatus("analyzing");
            setPhase("analyzing");

            try {
              const analysisRes = await fetch("/api/analyze-site", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
              });

              if (!analysisRes.ok) throw new Error("Analysis API error");

              const analysisData: AnalysisResult = await analysisRes.json();
              setAnalysisResult(analysisData);
              setAnalysisStatus("complete");

              // Send analysis results back to chat
              const analysisLoadingMsg = createMessage("assistant", "", {
                isLoading: true,
              });
              setMessages((prev) => [...prev, analysisLoadingMsg]);

              const analysisFollowUp = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  messages: toApiMessages([...allMessages, aiMsg]),
                  conversationData: conversationDataRef.current,
                  analysisData,
                }),
              });

              if (!analysisFollowUp.ok)
                throw new Error("Analysis follow-up error");

              const followUpData: ChatApiResponse =
                await analysisFollowUp.json();
              mergeExtractedData(followUpData.extractedData);

              const followUpMsg = createMessage(
                "assistant",
                followUpData.reply
              );
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === analysisLoadingMsg.id ? followUpMsg : m
                )
              );
              setPhase("collecting");

              // If follow-up also triggers generate
              if (followUpData.action === "generate_preview") {
                await handleGeneratePreview();
              }
            } catch {
              setAnalysisStatus("error");
              setPhase("collecting");
            }
          }
        } else if (data.action === "generate_preview") {
          await handleGeneratePreview();
        }
      } catch (error) {
        // Replace loading message with error
        const errorMsg = createMessage(
          "assistant",
          "Mi dispiace, si è verificato un errore. Puoi riprovare?"
        );
        setMessages((prev) =>
          prev.map((m) => (m.id === loadingMsg.id ? errorMsg : m))
        );
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, phase, isLoading]
  );

  async function handleGeneratePreview() {
    setPhase("generating");

    try {
      const intakeRes = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...conversationDataRef.current,
          analysisResult,
        }),
      });

      if (!intakeRes.ok) throw new Error("Intake API error");

      const intakeData = await intakeRes.json();
      const token = intakeData.token ?? intakeData.previewToken ?? intakeData.id;

      if (token) {
        setPreviewToken(token);
        setPhase("preview_ready");
      }
    } catch {
      setPhase("collecting");
      const errorMsg = createMessage(
        "assistant",
        "C'è stato un problema nella generazione. Riproviamo?"
      );
      setMessages((prev) => [...prev, errorMsg]);
    }
  }

  return {
    messages,
    phase,
    isLoading,
    previewToken,
    businessName,
    analyzingUrl,
    analysisStatus,
    analysisResult,
    gdprAccepted,
    sendMessage,
    acceptGdpr,
  };
}
