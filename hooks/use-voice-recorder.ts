"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  duration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob>;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resolveStopRef = useRef<((blob: Blob) => void) | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current?.stream
        ?.getTracks()
        .forEach((t) => t.stop());
    };
  }, []);

  const startRecording = useCallback(async () => {
    // Request mic permission
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Determine mime type
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      // Stop all tracks
      stream.getTracks().forEach((t) => t.stop());
      // Resolve the stop promise
      resolveStopRef.current?.(blob);
      resolveStopRef.current = null;
    };

    recorder.start();
    setIsRecording(true);
    setDuration(0);

    // Start duration timer
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise<Blob>((resolve, reject) => {
      if (
        !mediaRecorderRef.current ||
        mediaRecorderRef.current.state !== "recording"
      ) {
        reject(new Error("Not recording"));
        return;
      }

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      resolveStopRef.current = resolve;
      setIsRecording(false);
      setDuration(0);

      mediaRecorderRef.current.stop();
    });
  }, []);

  return {
    isRecording,
    duration,
    startRecording,
    stopRecording,
  };
}
