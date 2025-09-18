"use client";

import React from "react";

export default function LoadingCat() {
  return (
    // ← これでローディング表示があっても下のボタン操作をブロックしません
    <div className="fixed inset-0 z-[9999] pointer-events-none flex flex-col items-center justify-center bg-cream">
      {/* カード枠 */}
      <div className="relative w-[min(520px,92vw)] rounded-3xl bg-white shadow-soft p-8 flex flex-col items-center">
        {/* 猫イラスト */}
        <div className="relative">
          <CatSVG />
          <div className="absolute -top-3 -right-3 translate-x-2 -translate-y-2">
            <div className="rounded-full bg-pinkpaw px-3 py-1 text-xs font-semibold text-pawBrown shadow">
              にゃ〜
            </div>
          </div>
        </div>

        {/* テキスト */}
        <p className="mt-5 text-[15px] text-catGray font-semibold tracking-wide">
          猫が毛づくろい中…
        </p>
        <p className="mt-1 text-sm text-pawBrown/70">ちょっとだけ待っててね</p>

        {/* 肉球ステップ */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Paw index={0} />
          <Paw index={1} />
          <Paw index={2} />
          <Paw index={3} />
        </div>
      </div>

      {/* 背景のうっすら肉球 */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
        <BackgroundPaws />
      </div>
    </div>
  );
}

function Paw({ index = 0 }: { index?: number }) {
  return (
    <div
      className="h-6 w-6 rounded-full bg-pinkpaw/90"
      style={{
        animation: `pawstep 1.4s ease-in-out ${index * 0.15}s infinite`,
        boxShadow:
          "0 0 0 4px rgba(250,218,221,0.35), inset 0 2px 0 rgba(255,255,255,0.9)",
      }}
      aria-hidden
    />
  );
}

function BackgroundPaws() {
  return (
    <div className="w-full h-full">
      <div className="absolute left-[12%] top-[18%] h-10 w-10 rounded-full bg-pinkpaw" />
      <div className="absolute left-[22%] top-[56%] h-8 w-8 rounded-full bg-pinkpaw" />
      <div className="absolute right-[16%] top-[30%] h-12 w-12 rounded-full bg-pinkpaw" />
      <div className="absolute right-[28%] bottom-[18%] h-9 w-9 rounded-full bg-pinkpaw" />
    </div>
  );
}

/** インラインSVG（目パチ & しっぽアニメ） */
function CatSVG() {
  return (
    <svg
      width="180"
      height="160"
      viewBox="0 0 180 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="animate-bob"
      aria-label="loading cat"
    >
      {/* 顔 */}
      <circle cx="90" cy="80" r="52" fill="#FFFFFF" stroke="#7A5D52" strokeWidth="3" />
      {/* 耳 */}
      <path d="M55 48 L72 24 L78 50 Z" fill="#FFFFFF" stroke="#7A5D52" strokeWidth="3" />
      <path d="M125 48 L108 24 L102 50 Z" fill="#FFFFFF" stroke="#7A5D52" strokeWidth="3" />
      {/* 目（瞬き） */}
      <g transform="translate(0,0)">
        <ellipse
          cx="72"
          cy="80"
          rx="6.5"
          ry="6.5"
          fill="#333333"
          className="[transform-origin:72px_80px] animate-blink"
        />
        <ellipse
          cx="108"
          cy="80"
          rx="6.5"
          ry="6.5"
          fill="#333333"
          className="[transform-origin:108px_80px] animate-blink"
        />
      </g>
      {/* 口鼻 */}
      <circle cx="90" cy="94" r="4" fill="#7A5D52" />
      <path d="M90 98 Q 86 104 80 106" stroke="#7A5D52" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M90 98 Q 94 104 100 106" stroke="#7A5D52" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* ほっぺ */}
      <circle cx="66" cy="98" r="6" fill="#FADADD" />
      <circle cx="114" cy="98" r="6" fill="#FADADD" />
      {/* しっぽ */}
      <g transform="translate(140,105)">
        <g className="origin-[0px_0px] animate-tail">
          <path
            d="M0 0 C 18 6, 26 16, 26 30 C 26 42, 14 50, 4 46"
            stroke="#7A5D52"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
}
