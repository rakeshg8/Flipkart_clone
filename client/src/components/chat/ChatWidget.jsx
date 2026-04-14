import { Bot, Send, X } from "lucide-react";
import { useMemo, useState } from "react";
import api from "../../api/http";

const initialMessages = [{ role: "assistant", content: "Hi! I am Flipkart Support. How can I help you today?" }];

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const payloadMessages = useMemo(
    () => messages.filter((m) => m.content).map((m) => ({ role: m.role, content: m.content })),
    [messages]
  );

  const sendMessage = async () => {
    if (!input.trim()) return;
    const next = [...messages, { role: "user", content: input.trim() }];
    setMessages(next);
    setInput("");
    setTyping(true);

    try {
      const { data } = await api.post("/chat", { messages: [...payloadMessages, { role: "user", content: input.trim() }] });
      setMessages((prev) => [...prev, { role: "assistant", content: data.data.message }]);
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
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user" ? "bg-[#dcf8c6]" : "bg-white"
                  }`}
                >
                  {msg.content}
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
