//src/components/BarcodeScanner.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

type Props = { onDetected: (code: string) => void };

export default function BarcodeScanner({ onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>("");
  const [scanning, setScanning] = useState(false);

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

    // ここだけ @zxing/library の列挙体を使う
    const hints = new Map<DecodeHintType, unknown>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
    ]);

    const reader = new BrowserMultiFormatReader(hints);

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (!videoRef.current) return;

        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // 1回だけ読み取り
        const result = await reader.decodeOnceFromVideoElement(videoRef.current);
        const text = result?.getText?.();
        if (text) {
          onDetected(text.trim());
          stopCamera();
        }
      } catch (e: any) {
        setError(
          e?.name === "NotAllowedError"
            ? "カメラの権限が許可されていません"
            : e?.name === "NotFoundError"
            ? "カメラデバイスが見つかりません"
            : e?.message ?? "カメラ起動に失敗しました"
        );
        stopCamera();
      }
    })();

    return () => stopCamera();
  }, [scanning, onDetected]);

  return (
    <div className="flex flex-col gap-2 items-start">
      {!scanning && (
        <button
          onClick={() => {
            setError("");
            setScanning(true);
          }}
          className="px-3 py-1 rounded bg-blue-600 text-white"
        >
          カメラ起動
        </button>
      )}
      {scanning && (
        <video
          ref={videoRef}
          className="w-full max-w-md rounded-md border"
          muted
          playsInline
        />
      )}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
