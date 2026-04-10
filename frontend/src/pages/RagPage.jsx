import { useState, useEffect, useRef } from "react";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import {
  Brain, FileText, Send, Plus, Loader2, MessageSquare, Menu, FileImage, Files, Presentation
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function RagPage() {
  const { toast } = useToast();
  
  // State
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [topicModal, setTopicModal] = useState({ visible: false, type: null, title: "" });
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Initial load
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get("/chat/sessions");
      setSessions(res.data);
      if (res.data.length > 0 && !activeSession) {
        loadSession(res.data[0]._id);
      }
    } catch (err) {
      toast({ title: "Failed to load sessions", variant: "destructive" });
    }
  };

  const loadSession = async (id) => {
    try {
      const res = await api.get(`/chat/sessions/${id}`);
      setActiveSession(res.data);
      setMessages(res.data.messages || []);
    } catch (err) {
      toast({ title: "Failed to load session", variant: "destructive" });
    }
  };

  const startNewChat = async () => {
    try {
      const res = await api.post("/chat/sessions", { title: "New Conversation" });
      setSessions([res.data, ...sessions]);
      setActiveSession(res.data);
      setMessages([]);
    } catch (err) {
      toast({ title: "Failed to create session", variant: "destructive" });
    }
  };

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (overrideText = null, imageBase64 = null) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() && !imageBase64) return;
    if (!activeSession) {
      toast({ title: "Please select or start a chat first", variant: "destructive" });
      return;
    }

    const newMessage = { role: "user", content: textToSend, imageUrl: imageBase64 };
    setMessages((prev) => [...prev, newMessage]);
    if (!overrideText) setInput("");
    setIsSending(true);

    try {
      const res = await api.post(`/chat/sessions/${activeSession._id}/message`, {
        content: textToSend,
        imageUrl: imageBase64
      });
      // Update session title dynamically if it was a new chat
      setSessions((prev) => prev.map(s => s._id === res.data.session._id ? { ...s, title: res.data.session.title } : s));
      setMessages(res.data.session.messages);
      setActiveSession(res.data.session);
    } catch (err) {
      toast({ title: "Failed to get reply", description: err.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const fileToDataUri = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!activeSession) return toast({ title: "Please start a chat first" });

    setIsUploading(true);
    try {
      if (file.type === "application/pdf") {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("namespace", activeSession._id); // Use session ID as Pinecone namespace
        
        await api.post("/rag/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        await api.put(`/chat/sessions/${activeSession._id}/namespace`, { pdfNamespace: activeSession._id });
        
        setActiveSession((prev) => ({ ...prev, pdfNamespace: activeSession._id }));
        toast({ title: "PDF Uploaded! You can now ask questions or click Summarize." });
      } else if (file.type.startsWith("image/")) {
        const base64 = await fileToDataUri(file);
        handleSend("Attached Image", base64);
        toast({ title: "Image sent successfully." });
      } else {
        toast({ title: "Unsupported file type", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  const handleSummarizeRequest = () => {
    if (!activeSession?.pdfNamespace) return;
    handleSend("Please provide a very detailed summary of the main points of the attached document.");
  };

  const handleGenerateContent = async () => {
    if (!topicModal.title.trim()) return toast({title: "Topic title required", variant: "destructive"});
    setIsGeneratingContent(true);
    const type = topicModal.type;
    const title = topicModal.title;
    setTopicModal({ visible: false, type: null, title: "" });

    try {
      const endpoint = type === 'notes' ? '/content/generate' : '/content/generate/slides';
      const genRes = await api.post(endpoint, {
        topic: title,
        chatContext: messages
      });
      const generatedData = genRes.data;

      const saveEndpoint = type === 'notes' ? '/content/saved' : '/content/saved/slides';
      await api.post(saveEndpoint, {
        title: generatedData.title,
        type,
        topic: title,
        difficulty: 'advanced',
        length: 'detailed',
        tone: 'formal',
        content: generatedData
      });

      toast({ title: "Success!", description: `${type === 'notes' ? 'Notes' : 'Slides'} generated and saved for students! (Check Saved Materials)`, variant: "default" });
    } catch (err) {
      toast({ title: "Generation failed", description: err.response?.data?.message || err.message, variant: "destructive" });
    } finally {
      setIsGeneratingContent(false);
    }
  };

  return (
    <div className="flex flex-row-reverse h-[calc(100vh-80px)] overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-64" : "w-0"} flex-shrink-0 border-l border-border bg-muted/20 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-border flex justify-between items-center whitespace-nowrap overflow-hidden">
          <h2 className="font-semibold flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> Chat Assistant</h2>
        </div>
        <div className="p-3">
          <button onClick={startNewChat} className="w-full flex items-center gap-2 rounded-lg bg-primary/10 text-primary px-4 py-2 text-sm font-semibold hover:bg-primary/20 transition-colors">
            <Plus className="h-4 w-4" /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {sessions.map(s => (
            <button
              key={s._id}
              onClick={() => loadSession(s._id)}
              className={`w-full flex flex-col text-left px-3 py-2 rounded-lg text-sm transition-all ${activeSession?._id === s._id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              <span className="truncate w-full inline-block font-medium">{s.title}</span>
              <span className="text-[10px] text-muted-foreground/70">{formatDistanceToNow(new Date(s.updatedAt), { addSuffix: true })}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Header */}
        <div className="h-14 border-b border-border flex items-center px-4 justify-between bg-card shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 text-muted-foreground hover:bg-muted rounded-md border border-transparent hover:border-border transition-all">
              <Menu className="h-4 w-4" />
            </button>
            <h3 className="font-semibold text-sm">{activeSession ? activeSession.title : "Start a conversation to begin"}</h3>
          </div>
          
          <div className="flex items-center gap-2">
            {activeSession && (
              <>
                <button 
                  onClick={() => setTopicModal({ visible: true, type: 'notes', title: '' })} 
                  disabled={isGeneratingContent || isSending}
                  className="text-xs px-3 py-1 bg-background border border-primary/20 hover:bg-primary/5 text-primary font-medium rounded transition-colors flex items-center gap-1.5"
                >
                  {isGeneratingContent && topicModal.type === 'notes' ? <Loader2 className="h-3 w-3 animate-spin"/> : <FileText className="h-3 w-3" />}
                  <span className="hidden sm:inline">Notes</span>
                </button>
                <button 
                  onClick={() => setTopicModal({ visible: true, type: 'slides', title: '' })} 
                  disabled={isGeneratingContent || isSending}
                  className="text-xs px-3 py-1 bg-background border border-primary/20 hover:bg-primary/5 text-primary font-medium rounded transition-colors flex items-center gap-1.5"
                >
                  {isGeneratingContent && topicModal.type === 'slides' ? <Loader2 className="h-3 w-3 animate-spin"/> : <Presentation className="h-3 w-3" />}
                  <span className="hidden sm:inline">Slides</span>
                </button>
              </>
            )}
            
            {activeSession?.pdfNamespace && (
              <>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-medium border border-green-500/20">
                  <FileText className="h-3 w-3" /> PDF
                </div>
                <button 
                  onClick={handleSummarizeRequest} 
                  disabled={isSending || isGeneratingContent}
                  className="text-xs px-3 py-1 bg-primary text-primary-foreground font-medium rounded hover:bg-primary/90 transition-colors"
                  title="Generate a summary of the PDF"
                >
                  Summarize
                </button>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold">How can I help you study today?</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                Ask a question, upload a PDF to chat with its contents, or attach an image for analysis.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex shrink-0 items-center justify-center border border-primary/20">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted/40 border border-border text-foreground rounded-tl-sm"}`}>
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                {m.imageUrl && (
                  <div className="mt-3">
                    <img src={m.imageUrl} alt="Attached" className="max-w-[300px] max-h-[300px] rounded-md border border-border object-contain bg-background" />
                  </div>
                )}
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex shrink-0 items-center justify-center border border-primary/20">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted/40 border border-border rounded-xl rounded-tl-sm px-4 py-3 text-sm flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" /> Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="p-4 bg-card border-t border-border shrink-0">
          <div className="relative flex items-center bg-background border border-input rounded-xl shadow-sm focus-within:ring-1 focus-within:ring-primary overflow-hidden">
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-3 text-muted-foreground hover:bg-muted transition-colors opacity-80 hover:opacity-100"
              title="Upload PDF or Image"
            >
              {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="application/pdf,image/*" 
              onChange={handleFileUpload} 
            />
            
            <textarea
              className="flex-1 max-h-32 min-h-[48px] bg-transparent py-3 px-1 text-sm focus:outline-none resize-none"
              placeholder="Message your Teaching Assistant..."
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = '48px';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button 
              onClick={() => handleSend()}
              disabled={!input.trim() || isSending}
              className="p-3 mr-1 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <div className="text-[10px] text-center mt-2 text-muted-foreground/70">
            Assistant can make mistakes. Verify important information. Models provided by Groq & TinyLlama.
          </div>
        </div>
      </div>
      
      {/* Generate Content Modal */}
      {topicModal.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl p-6 w-full max-w-md border border-border shadow-lg">
            <h3 className="text-lg font-bold mb-4 font-display flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary"/>
              Generate {topicModal.type === 'notes' ? 'Detailed Notes' : 'Classroom Slides'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter a topic title. The AI will use your current chat conversation context to generate {topicModal.type === 'notes' ? '4-5 pages of detailed notes' : '10 presentation slides'} and save them to your materials for students.
            </p>
            <input 
              type="text" 
              value={topicModal.title} 
              onChange={e => setTopicModal({...topicModal, title: e.target.value})}
              className="w-full rounded-md border border-input p-2.5 mb-6 bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="e.g. Overview of Quantum Computing"
              autoFocus
            />
            <div className="flex justify-end gap-3 flex-row-reverse">
              <button onClick={handleGenerateContent} disabled={!topicModal.title.trim()} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-medium flex items-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50">
                 Continue
              </button>
              <button onClick={() => setTopicModal({visible: false, type: null, title: ""})} className="px-4 py-2 text-sm rounded-md hover:bg-muted text-foreground transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
