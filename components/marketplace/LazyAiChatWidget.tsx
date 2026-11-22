"use client";

import dynamic from "next/dynamic";

export const LazyAiChatWidget = dynamic(
  () => import("@/components/marketplace/AiChatWidget").then((mod) => mod.AiChatWidget),
  { ssr: false }
);
