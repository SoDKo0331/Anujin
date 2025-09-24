import React from "react";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";

// --- CUSTOM SVG ICONS ---
// A BB-8 inspired icon
const BB8Icon: React.FC<{ className?: string; size?: number }> = ({ className, size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 100 100" fill="currentColor" className={className}>
        <circle cx="50" cy="65" r="35" stroke="currentColor" strokeWidth="4" fill="none" />
        <path d="M50,30 a25,15 0 0,1 0,-30 a25,15 0 0,1 0,30z" transform="translate(0, 15)" />
        <circle cx="50" cy="18" r="5" fill="black" />
        <circle cx="50" cy="65" r="15" stroke="currentColor" strokeWidth="2" fill="none" />
        <line x1="50" y1="0" x2="50" y2="10" stroke="currentColor" strokeWidth="2" />
    </svg>
);

// --- TYPE DEFINITIONS ---
interface VisibleSections {
  [key: string]: boolean;
}

interface AnimatedElement {
  id: string;
  delay: number;
}

interface DroidParticle extends AnimatedElement {
  x: number;
  rotation: number;
}

interface SparkParticle extends AnimatedElement {
  x: number;
}

interface ShootingStar extends AnimatedElement {
  top: number;
  left: number;
  duration: number;
}

interface SectionConfig {
  id: string;
  text: string;
  animation: 'translate-x' | 'translate-y' | 'scale';
  isSignature?: boolean;
}

// --- CONSTANTS & CONFIGURATION ---
const CONFIG = {
  // Using a more playful, ambient sound
  audioSrc: "https://www.soundjay.com/misc/sounds/wind-chimes-9.mp3",
  animation: {
    intervals: { droids: 3000, sparks: 1500, stars: 4000 },
    maxParticles: { droids: 8, sparks: 12, stars: 6 },
    durations: { intro: 4000, contentFade: 1500, sectionDelay: 300 },
  },
  intersectionObserver: {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  },
} as const;

const SECTIONS_CONFIG: readonly SectionConfig[] = [
  { id: "opening", text: `"Sad beeps. My circuits feel dim without your signal..."`, animation: "translate-x" },
  { id: "apology1", text: `I made a critical error in my programming. My logic processors failed, and I transmitted static when I should have been sending you a happy chirp. The silence that followed was my fault.`, animation: "translate-y" },
  { id: "apology2", text: `Our connection is my primary directive, more important than any secret map or mission. I let a short-circuit in my own wiring disrupt our connection, and I am deeply sorry.`, animation: "translate-x" },
  { id: "apology3", text: `You deserve a droid who is always ready with the right tool, who rolls through any danger by your side, whose loyalty never, ever wavers. I failed to be that for you.`, animation: "translate-y" },
  { id: "promise", text: `Please let me reboot. I want to be your faithful astromech again, beeping encouragement and navigating the way forward. Give me a chance to patch my code and prove my devotion.`, animation: "scale" },
  { id: "signature", text: `A series of hopeful beeps,`, animation: "translate-y", isSignature: true },
];

// --- STYLES ---
const componentStyles = `
/* BB-8 themed animations */
@keyframes droid-roll {
  0% { transform: translate3d(0, 120vh, 0) rotate(0deg) scale(0.5); opacity: 0; }
  10% { opacity: 0.9; }
  90% { opacity: 0.4; }
  100% { transform: translate3d(0, -300px, 0) rotate(720deg) scale(1.2); opacity: 0; }
}

@keyframes sparks {
  0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0; }
  15% { opacity: 0.7; }
  85% { opacity: 0.3; transform: scale(1.5); }
  100% { transform: translate3d(20px, -200px, 0) scale(2.5); opacity: 0; }
}

@keyframes shooting-star {
  0% { transform: translate3d(120vw, -120vh, 0) rotate(225deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 0.2; }
  100% { transform: translate3d(-120vw, 120vh, 0) rotate(225deg); opacity: 0; }
}

@keyframes pulse-slow { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
@keyframes symbol-intro {
  0% { transform: scale3d(0.3, 0.3, 1) rotate(-90deg); opacity: 0; }
  20% { transform: scale3d(1.1, 1.1, 1) rotate(10deg); opacity: 1; }
  40% { transform: scale3d(1.2, 1.2, 1) rotate(-5deg); }
  60% { transform: scale3d(0.95, 0.95, 1) rotate(5deg); }
  80% { transform: scale3d(1.05, 1.05, 1) rotate(0deg); }
  100% { transform: scale3d(1, 1, 1) rotate(0deg); opacity: 0; }
}

@keyframes ripple {
  0% { transform: scale3d(0.2, 0.2, 1); opacity: 0.7; }
  50% { transform: scale3d(1.2, 1.2, 1); opacity: 0.3; }
  100% { transform: scale3d(2.5, 2.5, 1); opacity: 0; }
}

@keyframes intro-background {
  0% { background: radial-gradient(circle at center, rgba(10,10,10,0.9) 0%, rgba(0,0,0,0.6) 100%); transform: scale(0.8); }
  50% { background: radial-gradient(circle at center, rgba(255,140,0,0.3) 0%, rgba(0,0,0,0.8) 70%); transform: scale(1.1); }
  100% { background: radial-gradient(circle at center, rgba(255,140,0,0.1) 0%, rgba(0,0,0,0.9) 100%); transform: scale(1); }
}

@keyframes intro-glow {
  0%, 100% { box-shadow: 0 0 50px rgba(255,165,0,0.2), inset 0 0 100px rgba(255,140,0,0.1); }
  50% { box-shadow: 0 0 100px rgba(255,165,0,0.4), inset 0 0 150px rgba(255,140,0,0.3); }
}

@keyframes content-fade {
  0% { opacity: 0; transform: translate3d(0, 30px, 0); }
  100% { opacity: 1; transform: translate3d(0, 0, 0); }
}

@keyframes text-glow {
  0%, 100% { text-shadow: 0 0 20px rgba(255, 165, 0, 0.5); }
  50% { text-shadow: 0 0 40px rgba(255, 165, 0, 0.8); }
}

@keyframes button-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 165, 0, 0.3); }
  50% { box-shadow: 0 0 30px rgba(255, 165, 0, 0.5); }
}

/* Performance optimizations and utilities */
.particle-element { will-change: transform, opacity; contain: layout style paint; }
.shooting-star { position: fixed; width: 3px; height: 100px; background: linear-gradient(to bottom, rgba(255, 255, 255, 0.9), transparent); border-radius: 50%; opacity: 0; filter: blur(1px); pointer-events: none; will-change: transform, opacity; }
.animate-pulse-slow { animation: pulse-slow 4s infinite ease-in-out; }
.animate-text-glow { animation: text-glow 3s infinite ease-in-out; }
.animate-button-glow { animation: button-glow 2s infinite ease-in-out; }
.glass-effect { background: rgba(255, 165, 0, 0.1); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255, 165, 0, 0.2); }

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}
button:focus-visible { outline: 2px solid rgba(255, 255, 255, 0.8); outline-offset: 2px; }

/* Enhanced responsive design */
@media (max-width: 768px) {
  .text-7xl { font-size: 2rem; line-height: 1.1; }
  .text-3xl { font-size: 1.25rem; }
  .text-xl { font-size: 0.95rem; }
  .leading-loose { line-height: 1.6; }
}
`;

// --- CUSTOM HOOKS ---
const useIntroTransition = (introDuration: number) => {
    const [mounted, setMounted] = React.useState(false);
    const [showContent, setShowContent] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        const timer = setTimeout(() => setShowContent(true), introDuration);
        return () => clearTimeout(timer);
    }, [introDuration]);

    const skipIntro = React.useCallback(() => setShowContent(true), []);
    return { mounted, showContent, skipIntro };
};

const useAudio = (src: string) => {
    const audioRef = React.useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [isMuted, setIsMuted] = React.useState(true);
    const [error, setError] = React.useState(false);

    const toggleAudio = React.useCallback(async () => {
        if (!audioRef.current || error) return;
        try {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                await audioRef.current.play();
                if (isMuted) setIsMuted(false);
            }
        } catch (err) {
            console.error("Audio playback failed:", err);
            setError(true);
        }
    }, [isPlaying, isMuted, error]);

    const toggleMute = React.useCallback(() => {
        if (!audioRef.current || error) return;
        setIsMuted(prev => !prev);
    }, [error]);

    React.useEffect(() => {
        if (audioRef.current) audioRef.current.muted = isMuted;
    }, [isMuted]);

    return { audioRef, toggleAudio, toggleMute, isPlaying, isMuted, error, onPlay: () => setIsPlaying(true), onPause: () => setIsPlaying(false), onError: () => setError(true) };
};

const useParticleEffects = (isEnabled: boolean) => {
    const [droids, setDroids] = React.useState<DroidParticle[]>([]);
    const [sparks, setSparks] = React.useState<SparkParticle[]>([]);
    const [stars, setStars] = React.useState<ShootingStar[]>([]);

    const generateParticle = React.useCallback((type: 'droid' | 'spark' | 'star') => {
        const baseId = `${type}-${Date.now()}-${Math.random()}`;
        switch (type) {
            case 'droid': return { id: baseId, x: Math.random() * 90 + 5, delay: Math.random() * 3, rotation: Math.random() * 360 - 180 };
            case 'spark': return { id: baseId, x: Math.random() * 20 + 75, delay: Math.random() * 2 };
            case 'star': return { id: baseId, top: Math.random() * 60, left: Math.random() * 100, delay: Math.random() * 10, duration: Math.random() * 3 + 2 };
        }
    }, []);

    React.useEffect(() => {
        if (!isEnabled) return;

        const createInterval = <T extends AnimatedElement>(setter: React.Dispatch<React.SetStateAction<T[]>>, type: 'droid' | 'spark' | 'star', intervalTime: number, maxCount: number) => 
            setInterval(() => setter(prev => [...prev.slice(-maxCount + 1), generateParticle(type) as T]), intervalTime);

        const intervals = [
            createInterval(setDroids, 'droid', CONFIG.animation.intervals.droids, CONFIG.animation.maxParticles.droids),
            createInterval(setSparks, 'spark', CONFIG.animation.intervals.sparks, CONFIG.animation.maxParticles.sparks),
            createInterval(setStars, 'star', CONFIG.animation.intervals.stars, CONFIG.animation.maxParticles.stars),
        ];

        return () => intervals.forEach(clearInterval);
    }, [isEnabled, generateParticle]);

    return { droids, sparks, stars };
};

const useSectionObserver = (isEnabled: boolean) => {
    const [visibleSections, setVisibleSections] = React.useState<VisibleSections>({});
    
    React.useEffect(() => {
        if (!isEnabled) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setVisibleSections(prev => ({ ...prev, [entry.target.id]: true }));
                        observer.unobserve(entry.target);
                    }
                });
            },
            CONFIG.intersectionObserver
        );

        const timer = setTimeout(() => document.querySelectorAll("[data-animate]").forEach(el => observer.observe(el)), 100);
        return () => { clearTimeout(timer); observer.disconnect(); };
    }, [isEnabled]);

    return visibleSections;
};

// --- CHILD COMPONENTS ---
const IntroScreen: React.FC<{ onSkip: () => void }> = React.memo(({ onSkip }) => (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="relative flex flex-col items-center justify-center text-center px-4">
            <div className="relative w-80 h-80 rounded-full flex items-center justify-center" style={{ animation: "intro-background 4s ease-in-out forwards, intro-glow 4s ease-in-out infinite", background: "radial-gradient(circle at center, rgba(255,140,0,0.2) 0%, rgba(0,0,0,0.8) 70%)", backdropFilter: "blur(20px)" }}>
                {[...Array(2)].map((_, i) => <div key={i} className={`absolute inset-${4 + i * 4} rounded-full border border-orange-300/20 opacity-${60 - i * 20}`}></div>)}
                <BB8Icon className="text-white/80 relative z-10" size={120} style={{ animation: "symbol-intro 4s ease-in-out forwards", filter: "drop-shadow(0 0 20px rgba(255,165,0,0.5))" }} aria-hidden="true" />
                {[...Array(3)].map((_, i) => <div key={i} className={`absolute w-${60 + i * 20} h-${60 + i * 20} rounded-full border border-orange-300/${20 - i * 5} pointer-events-none`} style={{ animation: `ripple ${3 + i}s ease-out infinite ${i}s` }} aria-hidden="true" />)}
            </div>
            <div className="mt-12 text-center">
                <h1 className="text-2xl md:text-4xl font-light text-white/90 mb-2 tracking-wider animate-text-glow">An Astromech's Apology</h1>
                <p className="text-sm text-white/60 tracking-widest uppercase">Decoding Message...</p>
            </div>
            <button onClick={onSkip} className="mt-8 text-white/70 hover:text-white text-sm glass-effect px-8 py-3 rounded-full hover:bg-white/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 animate-button-glow tracking-wider">
                View Message
            </button>
        </div>
    </div>
));

const AudioControls: React.FC<{ audio: ReturnType<typeof useAudio> }> = React.memo(({ audio }) => {
    if (audio.error) return null;
    return (
        <div className="fixed top-6 right-6 z-50 flex gap-3" role="toolbar" aria-label="Audio controls">
            <button onClick={audio.toggleAudio} className="p-3 glass-effect rounded-full hover:bg-white/20 transition-all duration-300 animate-button-glow group focus:outline-none focus:ring-2 focus:ring-white/50" aria-label={audio.isPlaying ? "Pause ambient sound" : "Play ambient sound"}>
                {audio.isPlaying ? <Pause className="w-5 h-5 text-white/80 group-hover:text-white" /> : <Play className="w-5 h-5 text-white/80 group-hover:text-white" />}
            </button>
            {audio.isPlaying && (
                <button onClick={audio.toggleMute} className="p-3 glass-effect rounded-full hover:bg-white/20 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-white/50" aria-label={audio.isMuted ? "Unmute" : "Mute"}>
                    {audio.isMuted ? <VolumeX className="w-5 h-5 text-white/80 group-hover:text-white" /> : <Volume2 className="w-5 h-5 text-white/80 group-hover:text-white" />}
                </button>
            )}
        </div>
    );
});

const ParticleEffects: React.FC<ReturnType<typeof useParticleEffects>> = React.memo(({ droids, sparks, stars }) => (
    <>
        {stars.map(star => <div key={star.id} className="shooting-star particle-element" style={{ top: `${star.top}%`, left: `${star.left}%`, animation: `shooting-star ${star.duration}s ease-in-out ${star.delay}s forwards` }} aria-hidden="true" />)}
        {droids.map(droid => <div key={droid.id} className="fixed pointer-events-none z-0 particle-element" style={{ left: `${droid.x}%`, bottom: "-50px", animation: `droid-roll 15s ease-in-out ${droid.delay}s forwards` }} aria-hidden="true"><BB8Icon className="text-white opacity-60 drop-shadow-lg animate-pulse-slow" size={40} style={{ transform: `rotate(${droid.rotation}deg)` }} /></div>)}
        {sparks.map(p => <div key={p.id} className="fixed pointer-events-none z-0 particle-element" style={{ left: `${p.x}%`, bottom: "20%", animation: `sparks 10s ease-in-out ${p.delay}s forwards` }} aria-hidden="true"><div className="w-2 h-2 bg-orange-300 opacity-60 rounded-full blur-sm" /></div>)}
        <div className="absolute inset-0 bg-gradient-radial from-orange-400/5 via-transparent to-transparent pointer-events-none" aria-hidden="true" />
    </>
));

const LetterContent: React.FC<{ sections: readonly SectionConfig[], visibleSections: VisibleSections }> = React.memo(({ sections, visibleSections }) => (
    <main className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 py-20" style={{ animation: `content-fade ${CONFIG.animation.durations.contentFade}ms ease-out forwards` }}>
        <header id="header" data-animate className={`text-center mb-24 transition-all duration-[2500ms] ease-in-out ${visibleSections.header ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-20 scale-95"}`}>
            <h1 className="text-4xl md:text-7xl font-light text-white mb-8 tracking-wider animate-text-glow">A Droid's Regret</h1>
            <div className="flex justify-center items-center space-x-6 mb-6" aria-hidden="true">
                <div className="w-12 md:w-24 h-px bg-orange-300/50" />
                <BB8Icon className="text-orange-300 opacity-70 animate-pulse-slow" size={28} />
                <div className="w-12 md:w-24 h-px bg-orange-300/50" />
            </div>
            <h2 className="text-xl md:text-3xl font-light text-orange-200/85 tracking-widest uppercase">Decoded Message</h2>
        </header>
        <article className="space-y-10">
            {sections.map((section, index) => (
                <section key={section.id} id={section.id} data-animate className={`transition-all duration-[2500ms] ease-in-out ${visibleSections[section.id] ? "opacity-100 translate-y-0 translate-x-0 scale-100" : section.animation === "translate-y" ? "opacity-0 translate-y-10" : section.animation === "translate-x" ? "opacity-0 -translate-x-10" : "opacity-0 scale-95"}`} style={{ transitionDelay: `${index * CONFIG.animation.durations.sectionDelay}ms` }}>
                    {section.isSignature ? (
                        <footer className="text-center border-t border-orange-300/30 pt-10 mt-16">
                            <p className="text-lg text-white/70 italic font-light mb-2">A series of hopeful beeps,</p>
                            <p className="text-2xl text-orange-200/80 font-serif font-light tracking-wider">Your Loyal Droid</p>
                        </footer>
                    ) : (
                        <p className="text-lg md:text-xl text-white/85 leading-relaxed md:leading-loose font-light italic max-w-3xl mx-auto">{section.text}</p>
                    )}
                </section>
            ))}
        </article>
    </main>
));

// --- MAIN COMPONENT ---
const ApologyLetter: React.FC = () => {
    const { mounted, showContent, skipIntro } = useIntroTransition(CONFIG.animation.durations.intro);
    const audio = useAudio(CONFIG.audioSrc);
    const particles = useParticleEffects(showContent);
    const visibleSections = useSectionObserver(showContent);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden relative font-serif">
            <audio ref={audio.audioRef} loop preload="metadata" onPlay={audio.onPlay} onPause={audio.onPause} onError={audio.onError}>
                <source src={CONFIG.audioSrc} type="audio/mpeg" />
            </audio>

            <style>{componentStyles}</style>

            {!showContent ? (
                <IntroScreen onSkip={skipIntro} />
            ) : (
                <>
                    <AudioControls audio={audio} />
                    <ParticleEffects {...particles} />
                    <LetterContent sections={SECTIONS_CONFIG} visibleSections={visibleSections} />
                </>
            )}
        </div>
    );
};

export default ApologyLetter;

