"use client";
import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

type Props = { onDetected: (code: string) => void };

export default function BarcodeScanner({ onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>("");
  const [scanning, setScanning] = useState(false);

  // カメラ停止処理
  function stopCamera() {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }

  useEffect(() => {
    if (!scanning) return;

    const codeReader = new BrowserMultiFormatReader();

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // 1回だけ読み取る
        const result = await codeReader.decodeOnceFromVideoElement(videoRef.current);
        const text = result?.getText?.();
        if (text) {
          onDetected(text);
          stopCamera(); // ← 成功したらカメラ停止
        }
      } catch (e: any) {
        setError(e?.message ?? "カメラ起動に失敗しました");
        stopCamera();
      }
    })();

    return () => stopCamera();
  }, [scanning]);

  return (
    <div className="flex flex-col gap-2 items-start">
      {!scanning && (
        <button
          onClick={() => setScanning(true)}
          className="px-3 py-1 rounded bg-blue-600 text-white"
        >
          カメラ起動
        </button>
      )}
      {scanning && (
        <video ref={videoRef} className="w-full max-w-md rounded-md border" />
      )}
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
