import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Send, ImagePlus, X, Cpu, Calculator,
    Loader2, Trash2, Copy, Check, ChevronDown
} from 'lucide-react';
import ModelPicker, { ModelConfig, MODELS } from '@/components/ModelPicker';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    image?: string;
    loading?: boolean;
}

const SUGGESTIONS = [
    "Explain photosynthesis with a diagram",
    "Compare Newton's laws in a table",
    "Write a short essay on climate change",
    "Solve x² + 5x + 6 = 0 step by step",
    "What is the difference between DNA and RNA?",
    "Explain the French Revolution briefly",
];

export default function Board() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [pendingImage, setPendingImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [modelPickerOpen, setModelPickerOpen] = useState(false);
    const [selectedModel, setSelectedModel] = useState<ModelConfig>(MODELS[0]);
    const [modelApiKey, setModelApiKey] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const autoResize = () => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setPendingImage(reader.result as string);
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const sendMessage = useCallback(async (text?: string) => {
        const question = (text ?? input).trim();
        if (!question && !pendingImage) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: question,
            image: pendingImage ?? undefined,
        };
        const loadingMsg: ChatMessage = {
            id: Date.now().toString() + '_ai',
            role: 'assistant',
            content: '',
            loading: true,
        };

        const history = messages.map(m => ({ role: m.role, content: m.content }));
        const imgToSend = pendingImage;

        setMessages(prev => [...prev, userMsg, loadingMsg]);
        setInput('');
        setPendingImage(null);
        setIsLoading(true);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        try {
            const resp = await axios.post(`${import.meta.env.VITE_API_URL}/ask`, {
                question,
                image: imgToSend ?? undefined,
                history,
                model_id: selectedModel.id,
                api_key: modelApiKey || undefined,
            });

            setMessages(prev => prev.map(m =>
                m.loading ? { ...m, content: resp.data.answer, loading: false } : m
            ));
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            setMessages(prev => prev.map(m =>
                m.loading ? {
                    ...m,
                    content: `**Error:** ${detail || 'Something went wrong. Please try again.'}`,
                    loading: false
                } : m
            ));
        } finally {
            setIsLoading(false);
        }
    }, [input, pendingImage, messages, selectedModel, modelApiKey]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#0f0f0f] text-white">

            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-[#0f0f0f]/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/app')}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/8 hover:bg-white/15 text-white/60 hover:text-white text-sm transition-all"
                    >
                        <Calculator className="w-4 h-4" />
                        <span>Math Board</span>
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-black text-sm font-semibold">
                        <span>✦</span>
                        <span>AI Board</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setModelPickerOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 hover:bg-white/15 text-white/60 hover:text-white text-sm transition-all"
                    >
                        <Cpu className="w-3.5 h-3.5" />
                        <span className="max-w-[120px] truncate">{selectedModel.name}</span>
                        <ChevronDown className="w-3 h-3" />
                    </button>
                    {messages.length > 0 && (
                        <button
                            onClick={() => setMessages([])}
                            className="p-2 rounded-full bg-white/8 hover:bg-white/15 text-white/40 hover:text-white transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                {messages.length === 0 ? (
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center mb-10">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg shadow-violet-500/20">
                                ✦
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">AI Board</h1>
                            <p className="text-white/40 text-sm">Ask anything — science, math, history, English, coding, and more.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {SUGGESTIONS.map(s => (
                                <button
                                    key={s}
                                    onClick={() => sendMessage(s)}
                                    className="text-left p-4 rounded-2xl bg-white/5 border border-white/8 hover:bg-white/10 hover:border-white/20 text-white/60 hover:text-white text-sm transition-all"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto space-y-6">
                        {messages.map(msg => (
                            <MessageBubble key={msg.id} msg={msg} />
                        ))}
                        <div ref={bottomRef} />
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="px-4 pb-6 pt-2 max-w-2xl mx-auto w-full">
                {pendingImage && (
                    <div className="relative inline-block mb-2">
                        <img src={pendingImage} className="h-16 rounded-xl border border-white/10 object-cover" />
                        <button
                            onClick={() => setPendingImage(null)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black border border-white/20 rounded-full flex items-center justify-center"
                        >
                            <X className="w-3 h-3 text-white" />
                        </button>
                    </div>
                )}

                <div className="flex items-end gap-2 bg-white/8 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-white/25 transition-colors">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0 mb-0.5"
                    >
                        <ImagePlus className="w-5 h-5" />
                    </button>

                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={e => { setInput(e.target.value); autoResize(); }}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything... (Shift+Enter for new line)"
                        rows={1}
                        className="flex-1 bg-transparent text-white placeholder-white/30 text-sm resize-none focus:outline-none leading-relaxed"
                    />

                    <button
                        onClick={() => sendMessage()}
                        disabled={isLoading || (!input.trim() && !pendingImage)}
                        className={`p-2 rounded-xl shrink-0 mb-0.5 transition-all ${
                            isLoading || (!input.trim() && !pendingImage)
                                ? 'bg-white/10 text-white/20 cursor-not-allowed'
                                : 'bg-white text-black hover:bg-white/90'
                        }`}
                    >
                        {isLoading
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Send className="w-4 h-4" />
                        }
                    </button>
                </div>
                <p className="text-white/20 text-xs text-center mt-2">AI can make mistakes. Verify important information.</p>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

            {modelPickerOpen && (
                <ModelPicker
                    selected={selectedModel}
                    apiKey={modelApiKey}
                    onSelect={(m, k) => { setSelectedModel(m); setModelApiKey(k); }}
                    onClose={() => setModelPickerOpen(false)}
                />
            )}
        </div>
    );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
    const [copied, setCopied] = useState(false);

    const copy = () => {
        navigator.clipboard.writeText(msg.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (msg.role === 'user') {
        return (
            <div className="flex justify-end">
                <div className="max-w-[80%] space-y-2">
                    {msg.image && (
                        <img src={msg.image} className="rounded-2xl max-h-48 object-cover ml-auto border border-white/10" />
                    )}
                    {msg.content && (
                        <div className="bg-white/10 border border-white/10 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white/90 leading-relaxed">
                            {msg.content}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-sm shrink-0 mt-0.5 shadow-lg shadow-violet-500/20">
                ✦
            </div>
            <div className="flex-1 min-w-0">
                {msg.loading ? (
                    <div className="flex items-center gap-2 py-2">
                        <div className="flex gap-1">
                            <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-white/30 text-xs">Thinking...</span>
                    </div>
                ) : (
                    <div className="group relative">
                        <div className="prose prose-invert prose-sm max-w-none
                            prose-headings:text-white prose-headings:font-semibold prose-headings:mb-2
                            prose-p:text-white/80 prose-p:leading-relaxed prose-p:my-1
                            prose-strong:text-white
                            prose-code:text-violet-300 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
                            prose-pre:bg-[#1a1a2e] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:my-3
                            prose-table:text-white/80 prose-th:text-white prose-th:border-white/20 prose-td:border-white/10 prose-thead:bg-white/5
                            prose-li:text-white/80 prose-li:my-0.5
                            prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
                            prose-blockquote:border-violet-500 prose-blockquote:text-white/60 prose-blockquote:bg-white/3 prose-blockquote:rounded-r-xl prose-blockquote:py-1
                            prose-hr:border-white/10
                        ">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.content}
                            </ReactMarkdown>
                        </div>
                        <button
                            onClick={copy}
                            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-white/50" />}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
