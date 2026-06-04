import { useState } from 'react';
import { X, Check, Key, ChevronDown, ChevronUp, Sparkles, Zap, Brain, Star, Lock } from 'lucide-react';

export interface ModelConfig {
    id: string;
    name: string;
    provider: 'Google' | 'OpenAI' | 'Anthropic' | 'Custom';
    description: string;
    pricing: string;
    pricingDetail?: string;
    priceUSD?: number;
    free: boolean;
    requiresKey: boolean;
    badge?: string;
    icon: React.ReactNode;
    color: string;
    features: string[];
}

export const MODELS: ModelConfig[] = [
    {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        provider: 'Google',
        description: 'Fast, capable, and free. Perfect for everyday math and equations.',
        pricing: 'Free',
        pricingDetail: 'No payment needed',
        free: true,
        requiresKey: false,
        badge: 'Default',
        icon: <Zap className="w-5 h-5" />,
        color: 'from-blue-500 to-cyan-400',
        features: ['Instant results', 'Step-by-step explanation', 'Image analysis'],
    },
    {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        provider: 'Google',
        description: 'Google\'s most powerful model. Handles complex calculus and proofs.',
        free: false,
        requiresKey: true,
        badge: 'Most Powerful',
        icon: <Sparkles className="w-5 h-5" />,
        color: 'from-violet-500 to-purple-400',
        features: ['Advanced reasoning', 'Complex equations', 'Deep explanations'],
    },
    {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'OpenAI',
        description: 'OpenAI\'s flagship multimodal model with top-tier vision.',
        pricing: '$2.50',
        pricingDetail: 'per 1M input tokens',
        free: false,
        requiresKey: true,
        icon: <Brain className="w-5 h-5" />,
        color: 'from-emerald-500 to-teal-400',
        features: ['Best-in-class vision', 'Detailed reasoning', 'Broad knowledge'],
    },
    {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'OpenAI',
        description: 'Affordable OpenAI vision model. Fast and surprisingly capable.',
        pricing: '$0.15',
        pricingDetail: 'per 1M input tokens',
        free: false,
        requiresKey: true,
        badge: 'Budget Pick',
        icon: <Zap className="w-5 h-5" />,
        color: 'from-green-500 to-emerald-400',
        features: ['Low cost', 'Fast responses', 'Good accuracy'],
    },
    {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        description: 'Anthropic\'s best model. Exceptional at structured reasoning.',
        pricing: '$3.00',
        pricingDetail: 'per 1M input tokens',
        free: false,
        requiresKey: true,
        badge: 'Best Reasoning',
        icon: <Star className="w-5 h-5" />,
        color: 'from-orange-500 to-amber-400',
        features: ['Superior reasoning', 'Clear explanations', 'Reliable outputs'],
    },
];

const PROVIDER_LOGO: Record<string, string> = {
    Google: 'G',
    OpenAI: '⊕',
    Anthropic: 'A',
    Custom: '✦',
};

interface Props {
    selected: ModelConfig;
    apiKey: string;
    onSelect: (model: ModelConfig, key: string) => void;
    onClose: () => void;
}

export default function ModelPicker({ selected, apiKey, onSelect, onClose }: Props) {
    const [pending, setPending] = useState<ModelConfig>(selected);
    const [keyInput, setKeyInput] = useState(apiKey);
    const [customOpen, setCustomOpen] = useState(false);
    const [customId, setCustomId] = useState('');
    const [customKey, setCustomKey] = useState('');
    const [keyError, setKeyError] = useState(false);

    // A model is "unlocked" if it's free, or if a key has been entered
    const isUnlocked = (model: ModelConfig) => !model.requiresKey || keyInput.trim().length > 0;

    // Can confirm if: custom mode with id+key filled, or selected model is unlocked
    const canConfirm = customOpen
        ? customId.trim().length > 0 && customKey.trim().length > 0
        : isUnlocked(pending);

    const handleSelectModel = (model: ModelConfig) => {
        setPending(model);
        setCustomOpen(false);
        setKeyError(false);
        // Reset key when switching providers
        if (model.provider !== pending.provider) setKeyInput('');
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
                description: 'User-provided model',
                pricing: 'Your pricing',
                free: false,
                requiresKey: true,
                icon: <Sparkles className="w-5 h-5" />,
                color: 'from-purple-500 to-pink-400',
                features: ['Custom model'],
            };
            onSelect(custom, customKey);
        } else {
            onSelect(pending, keyInput);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
                className="bg-[#0d0d0d] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                    <div>
                        <h2 className="text-white font-semibold text-base">Choose a model</h2>
                        <p className="text-white/40 text-xs mt-0.5">Free models work instantly. Paid models require your API key.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4 text-white/70" />
                    </button>
                </div>

                {/* Model grid */}
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto">
                    {MODELS.map(model => {
                        const active = pending.id === model.id && !customOpen;
                        const locked = model.requiresKey && keyInput.trim().length === 0;

                        return (
                            <button
                                key={model.id}
                                onClick={() => handleSelectModel(model)}
                                className={`relative text-left p-4 rounded-2xl border transition-all duration-200 group ${
                                    active
                                        ? 'border-white/30 bg-white/10'
                                        : locked
                                            ? 'border-white/5 bg-white/3 opacity-50 hover:opacity-70'
                                            : 'border-white/5 bg-white/5 hover:bg-white/8 hover:border-white/15'
                                }`}
                            >
                                {/* Active glow */}
                                {active && (
                                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${model.color} opacity-10 pointer-events-none`} />
                                )}

                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${model.color} flex items-center justify-center text-white shadow-lg ${locked ? 'grayscale' : ''}`}>
                                        {locked ? <Lock className="w-4 h-4" /> : model.icon}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {model.badge && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-medium">
                                                {model.badge}
                                            </span>
                                        )}
                                        {model.free && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/20">
                                                Free
                                            </span>
                                        )}
                                        {locked && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30 font-medium border border-white/10">
                                                Needs key
                                            </span>
                                        )}
                                        {active && !locked && (
                                            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                                                <Check className="w-3 h-3 text-black" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-1">
                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                        {PROVIDER_LOGO[model.provider]} {model.provider}
                                    </span>
                                </div>
                                <p className="text-white font-semibold text-sm leading-tight">{model.name}</p>
                                <p className="text-white/40 text-xs mt-1 leading-relaxed line-clamp-2">{model.description}</p>

                                <div className="mt-3 pt-3 border-t border-white/5">
                                    {locked ? (
                                        <span className="text-white/30 text-xs flex items-center gap-1">
                                            <Key className="w-3 h-3" /> Enter API key below to unlock
                                        </span>
                                    ) : (
                                        <span className="text-white/60 text-xs font-medium">
                                            {model.free ? 'Free to use' : (
                                                <><span className="text-white font-semibold">{model.pricing}</span> <span className="text-white/30">{model.pricingDetail}</span></>
                                            )}
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}

                    {/* Custom model card */}
                    <button
                        onClick={() => { setCustomOpen(o => !o); setKeyError(false); }}
                        className={`text-left p-4 rounded-2xl border transition-all duration-200 ${
                            customOpen
                                ? 'border-purple-500/40 bg-purple-500/10'
                                : 'border-dashed border-white/10 hover:border-white/20 hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold text-sm">Custom model</p>
                                    <p className="text-white/40 text-xs">Bring your own model ID + key</p>
                                </div>
                            </div>
                            {customOpen
                                ? <ChevronUp className="w-4 h-4 text-white/40" />
                                : <ChevronDown className="w-4 h-4 text-white/40" />
                            }
                        </div>
                    </button>
                </div>

                {/* Custom model inputs */}
                {customOpen && (
                    <div className="px-4 pb-2 space-y-2">
                        <input
                            type="text"
                            placeholder="Model ID  (e.g. gemini-2.0-flash, gpt-4o)"
                            value={customId}
                            onChange={e => { setCustomId(e.target.value); setKeyError(false); }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
                        />
                        <div className="relative">
                            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                            <input
                                type="password"
                                placeholder="API Key"
                                value={customKey}
                                onChange={e => { setCustomKey(e.target.value); setKeyError(false); }}
                                className={`w-full bg-white/5 border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 ${
                                    keyError && !customKey.trim()
                                        ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30'
                                        : 'border-white/10 focus:border-purple-500/50 focus:ring-purple-500/30'
                                }`}
                            />
                        </div>
                        {keyError && (!customId.trim() || !customKey.trim()) && (
                            <p className="text-red-400 text-xs pl-1">Both model ID and API key are required.</p>
                        )}
                    </div>
                )}

                {/* API key input for selected paid model */}
                {!customOpen && pending.requiresKey && (
                    <div className="px-4 pb-2">
                        <div className="relative">
                            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                            <input
                                type="password"
                                placeholder={`${pending.provider} API Key — required to use ${pending.name}`}
                                value={keyInput}
                                onChange={e => { setKeyInput(e.target.value); setKeyError(false); }}
                                className={`w-full bg-white/5 border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 ${
                                    keyError && !keyInput.trim()
                                        ? 'border-red-500/60 focus:border-red-500/50 focus:ring-red-500/30'
                                        : 'border-white/10 focus:border-blue-500/50 focus:ring-blue-500/30'
                                }`}
                            />
                        </div>
                        {keyError && !keyInput.trim() ? (
                            <p className="text-red-400 text-xs mt-1.5 pl-1 flex items-center gap-1">
                                <Lock className="w-3 h-3" /> An API key is required to use this model.
                            </p>
                        ) : (
                            <p className="text-white/25 text-xs mt-1.5 pl-1">Key is sent to your local backend only — never stored.</p>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="px-4 py-4 border-t border-white/10 flex items-center justify-between gap-3">
                    <div className="text-white/30 text-xs">
                        {!customOpen && (
                            pending.requiresKey && !keyInput.trim()
                                ? <span className="text-amber-400/70 flex items-center gap-1"><Lock className="w-3 h-3" /> Enter a key to unlock</span>
                                : <span>Using <span className="text-white/60 font-medium">{pending.name}</span></span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!canConfirm}
                            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                                canConfirm
                                    ? 'bg-white text-black hover:bg-white/90 cursor-pointer'
                                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                            }`}
                        >
                            {canConfirm ? 'Confirm' : 'Key required'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
