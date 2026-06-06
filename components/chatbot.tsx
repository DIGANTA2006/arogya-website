"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Phone, Send, X } from "lucide-react";

type Message = { from: "bot" | "user"; text: string };

const quickQuestions = [
  "How can I book appointment?",
  "Do you provide online consultation?",
  "What services are available?",
  "What is clinic timing?",
];

function getBotAnswer(question: string) {
  const text = question.toLowerCase();

  if (text.includes("appointment") || text.includes("book")) {
    return "To book online, please login or create a patient account first. You can choose clinic visit or online consultation from your dashboard.";
  }

  if (text.includes("online") || text.includes("video") || text.includes("virtual")) {
    return "Online consultation can be requested for follow-up, speech therapy guidance, parent counselling and report discussion.";
  }

  if (text.includes("service") || text.includes("available")) {
    return "Services include speech therapy, child speech development, voice therapy, audiometry testing, hearing aid consultation and digital hearing aid support.";
  }

  if (text.includes("time") || text.includes("timing") || text.includes("open")) {
    return "Clinic timing is Monday to Saturday, 11:00 AM to 8:00 PM. Please confirm by call or WhatsApp before visiting.";
  }

  if (text.includes("fee") || text.includes("price") || text.includes("cost")) {
    return "Consultation fee depends on the service. The clinic team can share exact fee during appointment confirmation.";
  }

  return "I can help with appointments, timing, services, online consultation, speech therapy, hearing test, hearing aid support, fees and location.";
}

function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893C23.946 5.348 18.602 0 12.05 0z" />
    </svg>
  );
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      from: "bot",
      text: "Hello! I can help with appointments, services, timings and online consultation.",
    },
  ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function sendMessage(textValue?: string) {
    const question = textValue || input;

    if (!question.trim()) {
      return;
    }

    setMessages((previous) => [
      ...previous,
      { from: "user", text: question },
      { from: "bot", text: getBotAnswer(question) },
    ]);

    setInput("");
  }

  return (
    <div className="fixed bottom-4 right-4 z-[70] flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-2 sm:right-5">
      {open && (
        <section className="mb-3 flex h-[min(620px,calc(100dvh-7.5rem))] w-[min(430px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-2xl">
          <div className="flex shrink-0 items-center justify-between gap-3 bg-primary p-4 text-primary-foreground">
            <div>
              <strong className="text-base">Clinic Help Bot</strong>
              <p className="mt-1 text-xs opacity-85">Basic appointment and service support</p>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15"
              aria-label="Close chatbot"
            >
              <X size={18} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-secondary/50 p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.from}-${index}`}
                className={`mb-3 flex ${message.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    message.from === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-white text-foreground"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="shrink-0 border-t border-border bg-white p-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {quickQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => sendMessage(question)}
                  className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground"
                >
                  {question}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && sendMessage()}
                placeholder="Ask a question..."
                className="min-w-0 flex-1 rounded-full border border-input px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />

              <button
                onClick={() => sendMessage()}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
              >
                <Send size={16} />
                Send
              </button>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              This bot gives basic clinic information only. It does not provide diagnosis or emergency medical advice.
            </p>
          </div>
        </section>
      )}

      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-extrabold text-primary-foreground shadow-xl transition hover:scale-105"
          aria-label="Open clinic help bot"
        >
          <MessageCircle size={18} />
          Chat
        </button>

        <a
          href="https://wa.me/919755018656?text=Hello%20Arogya%20Clinic%2C%20I%20need%20appointment%20help."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-extrabold text-white shadow-xl transition hover:scale-105"
        >
          <WhatsAppIcon size={18} />
          WhatsApp
        </a>

        <a
          href="tel:9755018656"
          className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-extrabold text-white shadow-xl transition hover:scale-105 sm:hidden"
          style={{ background: "var(--warm-orange)" }}
        >
          <Phone size={18} />
          Call
        </a>
      </div>
    </div>
  );
}