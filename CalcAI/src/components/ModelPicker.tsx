import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    X, Check, Key, ChevronDown, ChevronUp, Sparkles, Zap, Brain, Star,
    Terminal, HardDrive, RefreshCw, Copy, AlertCircle, Globe
} from 'lucide-react';

export interface ModelConfig {
    id: string;
    name: string;
    provider: 'Google' | 'Ollama' | 'OpenAI' | 'Anthropic' | 'Custom';
    description: string;
    pricing?: string;
    pricingDetail?: string;
    priceUSD?: number;
    free: boolean;
    requiresKey: boolean;
    badge?: string;
    icon: React.ReactNode;
    color: string;
    features: string[];
    baseUrl?: string;
}

export const GEMINI_MODELS: ModelConfig[] = [
    {
        id: 'gemini-3.5-flash-lite',
        name: 'Gemini 3.5 Flash Lite',
        provider: 'Google',
        description: 'Fast, capable, and free. Perfect for everyday math, equations, and handwriting.',
        pricing: 'Free',
        pricingDetail: 'Default backend key',
        free: true,
        requiresKey: false,
        badge: 'Default',
        icon: <Zap className="w-5 h-5" />,
        color: 'from-blue-500 to-cyan-400',
        features: ['Instant results', 'Handwriting recognition', 'Step-by-step solving'],
    },
    {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        provider: 'Google',
        description: 'Google\'s advanced model for high-level calculus, physics proofs, and deep reasoning.',
        pricing: 'Pay-as-you-go',
        pricingDetail: 'Requires Google API key',
        free: false,
        requiresKey: true,
        badge: 'Advanced',
        icon: <Sparkles className="w-5 h-5" />,
        color: 'from-violet-500 to-purple-400',
        features: ['Deep reasoning', 'Complex calculus', 'Proofs & derivations'],
    },
];

export const OLLAMA_PRESET_MODELS: ModelConfig[] = [
    {
        id: 'llava',
        name: 'LLaVA 7B (Recommended)',
        provider: 'Ollama',
        description: 'The standard local vision-language model. Great at reading equations and math diagrams.',
        pricing: '100% Free',
        pricingDetail: 'Runs on your GPU/CPU',
        free: true,
        requiresKey: false,
        badge: 'Recommended',
        icon: <HardDrive className="w-5 h-5" />,
        color: 'from-emerald-500 to-teal-400',
        features: ['100% Offline & Private', 'Zero Rate Limits', 'Vision & OCR Support'],
        baseUrl: 'http://localhost:11434',
    },
    {
        id: 'llama3.2-vision',
        name: 'Llama 3.2 Vision (11B)',
        provider: 'Ollama',
        description: 'Meta\'s powerful multimodal model for high precision visual math reasoning.',
        pricing: '100% Free',
        pricingDetail: 'Requires ~8GB+ VRAM',
        free: true,
        requiresKey: false,
        badge: 'High Accuracy',
        icon: <Brain className="w-5 h-5" />,
        color: 'from-cyan-500 to-blue-500',
        features: ['High precision', 'Complex diagrams', 'Strong general math'],
        baseUrl: 'http://localhost:11434',
    },
    {
        id: 'minicpm-v',
        name: 'MiniCPM-V 2.6',
        provider: 'Ollama',
        description: 'Fast and lightweight vision model tailored for document and equation understanding.',
        pricing: '100% Free',
        pricingDetail: 'Low VRAM footprint',
        free: true,
        requiresKey: false,
        badge: 'Fast & Lightweight',
        icon: <Zap className="w-5 h-5" />,
        color: 'from-green-500 to-emerald-400',
        features: ['Fast inference', 'Low resource usage', 'Good equation OCR'],
        baseUrl: 'http://localhost:11434',
    },
];

export const THIRD_PARTY_MODELS: ModelConfig[] = [
    {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'OpenAI',
        description: 'OpenAI flagship multimodal model with top-tier vision and handwriting accuracy.',
        pricing: 'Pay-per-token',
        pricingDetail: 'Requires OpenAI key',
        free: false,
        requiresKey: true,
        badge: 'OpenAI Flagship',
        icon: <Brain className="w-5 h-5" />,
        color: 'from-emerald-500 to-teal-400',
        features: ['Best-in-class vision', 'Complex math proofs', 'Multi-step explanations'],
    },
    {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'OpenAI',
        description: 'Fast and very inexpensive vision model from OpenAI with strong math skills.',
        pricing: 'Affordable',
        pricingDetail: 'Requires OpenAI key',
        free: false,
        requiresKey: true,
        badge: 'Fast & Cheap',
        icon: <Zap className="w-5 h-5" />,
        color: 'from-green-500 to-emerald-400',
        features: ['Very fast', 'Cost effective', 'Good math precision'],
    },
    {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        description: 'Anthropic\'s top model with stellar structured thinking and math reasoning.',
        pricing: 'Pay-per-token',
        pricingDetail: 'Requires Anthropic key',
        free: false,
        requiresKey: true,
        badge: 'Best Reasoning',
        icon: <Star className="w-5 h-5" />,
        color: 'from-amber-500 to-orange-400',
        features: ['Structured reasoning', 'Precise LaTeX output', 'Clear explanations'],
    },
];

export const MODELS: ModelConfig[] = [
    ...GEMINI_MODELS,
    ...OLLAMA_PRESET_MODELS,
    ...THIRD_PARTY_MODELS,
];

interface OllamaStatusResponse {
    connected: boolean;
    url: string;
    models: string[];
    vision_models: string[];
    has_vision: boolean;
    recommended_model: string;
    error?: string;
}

interface Props {
    selected: ModelConfig;
    apiKey?: string;
    baseUrl?: string;
    onSelect: (model: ModelConfig, key: string, baseUrl?: string) => void;
    onClose: () => void;
}

export default function ModelPicker({ selected, apiKey = '', baseUrl = '', onSelect, onClose }: Props) {
    // Determine active tab based on selected model
    const initialTab = selected.provider === 'Ollama' 
        ? 'ollama' 
        : (selected.provider === 'Google' ? 'gemini' : 'thirdparty');

    const [activeTab, setActiveTab] = useState<'gemini' | 'ollama' | 'thirdparty'>(initialTab);
    const [pending, setPending] = useState<ModelConfig>(selected);
    const [keyInput, setKeyInput] = useState(apiKey);
    const [ollamaBaseUrl, setOllamaBaseUrl] = useState(baseUrl || 'http://localhost:11434');

    // Ollama live status
    const [ollamaStatus, setOllamaStatus] = useState<OllamaStatusResponse | null>(null);
    const [isCheckingOllama, setIsCheckingOllama] = useState(false);
    const [copiedCmd, setCopiedCmd] = useState(false);

    // Custom model state
    const [customOpen, setCustomOpen] = useState(selected.provider === 'Custom');
    const [customId, setCustomId] = useState(selected.provider === 'Custom' ? selected.id : '');
    const [customKey, setCustomKey] = useState(apiKey);
    const [customEndpoint, setCustomEndpoint] = useState(baseUrl);
    const [keyError, setKeyError] = useState(false);

    // Fetch Ollama status
    const fetchOllamaStatus = async (urlToTest = ollamaBaseUrl) => {
        setIsCheckingOllama(true);
        try {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8900';
            const res = await axios.get(`${apiBase}/ollama/status?url=${encodeURIComponent(urlToTest)}`, { timeout: 4000 });
            setOllamaStatus(res.data);
        } catch {
            setOllamaStatus({
                connected: false,
                url: urlToTest,
                models: [],
                vision_models: [],
                has_vision: false,
                recommended_model: 'llava',
                error: 'Could not connect to Ollama backend'
            });
        } finally {
            setIsCheckingOllama(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'ollama') {
            fetchOllamaStatus();
        }
    }, [activeTab]);

    const copyCommand = (cmd: string) => {
        navigator.clipboard.writeText(cmd);
        setCopiedCmd(true);
        setTimeout(() => setCopiedCmd(false), 2000);
    };

    const isUnlocked = (model: ModelConfig) => {
        if (model.provider === 'Ollama') return true;
        if (model.free) return true;
        return keyInput.trim().length > 0;
    };

    const canConfirm = customOpen
        ? customId.trim().length > 0
        : isUnlocked(pending);

    const handleSelectModel = (model: ModelConfig) => {
        setPending(model);
        setCustomOpen(false);
        setKeyError(false);
    };

    const handleConfirm = () => {
        if (!canConfirm) {
            setKeyError(true);
            return;
        }

        if (customOpen && customId.trim()) {
            const custom: ModelConfig = {
                id: customId.trim(),
                name: customId.trim(),
                provider: 'Custom',
                description: 'Custom OpenAI-compatible model',
                free: false,
                requiresKey: customKey.trim().length > 0,
                icon: <Sparkles className="w-5 h-5" />,
                color: 'from-purple-500 to-pink-400',
                features: ['Custom provider'],
                baseUrl: customEndpoint.trim() || undefined,
            };
            onSelect(custom, customKey.trim(), customEndpoint.trim() || undefined);
        } else {
            const usedBaseUrl = pending.provider === 'Ollama' ? ollamaBaseUrl.trim() : undefined;
            onSelect(pending, keyInput.trim(), usedBaseUrl);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div
                className="bg-[#121217] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">⚙️</span>
                            <h2 className="text-white font-bold text-lg tracking-tight">AI Model & Provider Settings</h2>
                        </div>
                        <p className="text-white/40 text-xs mt-1">
                            Choose between Google Gemini, local offline Ollama models, or your own API keys.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="px-6 pt-4 border-b border-white/10 bg-white/[0.02]">
                    <div className="grid grid-cols-3 gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
                        <button
                            onClick={() => { setActiveTab('gemini'); setCustomOpen(false); }}
                            className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                                activeTab === 'gemini'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>1. Gemini API</span>
                        </button>

                        <button
                            onClick={() => { 
                                setActiveTab('ollama'); 
                                setCustomOpen(false);
                                if (pending.provider !== 'Ollama') {
                                    setPending(OLLAMA_PRESET_MODELS[0]);
                                }
                            }}
                            className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all relative ${
                                activeTab === 'ollama'
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <HardDrive className="w-3.5 h-3.5" />
                            <span>2. Ollama Local</span>
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab('thirdparty')}
                            className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                                activeTab === 'thirdparty'
                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Key className="w-3.5 h-3.5" />
                            <span>3. Third Party</span>
                        </button>
                    </div>
                </div>

                {/* Tab Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">

                    {/* TAB 1: GEMINI */}
                    {activeTab === 'gemini' && (
                        <div className="space-y-4">
                            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs flex items-center justify-between">
                                <div>
                                    <span className="font-semibold text-blue-100">Ready to use:</span> Default key is pre-configured on the backend.
                                </div>
                                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-[10px]">
                                    Cloud API
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {GEMINI_MODELS.map(model => {
                                    const active = pending.id === model.id && !customOpen;
                                    return (
                                        <button
                                            key={model.id}
                                            onClick={() => handleSelectModel(model)}
                                            className={`p-4 rounded-2xl border text-left transition-all relative ${
                                                active
                                                    ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                                                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${model.color} flex items-center justify-center text-white shadow-md`}>
                                                    {model.icon}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {model.badge && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-medium">
                                                            {model.badge}
                                                        </span>
                                                    )}
                                                    {active && (
                                                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                                            <Check className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <h3 className="text-white font-semibold text-sm">{model.name}</h3>
                                            <p className="text-white/50 text-xs mt-1 line-clamp-2">{model.description}</p>
                                            
                                            <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center text-[11px] text-white/40">
                                                <span>{model.pricing}</span>
                                                <span className="text-white/60">{model.pricingDetail}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Optional custom Gemini key */}
                            <div className="pt-2">
                                <label className="text-xs text-white/50 block mb-1.5">
                                    Custom Gemini API Key (Optional — leave blank to use server default)
                                </label>
                                <div className="relative">
                                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <input
                                        type="password"
                                        placeholder="AIzaSy... (optional)"
                                        value={keyInput}
                                        onChange={e => setKeyInput(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: OLLAMA LOCAL (OPTION 2) */}
                    {activeTab === 'ollama' && (
                        <div className="space-y-4">
                            {/* Live Ollama Connection Banner */}
                            <div className={`p-4 rounded-2xl border transition-all ${
                                ollamaStatus?.connected 
                                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                                    : 'bg-amber-500/10 border-amber-500/30'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-3 h-3 rounded-full ${
                                            ollamaStatus?.connected ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-amber-500 animate-pulse'
                                        }`} />
                                        <div>
                                            <h4 className="text-sm font-semibold text-white">
                                                {ollamaStatus?.connected 
                                                    ? 'Ollama Service Detected & Running' 
                                                    : 'Ollama is Not Detected'}
                                            </h4>
                                            <p className="text-xs text-white/50 mt-0.5">
                                                Endpoint: <span className="font-mono text-white/70">{ollamaBaseUrl}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => fetchOllamaStatus()}
                                        disabled={isCheckingOllama}
                                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors flex items-center gap-1.5 text-xs"
                                        title="Check status again"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${isCheckingOllama ? 'animate-spin' : ''}`} />
                                        <span>Refresh</span>
                                    </button>
                                </div>

                                {/* Vision model warning if no vision model is installed */}
                                {ollamaStatus?.connected && !ollamaStatus.has_vision && (
                                    <div className="mt-3 pt-3 border-t border-emerald-500/20 text-xs">
                                        <div className="flex items-start gap-2 text-amber-300 mb-2">
                                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                            <span>
                                                Ollama is active, but you have not downloaded a <strong>vision model</strong> yet. 
                                                CalcAI requires a vision model to recognize your math drawings.
                                            </span>
                                        </div>

                                        <div className="bg-black/60 rounded-xl p-3 border border-white/10 flex items-center justify-between font-mono text-emerald-400 text-xs">
                                            <span>ollama run llava</span>
                                            <button
                                                onClick={() => copyCommand('ollama run llava')}
                                                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 text-[11px] font-sans transition-colors"
                                            >
                                                {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                                <span>{copiedCmd ? 'Copied!' : 'Copy Command'}</span>
                                            </button>
                                        </div>
                                        <p className="text-[11px] text-white/40 mt-1.5">
                                            Open PowerShell/Command Prompt and run the command above to download <strong>llava</strong> (~4.7 GB).
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Preset Ollama Vision Models */}
                            <div>
                                <label className="text-xs font-semibold text-white/70 block mb-2">
                                    Choose Ollama Vision Model:
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    {OLLAMA_PRESET_MODELS.map(model => {
                                        const active = pending.id === model.id && !customOpen;
                                        const isInstalled = ollamaStatus?.models?.some(m => m.startsWith(model.id));

                                        return (
                                            <button
                                                key={model.id}
                                                onClick={() => handleSelectModel(model)}
                                                className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                                                    active
                                                        ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                                                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${model.color} flex items-center justify-center text-white shadow-sm`}>
                                                        {model.icon}
                                                    </div>
                                                    {isInstalled ? (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">
                                                            Installed
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">
                                                            Needs pull
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-white font-semibold text-xs leading-snug">{model.name}</h4>
                                                <p className="text-white/40 text-[11px] mt-1 line-clamp-2">{model.description}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Or Custom Model ID / Name in Ollama */}
                            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/70 font-medium">Or type another Ollama model name:</span>
                                    {ollamaStatus?.models && ollamaStatus.models.length > 0 && (
                                        <span className="text-[11px] text-white/40">
                                            {ollamaStatus.models.length} models on machine
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="e.g. qwen2.5-vl, bakllava, llava:13b"
                                        value={pending.provider === 'Ollama' ? pending.id : ''}
                                        onChange={e => {
                                            const newId = e.target.value.trim();
                                            setPending({
                                                id: newId,
                                                name: `Ollama: ${newId}`,
                                                provider: 'Ollama',
                                                description: 'Custom local Ollama model',
                                                free: true,
                                                requiresKey: false,
                                                icon: <HardDrive className="w-5 h-5" />,
                                                color: 'from-emerald-500 to-teal-400',
                                                features: ['Local Ollama Model'],
                                                baseUrl: ollamaBaseUrl,
                                            });
                                        }}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>

                                {/* Custom Ollama Host URL */}
                                <div>
                                    <label className="text-[11px] text-white/40 block mb-1">
                                        Ollama Server URL (default: http://localhost:11434):
                                    </label>
                                    <input
                                        type="text"
                                        value={ollamaBaseUrl}
                                        onChange={e => setOllamaBaseUrl(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white/80 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Advantage Callout */}
                            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-[11px] text-white/50 flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>No Gemini API rate limits, no quota errors, and completely private on your PC.</span>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: THIRD PARTY (OPENAI / ANTHROPIC / CUSTOM) */}
                    {activeTab === 'thirdparty' && (
                        <div className="space-y-4">
                            <div className="p-3.5 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-200 text-xs">
                                <strong>Bring Your Own Key (BYOK):</strong> Keys are used locally to communicate with OpenAI or Anthropic directly from your local server.
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {THIRD_PARTY_MODELS.map(model => {
                                    const active = pending.id === model.id && !customOpen;
                                    return (
                                        <button
                                            key={model.id}
                                            onClick={() => handleSelectModel(model)}
                                            className={`p-3.5 rounded-2xl border text-left transition-all ${
                                                active
                                                    ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/10'
                                                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${model.color} flex items-center justify-center text-white`}>
                                                    {model.icon}
                                                </div>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                                                    {model.provider}
                                                </span>
                                            </div>
                                            <h4 className="text-white font-semibold text-xs">{model.name}</h4>
                                            <p className="text-white/40 text-[11px] mt-1 line-clamp-2">{model.description}</p>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* API Key input for selected paid model */}
                            {!customOpen && (
                                <div className="pt-2">
                                    <label className="text-xs text-white/70 block mb-1.5 flex items-center justify-between">
                                        <span>{pending.provider} API Key:</span>
                                        <span className="text-amber-400 text-[10px]">Required</span>
                                    </label>
                                    <div className="relative">
                                        <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                        <input
                                            type="password"
                                            placeholder={`sk-... (${pending.provider} API Key)`}
                                            value={keyInput}
                                            onChange={e => { setKeyInput(e.target.value); setKeyError(false); }}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-violet-500"
                                        />
                                    </div>
                                    {keyError && !keyInput.trim() && (
                                        <p className="text-red-400 text-xs mt-1">Please enter an API key to proceed.</p>
                                    )}
                                </div>
                            )}

                            {/* Custom OpenAI-compatible option */}
                            <div className="pt-2 border-t border-white/10">
                                <button
                                    onClick={() => setCustomOpen(!customOpen)}
                                    className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition-colors"
                                >
                                    <div className="flex items-center gap-2 text-xs font-semibold text-white">
                                        <Globe className="w-4 h-4 text-violet-400" />
                                        <span>Custom OpenAI-Compatible Endpoint (Groq, OpenRouter, LM Studio)</span>
                                    </div>
                                    {customOpen ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
                                </button>

                                {customOpen && (
                                    <div className="mt-3 p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                                        <div>
                                            <label className="text-[11px] text-white/50 block mb-1">Base URL:</label>
                                            <input
                                                type="text"
                                                placeholder="https://openrouter.ai/api/v1 or http://localhost:1234/v1"
                                                value={customEndpoint}
                                                onChange={e => setCustomEndpoint(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-white/20 focus:outline-none focus:border-violet-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] text-white/50 block mb-1">Model ID:</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. meta-llama/llama-3.2-11b-vision-instruct"
                                                value={customId}
                                                onChange={e => setCustomId(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-violet-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] text-white/50 block mb-1">API Key:</label>
                                            <input
                                                type="password"
                                                placeholder="API Key (if required by endpoint)"
                                                value={customKey}
                                                onChange={e => setCustomKey(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-violet-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-white/10 bg-white/[0.01] flex items-center justify-between">
                    <div className="text-xs text-white/50">
                        Selected: <span className="font-semibold text-white">{customOpen ? customId || 'Custom' : pending.name}</span>
                        <span className="ml-2 text-white/30 font-mono">({pending.provider})</span>
                    </div>

                    <div className="flex gap-2.5">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!canConfirm}
                            className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all shadow-md ${
                                canConfirm
                                    ? 'bg-white text-black hover:bg-white/90 cursor-pointer shadow-white/20'
                                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                            }`}
                        >
                            {canConfirm ? 'Apply Model' : 'Key Required'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
