"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface Props {
  listingId: string;
  userId: string;
  otherUserId: string;
  initialMessages: Message[];
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr.endsWith("Z") ? dateStr : dateStr + "Z");
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function ChatClient({ listingId, userId, otherUserId, initialMessages }: Props) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Subscribe to real-time messages
  useEffect(() => {
    const channel = supabase
      .channel(`chat_${listingId}_${[userId, otherUserId].sort().join("_")}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `listing_id=eq.${listingId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          const isRelevant =
            (msg.sender_id === userId && msg.receiver_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.receiver_id === userId);
          if (!isRelevant) return;

          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });

          // Mark as read if incoming
          if (msg.receiver_id === userId) {
            supabase.from("messages").update({ read: true }).eq("id", msg.id);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [listingId, userId, otherUserId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");

    const { error } = await supabase.from("messages").insert({
      listing_id: listingId,
      sender_id: userId,
      receiver_id: otherUserId,
      content: text,
      read: false,
    });

    if (error) {
      setInput(text);
    }
    setSending(false);
    textareaRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // Group messages by date
  type Group = { date: string; msgs: Message[] };
  const groups: Group[] = [];
  for (const msg of messages) {
    const date = new Date(msg.created_at.endsWith("Z") ? msg.created_at : msg.created_at + "Z")
      .toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    if (!groups.length || groups[groups.length - 1].date !== date) {
      groups.push({ date, msgs: [msg] });
    } else {
      groups[groups.length - 1].msgs.push(msg);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-1 mb-4 pr-1" style={{ maxHeight: "calc(100vh - 320px)", minHeight: "300px" }}>
        {messages.length === 0 && (
          <div className="text-center py-10 text-text-muted text-sm">
            <div className="text-3xl mb-3">✦</div>
            <p>Commencez la conversation</p>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.date}>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-muted capitalize">{group.date}</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            {group.msgs.map((msg, i) => {
              const isMe = msg.sender_id === userId;
              const prevMsg = group.msgs[i - 1];
              const sameSender = prevMsg && prevMsg.sender_id === msg.sender_id;

              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} ${sameSender ? "mt-0.5" : "mt-3"}`}>
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? "bg-primary text-background rounded-br-md"
                        : "bg-surface border border-border text-text-primary rounded-bl-md"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${isMe ? "text-background/60" : "text-text-muted"}`}>
                      {formatTime(msg.created_at)}
                      {isMe && (
                        <span className="ml-1">{msg.read ? "✓✓" : "✓"}</span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3 items-end border-t border-border pt-4">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Écrire un message… (Entrée pour envoyer)"
          rows={1}
          className="flex-1 bg-surface border border-border rounded-2xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 transition-colors resize-none"
          style={{ minHeight: "48px", maxHeight: "120px" }}
          onInput={(e) => {
            const t = e.currentTarget;
            t.style.height = "auto";
            t.style.height = Math.min(t.scrollHeight, 120) + "px";
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="bg-primary text-background w-12 h-12 rounded-full flex items-center justify-center hover:bg-primary-dim transition-colors disabled:opacity-40 flex-shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
