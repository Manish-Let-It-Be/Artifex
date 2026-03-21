/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowRight, Calculator, Star, CheckCircle, 
    ArrowUpRight, Zap, Brain, Sparkles, 
    Globe, Menu, X 
} from 'lucide-react';

const navLinks = ['Home', 'About Us', 'Services', 'Works', 'Contact'];

export default function Landing() {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const yHero = useTransform(scrollYProgress, [0, 1], [0, 300]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="font-poppins bg-white text-gray-900 overflow-x-hidden selection:bg-arooth-blue selection:text-white">
            <Navbar navigate={navigate} />
            <Hero navigate={navigate} y={yHero} />
            <Marquee />
            <Stats />
            <Features />
            <Showcase />
            <FAQ />
            <Footer navigate={navigate} />
        </div>
    );
}

function Navbar({ navigate }: { navigate: any }) {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <motion.nav 
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-4 bg-white/90 backdrop-blur-md shadow-sm' : 'py-6 bg-transparent'}`}
            >
                <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-10 h-10 bg-arooth-blue rounded-full flex items-center justify-center">
                            <Calculator className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">CalcAI.</span>
                    </div>
                    
                    <div className="hidden md:flex items-center gap-1 p-2 bg-arooth-light/50 backdrop-blur-sm rounded-full border border-arooth-blue/10">
                        {navLinks.map((link) => (
                            <button key={link} className="px-6 py-2.5 rounded-full text-sm font-semibold text-gray-600 hover:text-arooth-blue hover:bg-white transition-all">
                                {link}
                            </button>
                        ))}
                    </div>

                    <div className="hidden md:flex">
                        <MagneticButton>
                            <button 
                                onClick={() => navigate('/app')}
                                className="group flex items-center gap-2 bg-arooth-blue text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-800 transition-colors shadow-lg shadow-arooth-blue/20"
                            >
                                View All Services
                                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-45 transition-transform">
                                    <ArrowUpRight className="w-3 h-3 text-white" />
                                </div>
                            </button>
                        </MagneticButton>
                    </div>

                    <button className="md:hidden p-2 text-gray-900" onClick={() => setMobileMenuOpen(true)}>
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </motion.nav>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-[100] bg-white p-6 flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-12">
                            <span className="text-xl font-bold">CalcAI.</span>
                            <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-gray-100 rounded-full">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex flex-col gap-6 text-2xl font-bold">
                            {navLinks.map(link => (
                                <a key={link} className="hover:text-arooth-blue transition-colors cursor-pointer">{link}</a>
                            ))}
                        </div>
                        <div className="mt-auto">
                            <button onClick={() => { setMobileMenuOpen(false); navigate('/app'); }} className="w-full bg-arooth-blue text-white py-4 rounded-full font-bold text-lg flex justify-center gap-2">
                                Get Started <ArrowRight className="w-6 h-6" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function MagneticButton({ children }: { children: React.ReactNode }) {
    return (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {children}
        </motion.div>
    );
}

function Hero({ navigate, y }: { navigate: any, y: any }) {
    return (
        <section className="relative pt-40 pb-20 px-6 md:px-12 overflow-hidden min-h-[90vh] flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-arooth-light/50 via-white to-white">
            <motion.div 
                style={{ y }}
                className="max-w-7xl mx-auto text-center relative z-10 w-full"
            >
                <div className="flex justify-center mb-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-arooth-light rounded-full text-arooth-blue font-semibold text-sm border border-arooth-blue/10"
                    >
                        <Star className="w-4 h-4 fill-arooth-blue" />
                        <span>The Future of Mathematics is Here</span>
                    </motion.div>
                </div>

                <motion.h1 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="text-[4rem] md:text-8xl lg:text-[10rem] font-bold tracking-tighter leading-[0.9] mb-8"
                >
                    CALC. <span className="text-arooth-blue italic pr-4">VISION.</span><br/>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 mt-2 md:mt-4">
                        <span>CREATE</span>
                        <div className="w-32 md:w-64 h-16 md:h-32 bg-gray-100 rounded-[100px] overflow-hidden relative shadow-inner mt-4 md:mt-0">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_340deg,#0040C1_360deg)] opacity-20"
                            />
                            <div className="absolute inset-1 bg-arooth-blue rounded-[100px] flex items-center justify-center overflow-hidden">
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 4, repeat: Infinity }}>
                                    <Sparkles className="w-8 md:w-16 h-8 md:h-16 text-white" />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </motion.h1>

                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
                >
                    At CalcAI, we blend advanced neural networks with intuitive strategy to build digital experiences that solve real-world problems.
                </motion.p>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex justify-center"
                >
                    <MagneticButton>
                        <button 
                            onClick={() => navigate('/app')}
                            className="group flex justify-between items-center bg-arooth-blue text-white pl-8 pr-2 py-2 rounded-full text-lg font-bold hover:bg-blue-800 transition-colors w-[260px] shadow-xl shadow-arooth-blue/30"
                        >
                            <span>Get Started Now</span>
                            <div className="w-12 h-12 bg-white text-arooth-blue rounded-full flex items-center justify-center group-hover:-rotate-45 transition-transform">
                                <ArrowUpRight className="w-6 h-6 text-arooth-blue" />
                            </div>
                        </button>
                    </MagneticButton>
                </motion.div>
            </motion.div>
        </section>
    );
}

function Marquee() {
    return (
        <div className="py-8 bg-arooth-blue overflow-hidden relative -rotate-2 scale-105 my-24 shadow-2xl z-10">
            <motion.div 
                animate={{ x: [0, -1035] }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="flex whitespace-nowrap gap-12 items-center"
            >
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center gap-12 text-white font-bold text-3xl md:text-5xl uppercase tracking-wider">
                        <span>Real Results</span>
                        <Star className="w-8 h-8 opacity-50 fill-white" />
                        <span>Modern</span>
                        <Star className="w-8 h-8 opacity-50 fill-white" />
                        <span>Innovative Design</span>
                        <Star className="w-8 h-8 opacity-50 fill-white" />
                    </div>
                ))}
            </motion.div>
        </div>
    );
}

function Stats() {
    return (
        <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-[1.1]">
                        Creative <br/> <span className="text-gray-400">vision &</span> <br/> strategy.
                    </h2>
                    <p className="text-xl text-gray-500 mb-12 max-w-md leading-relaxed">
                        At CalcAI, we blend advanced neural networks with intuitive design to build digital experiences that solve real-world problems.
                    </p>
                    <div className="grid grid-cols-2 gap-8 border-t border-gray-100 pt-8">
                        <div>
                            <h3 className="text-5xl font-bold text-arooth-blue mb-2">40<span className="text-3xl">+</span></h3>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Awards Won</p>
                        </div>
                        <div>
                            <h3 className="text-5xl font-bold text-arooth-blue mb-2">95<span className="text-3xl">%</span></h3>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Clients Satisfied</p>
                        </div>
                    </div>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="relative h-[600px] w-full rounded-[60px] bg-arooth-light overflow-hidden p-4"
                >
                    <div className="w-full h-full rounded-[48px] overflow-hidden relative">
                        <img src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2670&auto=format&fit=crop" alt="Abstract" className="w-full h-full object-cover mix-blend-multiply opacity-80" />
                        <div className="absolute inset-0 bg-gradient-to-t from-arooth-blue/90 via-arooth-blue/20 to-transparent flex items-end p-8 md:p-12">
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[32px] p-8 text-white max-w-sm w-full">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                                            <CheckCircle className="w-6 h-6 text-arooth-blue" />
                                        </div>
                                        <span className="font-bold text-xl tracking-tight">Strategy</span>
                                    </div>
                                    <span className="text-xs bg-white/20 px-4 py-2 rounded-full uppercase font-bold tracking-wider">Fast</span>
                                </div>
                                <p className="text-white/90 text-sm font-semibold leading-relaxed">Innovative approach fully integrated in &lt;50ms response times.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

function Features() {
    return (
        <section className="py-32 bg-arooth-light rounded-[60px] mx-4 md:mx-12 my-12 shadow-inner">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="text-center mb-24">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full text-arooth-blue font-bold text-sm mb-6 shadow-sm border border-gray-100"
                    >
                        <span>Our Services</span>
                    </motion.div>
                    <h2 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">Innovative Solutions.</h2>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto">Everything you need to build compelling products intelligently.</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8">
                    <FeatureCard 
                        icon={<Brain className="w-8 h-8"/>} 
                        title="Brand Identity" 
                        desc="Advanced machine learning reads your handwriting just like a human math teacher would."
                        index={0}
                    />
                    <FeatureCard 
                        icon={<Zap className="w-8 h-8"/>} 
                        title="UI/UX Strategy" 
                        desc="Don't just get the answer. Understand the methodology with detailed visual steps."
                        index={1}
                    />
                    <FeatureCard 
                        icon={<Globe className="w-8 h-8"/>} 
                        title="Digital Marketing" 
                        desc="No apps to install. Works flawlessly on any device straight from the browser."
                        index={2}
                    />
                </div>
            </div>
        </section>
    );
}

function FeatureCard({ icon, title, desc, index }: { icon: any, title: string, desc: string, index: number }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white p-12 rounded-[48px] shadow-sm border border-gray-100 group hover:shadow-2xl transition-all duration-500 cursor-pointer"
        >
            <div className="w-20 h-20 bg-arooth-light text-arooth-blue rounded-full mb-10 flex items-center justify-center group-hover:bg-arooth-blue group-hover:text-white transition-colors duration-500 shadow-sm group-hover:shadow-lg">
                {icon}
            </div>
            <h3 className="text-3xl font-bold mb-4 tracking-tight">{title}</h3>
            <p className="text-gray-500 text-lg leading-relaxed">{desc}</p>
            <div className="mt-10 flex items-center gap-2 text-arooth-blue font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-lg">View Details</span>
                <ArrowRight className="w-5 h-5 -rotate-45" />
            </div>
        </motion.div>
    );
}

function Showcase() {
    return (
        <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between md:items-end mb-20 gap-8">
                <h2 className="text-5xl md:text-7xl font-bold tracking-tight">Featured <br/> <span className="text-gray-400">Works.</span></h2>
                <button className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-full font-bold transition-colors w-max">
                    View All Services <ArrowUpRight className="w-5 h-5"/>
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-32">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="h-[600px] w-full rounded-[60px] relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-arooth-blue">
                        <img src="https://images.unsplash.com/photo-1543286386-2e659306cd6c?q=80&w=2670&auto=format&fit=crop" className="w-full h-full object-cover mix-blend-luminosity opacity-40 group-hover:scale-105 transition-transform duration-1000" alt="Work" />
                    </div>
                    <div className="absolute top-8 left-8 w-16 h-16 bg-white rounded-full flex items-center justify-center text-xl font-bold text-arooth-blue">01</div>
                </motion.div>
                <div className="md:pl-12">
                    <div className="flex gap-3 mb-8">
                        <span className="px-5 py-2 bg-gray-100 rounded-full text-sm font-bold uppercase tracking-wide">Web Design</span>
                        <span className="px-5 py-2 bg-gray-100 rounded-full text-sm font-bold uppercase tracking-wide">App</span>
                    </div>
                    <h3 className="text-5xl font-bold mb-6 tracking-tight">Brand Orbit</h3>
                    <p className="text-xl text-gray-500 mb-10 leading-relaxed font-medium">A distraction-free creative environment. Use your mouse, stylus, or finger to write naturally. Undo, redo, and adjust with ease.</p>
                    <button className="text-arooth-blue font-bold text-xl flex items-center gap-3 hover:gap-5 transition-all uppercase tracking-widest border-b-2 border-arooth-blue pb-2 w-max">
                        Explore <ArrowRight className="w-6 h-6"/>
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1 md:pr-12">
                    <div className="flex gap-3 mb-8">
                        <span className="px-5 py-2 bg-gray-100 rounded-full text-sm font-bold uppercase tracking-wide">Development</span>
                        <span className="px-5 py-2 bg-gray-100 rounded-full text-sm font-bold uppercase tracking-wide">UI/UX</span>
                    </div>
                    <h3 className="text-5xl font-bold mb-6 tracking-tight">Design Flow</h3>
                    <p className="text-xl text-gray-500 mb-10 leading-relaxed font-medium">Export your drawn equations directly to LaTeX format. Perfect for research papers, homework, and academic publishing natively.</p>
                    <button className="text-arooth-blue font-bold text-xl flex items-center gap-3 hover:gap-5 transition-all uppercase tracking-widest border-b-2 border-arooth-blue pb-2 w-max">
                        Explore <ArrowRight className="w-6 h-6"/>
                    </button>
                </div>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="h-[600px] w-full rounded-[60px] relative overflow-hidden group order-1 md:order-2"
                >
                    <div className="absolute inset-0 bg-gray-900">
                        <img src="https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=2670&auto=format&fit=crop" className="w-full h-full object-cover mix-blend-luminosity opacity-40 group-hover:scale-105 transition-transform duration-1000" alt="Work" />
                    </div>
                    <div className="absolute top-8 left-8 w-16 h-16 bg-white rounded-full flex items-center justify-center text-xl font-bold text-gray-900">02</div>
                </motion.div>
            </div>
        </section>
    );
}

function FAQ() {
    const faqs = [
        { q: "Is CalcAI free to use?", a: "Yes, the core drawing and calculation features focus on premium delivery and are completely free. We also offer a pro version." },
        { q: "What kind of math can it solve?", a: "From basic arithmetic and algebra to complex calculus, matrices, and differential equations visually." },
        { q: "Do I need to create an account?", a: "No account is required to start solving. Jump right in and begin drawing seamlessly." },
    ];
    
    return (
        <section className="py-32 px-6 md:px-12 max-w-4xl mx-auto">
            <div className="text-center mb-24">
                <h2 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">Common <span className="text-gray-400">Questions</span></h2>
            </div>
            <div className="space-y-6 flex flex-col items-center">
                {faqs.map((faq, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        key={i} 
                        className="bg-white p-8 md:p-12 rounded-[40px] border border-gray-200 hover:border-arooth-blue transition-colors w-full cursor-pointer group shadow-sm hover:shadow-xl"
                    >
                        <div className="flex justify-between items-center mb-6 gap-4">
                            <h4 className="text-2xl md:text-3xl font-bold group-hover:text-arooth-blue transition-colors">{faq.q}</h4>
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-arooth-blue group-hover:text-white transition-colors">
                                <ArrowRight className="w-6 h-6 rotate-45 group-hover:rotate-0 transition-transform" />
                            </div>
                        </div>
                        <p className="text-gray-500 text-lg md:text-xl font-medium leading-relaxed">{faq.a}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

function Footer({ navigate }: { navigate: any }) {
    return (
        <footer className="bg-arooth-blue text-white pt-32 pb-12 px-6 md:px-12 overflow-hidden mx-4 md:mx-12 mb-4 rounded-[60px]">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-40 flex flex-col items-center">
                    <h2 className="text-[4rem] md:text-[8rem] lg:text-[12rem] font-bold tracking-tighter leading-[0.8] mb-16">
                        PROJECT IN <br/><span className="italic text-white/50">MIND?</span>
                    </h2>
                    <MagneticButton>
                        <button onClick={() => navigate('/app')} className="bg-white text-arooth-blue px-12 py-6 rounded-full text-2xl font-bold hover:scale-105 transition-transform flex items-center gap-4 mx-auto shadow-2xl">
                            Let's Talk <ArrowUpRight className="w-8 h-8"/>
                        </button>
                    </MagneticButton>
                </div>
                
                <div className="grid md:grid-cols-4 gap-12 border-t border-white/20 pt-16">
                    <div className="col-span-2">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                                <Calculator className="w-6 h-6 text-arooth-blue" />
                            </div>
                            <span className="text-3xl font-bold tracking-tight">CalcAI.</span>
                        </div>
                        <p className="text-white/60 max-w-sm mb-12 text-lg font-medium">The most intuitive way to calculate. Built by Artifex for students, professionals, and visionaries.</p>
                        
                        <div className="flex flex-wrap gap-4">
                            <div className="px-8 py-4 bg-white/10 rounded-full font-bold uppercase tracking-wide text-sm hover:bg-white hover:text-arooth-blue transition-colors cursor-pointer backdrop-blur-sm">Facebook</div>
                            <div className="px-8 py-4 bg-white/10 rounded-full font-bold uppercase tracking-wide text-sm hover:bg-white hover:text-arooth-blue transition-colors cursor-pointer backdrop-blur-sm">Twitter</div>
                            <div className="px-8 py-4 bg-white/10 rounded-full font-bold uppercase tracking-wide text-sm hover:bg-white hover:text-arooth-blue transition-colors cursor-pointer backdrop-blur-sm">Dribbble</div>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-xl mb-8 uppercase tracking-widest text-white/50">Main Pages</h4>
                        <ul className="space-y-4 text-white font-bold text-lg">
                            <li className="hover:text-white/70 cursor-pointer transition-colors block">Home</li>
                            <li className="hover:text-white/70 cursor-pointer transition-colors block">About Us</li>
                            <li className="hover:text-white/70 cursor-pointer transition-colors block">Services</li>
                            <li className="hover:text-white/70 cursor-pointer transition-colors block">Works</li>
                            <li className="hover:text-white/70 cursor-pointer transition-colors block">Contact</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-xl mb-8 uppercase tracking-widest text-white/50">Utility Pages</h4>
                        <ul className="space-y-4 text-white font-bold text-lg">
                            <li className="hover:text-white/70 cursor-pointer transition-colors block">Style Guide</li>
                            <li className="hover:text-white/70 cursor-pointer transition-colors block">Changelog</li>
                            <li className="hover:text-white/70 cursor-pointer transition-colors block">Licenses</li>
                            <li className="hover:text-white/70 cursor-pointer transition-colors block">Password</li>
                            <li className="hover:text-white/70 cursor-pointer transition-colors block">404 Error</li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/20 mt-24 pt-8 flex flex-col md:flex-row justify-between items-center text-white/60 font-medium">
                    <p>© {new Date().getFullYear()} Artifex. All Rights Reserved.</p>
                    <p className="mt-4 md:mt-0">Designed inspired by Arooth. Developed by You.</p>
                </div>
            </div>
        </footer>
    );
}
