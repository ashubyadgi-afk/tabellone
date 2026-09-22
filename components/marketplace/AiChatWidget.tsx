"use client";

import { useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui";

export function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "bot"; text: string }>
  >([
    {
      role: "bot",
      text: "Hi! Ask me about finding AdSpaces, pricing, bookings, or listings.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setLoading(true);

    const res = await fetch("/api/v1/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMsg }),
    });
    const data = await res.json();
    setMessages((m) => [...m, { role: "bot", text: data.reply }]);
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:scale-105 transition"
        aria-label="Open AI assistant"
        suppressHydrationWarning
      >
        <Sparkles className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl sm:w-96">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="font-semibold text-[#1e3a5f]">Tabellone Assistant</p>
            <p className="text-xs text-slate-500">AI-powered platform help</p>
          </div>
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-xl px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "ml-6 bg-[#1e3a5f] text-white"
                    : "mr-6 bg-slate-100 text-slate-700"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <p className="text-xs text-slate-400">Thinking…</p>
            )}
          </div>
          <div className="flex gap-2 border-t border-slate-100 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask anything…"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              suppressHydrationWarning
            />
            <Button size="sm" onClick={send} disabled={loading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
