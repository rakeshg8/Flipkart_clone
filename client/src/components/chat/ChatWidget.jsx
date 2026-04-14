import { Bot, Send, X } from "lucide-react";
import { useState } from "react";
import api from "../../api/http";
import { Link } from "react-router-dom";

const initialMessages = [{ role: "assistant", content: "Hi! I am Flipkart Support. How can I help you today?" }];

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const messageMentionsProducts = (text) => {
    const normalized = String(text || "").toLowerCase();
    return ["product", "price", "stock", "brand", "phone", "laptop", "headphone", "recommend"].some((k) => normalized.includes(k));
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const next = [...messages, { role: "user", content: input.trim() }];
    setMessages(next);
    setInput("");
    setTyping(true);

    try {
      const { data } = await api.post("/chat", {
        message: input.trim(),
        history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content }))
      });

      const reply = data?.reply || "Sorry, I am facing a temporary issue. Please try again.";
      const sources = Array.isArray(data?.sources) ? data.sources : [];
      setMessages((prev) => [...prev, { role: "assistant", content: reply, sources }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I am facing a temporary issue. Please try again." }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-[480px] w-[320px] flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-green-600 px-3 py-2 text-white">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Bot className="h-4 w-4" />
              Flipkart Support
            </div>
            <button type="button" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto bg-[#ece5dd] p-3">
            {messages.map((msg, idx) => (
              <div key={`${msg.role}-${idx}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-[#dcf8c6]" : "bg-white"}`}>
                  <p>{msg.content}</p>

                  {msg.role === "assistant" && Array.isArray(msg.sources) && msg.sources.length > 0 && messageMentionsProducts(msg.content) && (
                    <div className="mt-2 rounded border border-slate-200 p-2">
                      <p className="mb-2 text-[11px] font-semibold text-slate-500">Related Products</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {msg.sources.slice(0, 3).map((p) => (
                          <div key={p.slug || p.name} className="w-32 flex-shrink-0 rounded border bg-white p-2">
                            <img
                              src={p.images?.[0] || "https://picsum.photos/seed/fallback/80/80"}
                              alt={p.name}
                              className="mx-auto h-20 w-20 object-contain"
                            />
                            <p className="mt-1 line-clamp-2 text-[11px] font-medium">{String(p.name || "").slice(0, 30)}</p>
                            <p className="mt-1 text-[11px] font-semibold">₹{Number(p.price || 0).toLocaleString("en-IN")}</p>
                            {p.slug && (
                              <Link to={`/products/${p.slug}`} className="mt-1 inline-block text-[11px] font-semibold text-fkBlue">
                                View
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && <p className="text-xs text-slate-500">Support is typing...</p>}
          </div>

          <div className="flex items-center gap-2 border-t p-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && sendMessage()}
              placeholder="Type your message"
              className="h-10 flex-1 rounded-full border px-3 text-sm outline-none focus:border-green-500"
            />
            <button type="button" onClick={sendMessage} className="rounded-full bg-green-600 p-2 text-white">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-fkBlue text-white shadow-xl"
      >
        <Bot className="h-6 w-6" />
      </button>
    </div>
  );
};

export default ChatWidget;
