import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Flower, Volume2, VolumeX, Play, Pause } from "lucide-react";

// Type definitions
interface VisibleSections {
    [key: string]: boolean;
}
const BB8Icon: React.FC<{ className?: string; size?: number }> = ({ className, size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 100 100" fill="currentColor" className={className}>
        <circle cx="50" cy="65" r="35" stroke="currentColor" strokeWidth="4" fill="none" />
        <path d="M50,30 a25,15 0 0,1 0,-30 a25,15 0 0,1 0,30z" transform="translate(0, 15)" />
        <circle cx="50" cy="18" r="5" fill="black" />
        <circle cx="50" cy="65" r="15" stroke="currentColor" strokeWidth="2" fill="none" />
        <line x1="50" y1="0" x2="50" y2="10" stroke="currentColor" strokeWidth="2" />
    </svg>
);

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
interface AnimatedElement {
    id: string;
    x: number;
    delay: number;
    rotation?: number;
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

// Constants
const ANIMATION_CONFIG = {
    intervals: {
        roses: 3000,
        smoke: 1500,
        stars: 4000,
    },
    maxParticles: {
        roses: 8,
        smoke: 12,
        stars: 6,
    },
    durations: {
        intro: 4000,
        contentFade: 1500,
        sectionDelay: 300,
    },
} as const;

const INTERSECTION_CONFIG = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
} as const;

// Enhanced styles with better performance and accessibility
const styles = `
/* Optimized animations with will-change and transform3d for better performance */
@keyframes rose-float {
  0% { transform: translate3d(0, 120vh, 0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.7; }
  90% { opacity: 0.3; }
  100% { transform: translate3d(0, -300px, 0) rotate(720deg); opacity: 0; }
}

@keyframes smoke-rise {
  0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0; }
  15% { opacity: 0.4; }
  85% { opacity: 0.1; transform: scale(1.5); }
  100% { transform: translate3d(30px, -250px, 0) scale(2); opacity: 0; }
}

@keyframes shooting-star {
  0% { transform: translate3d(120vw, -120vh, 0) rotate(225deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 0.2; }
  100% { transform: translate3d(-120vw, 120vh, 0) rotate(225deg); opacity: 0; }
}

@keyframes pulse-slow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

@keyframes flower-intro {
  0% { transform: scale3d(0.3, 0.3, 1) rotate(0deg); opacity: 0; }
  20% { transform: scale3d(1.1, 1.1, 1) rotate(10deg); opacity: 1; }
  40% { transform: scale3d(1.2, 1.2, 1) rotate(15deg); }
  60% { transform: scale3d(0.95, 0.95, 1) rotate(-5deg); }
  80% { transform: scale3d(1.05, 1.05, 1) rotate(5deg); }
  100% { transform: scale3d(1, 1, 1) rotate(0deg); opacity: 0; }
}

@keyframes ripple {
  0% { transform: scale3d(0.2, 0.2, 1); opacity: 0.7; }
  50% { transform: scale3d(1.2, 1.2, 1); opacity: 0.3; }
  100% { transform: scale3d(2.5, 2.5, 1); opacity: 0; }
}

@keyframes intro-background {
  0% { 
    background: radial-gradient(circle at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 100%);
    transform: scale(0.8);
  }
  50% { 
    background: radial-gradient(circle at center, rgba(139,69,19,0.4) 0%, rgba(0,0,0,0.8) 70%);
    transform: scale(1.1);
  }
  100% { 
    background: radial-gradient(circle at center, rgba(139,69,19,0.2) 0%, rgba(0,0,0,0.9) 100%);
    transform: scale(1);
  }
}

@keyframes intro-glow {
  0%, 100% { 
    box-shadow: 0 0 50px rgba(255,255,255,0.2), inset 0 0 100px rgba(139,69,19,0.1); 
  }
  50% { 
    box-shadow: 0 0 100px rgba(255,255,255,0.4), inset 0 0 150px rgba(139,69,19,0.3); 
  }
}

@keyframes floating-petals {
  0% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-10px) rotate(120deg); }
  66% { transform: translateY(-5px) rotate(240deg); }
  100% { transform: translateY(0px) rotate(360deg); }
}

@keyframes content-fade {
  0% { opacity: 0; transform: translate3d(0, 30px, 0); }
  100% { opacity: 1; transform: translate3d(0, 0, 0); }
}

@keyframes text-glow {
  0%, 100% { text-shadow: 0 0 20px rgba(255, 255, 255, 0.3); }
  50% { text-shadow: 0 0 40px rgba(255, 255, 255, 0.6); }
}

@keyframes button-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.2); }
  50% { box-shadow: 0 0 30px rgba(255, 255, 255, 0.4); }
}

/* Performance optimizations */
.particle-element {
  will-change: transform, opacity;
  contain: layout style paint;
}

.shooting-star {
  position: fixed;
  width: 3px;
  height: 100px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.9), transparent);
  border-radius: 50%;
  opacity: 0;
  filter: blur(1px);
  pointer-events: none;
  will-change: transform, opacity;
}

/* Utility classes */
.animate-pulse-slow { 
  animation: pulse-slow 4s infinite ease-in-out; 
}

.animate-text-glow {
  animation: text-glow 3s infinite ease-in-out;
}

.animate-button-glow {
  animation: button-glow 2s infinite ease-in-out;
}

.bg-gradient-radial { 
  background: radial-gradient(circle at center, var(--tw-gradient-stops)); 
}

.shadow-glow { 
  box-shadow: 0 0 40px 15px rgba(255,255,255,0.35); 
  filter: drop-shadow(0 0 20px rgba(255,255,255,0.5));
}

.font-cursive { 
  font-family: 'Brush Script MT', 'Lucida Handwriting', cursive; 
}

.backdrop-blur-strong {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.glass-effect {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Enhanced responsive design */
@media (max-width: 768px) {
  .text-7xl { font-size: 2.5rem; line-height: 1.1; }
  .text-3xl { font-size: 1.25rem; }
  .text-xl { font-size: 0.95rem; }
  .leading-loose { line-height: 1.6; }
}

@media (max-width: 480px) {
  .text-7xl { font-size: 2rem; }
  .px-4 { padding-left: 1rem; padding-right: 1rem; }
}

/* Focus styles for accessibility */
button:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.8);
  outline-offset: 2px;
}
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

`;

const ApologyLetter: React.FC = () => {
    // State management with better organization
    const [mounted, setMounted] = useState(false);
    const [isVisible, setIsVisible] = useState<VisibleSections>({});
    const [particles, setParticles] = useState({
        roses: [] as AnimatedElement[],
        smoke: [] as AnimatedElement[],
        stars: [] as ShootingStar[],
    });
    const [ui, setUi] = useState({
        showContent: false,
        isMuted: true,
        isPlaying: false,
        audioError: false,
    });

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const intervalsRef = useRef<NodeJS.Timeout[]>([]);
    const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

    // Memoized section configuration
    const sections: SectionConfig[] = useMemo(() => [
        {
            id: "opening",
            text: `"You remind me of quiet moments after passion fades, of white roses in moonlight, delicate and pure..."`,
            animation: "translate-x"
        },
        {
            id: "apology1",
            text: `I know I've hurt you, and the weight of that reality sits heavy in my chest like smoke in still air. You are everything beautiful and tender in this world - like the softness that follows intimacy, like white roses that bloom against all odds in darkness.`,
            animation: "translate-y"
        },
        {
            id: "apology2",
            text: `I was careless with something precious. Your love feels like those perfect, quiet moments - raw, honest, beautiful. And I let my own flaws cast shadows on that purity.`,
            animation: "translate-x"
        },
        {
            id: "apology3",
            text: `You deserve love that feels like silk sheets and morning light, like the gentle burn of shared cigarettes and whispered confessions. You deserve someone who handles your heart like white roses - with reverence, with care, with wonder.`,
            animation: "translate-y"
        },
        {
            id: "promise",
            text: `I want to be better for you. To love you like you're poetry made flesh, like you're every beautiful thing I've ever wanted to touch but was afraid to break. Give me the chance to show you that kind of love - careful, devoted, real.`,
            animation: "scale"
        },
        {
            id: "signature",
            text: `With all my love,\nYour Devoted One`,
            animation: "translate-y",
            isSignature: true
        },
    ], []);

    // Optimized particle generators with better ID generation
    const generateParticle = useCallback((type: 'rose' | 'smoke' | 'star') => {
        const baseId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        switch (type) {
            case 'rose':
                return {
                    id: baseId,
                    x: Math.random() * 90 + 5,
                    delay: Math.random() * 3,
                    rotation: Math.random() * 360,
                };
            case 'smoke':
                return {
                    id: baseId,
                    x: Math.random() * 20 + 75,
                    delay: Math.random() * 2,
                };
            case 'star':
                return {
                    id: baseId,
                    top: Math.random() * 60,
                    left: Math.random() * 100,
                    delay: Math.random() * 10,
                    duration: Math.random() * 3 + 2,
                    x: 0,
                };
            default:
                throw new Error(`Unknown particle type: ${type}`);
        }
    }, []);

    // Enhanced audio controls with error handling
    const toggleAudio = useCallback(async () => {
        if (!audioRef.current || ui.audioError) return;

        try {
            if (ui.isPlaying) {
                audioRef.current.pause();
                setUi(prev => ({ ...prev, isPlaying: false }));
            } else {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    await playPromise;
                    setUi(prev => ({ ...prev, isPlaying: true, isMuted: false }));
                }
            }
        } catch (error) {
            console.warn('Audio playback failed:', error);
            setUi(prev => ({ ...prev, audioError: true }));
        }
    }, [ui.isPlaying, ui.audioError]);

    const toggleMute = useCallback(() => {
        if (!audioRef.current || ui.audioError) return;

        const newMutedState = !ui.isMuted;
        audioRef.current.muted = newMutedState;
        setUi(prev => ({ ...prev, isMuted: newMutedState }));
    }, [ui.isMuted, ui.audioError]);

    // Cleanup function with better memory management
    const cleanup = useCallback(() => {
        timeoutsRef.current.forEach(clearTimeout);
        intervalsRef.current.forEach(clearInterval);
        timeoutsRef.current = [];
        intervalsRef.current = [];

        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, []);

    // Mount effect
    useEffect(() => {
        setMounted(true);
        return cleanup;
    }, [cleanup]);

    // Content reveal timer with better state management
    useEffect(() => {
        if (!mounted) return;

        const timer = setTimeout(() => {
            setUi(prev => ({ ...prev, showContent: true }));
        }, ANIMATION_CONFIG.durations.intro);

        timeoutsRef.current.push(timer);

        return () => clearTimeout(timer);
    }, [mounted]);

    // Enhanced Intersection Observer setup
    useEffect(() => {
        if (!mounted || !ui.showContent) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                const updates: VisibleSections = {};
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        updates[entry.target.id] = true;
                        observerRef.current?.unobserve(entry.target);
                    }
                });

                if (Object.keys(updates).length > 0) {
                    setIsVisible(prev => ({ ...prev, ...updates }));
                }
            },
            INTERSECTION_CONFIG
        );

        const setupTimer = setTimeout(() => {
            const elements = document.querySelectorAll("[data-animate]");
            elements.forEach(el => {
                if (observerRef.current) {
                    observerRef.current.observe(el);
                }
            });
        }, 100);

        timeoutsRef.current.push(setupTimer);

        return () => {
            clearTimeout(setupTimer);
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [mounted, ui.showContent]);

    // Optimized particle effects with better performance
    useEffect(() => {
        if (!mounted || !ui.showContent) return;

        const createParticleInterval = (
            type: 'roses' | 'smoke' | 'stars',
            particleType: 'rose' | 'smoke' | 'star',
            interval: number,
            maxCount: number
        ) => {
            return setInterval(() => {
                setParticles(prev => ({
                    ...prev,
                    [type]: [...prev[type].slice(-maxCount + 1), generateParticle(particleType)]
                }));
            }, interval);
        };

        const intervals = [
            createParticleInterval('roses', 'rose', ANIMATION_CONFIG.intervals.roses, ANIMATION_CONFIG.maxParticles.roses),
            createParticleInterval('smoke', 'smoke', ANIMATION_CONFIG.intervals.smoke, ANIMATION_CONFIG.maxParticles.smoke),
            createParticleInterval('stars', 'star', ANIMATION_CONFIG.intervals.stars, ANIMATION_CONFIG.maxParticles.stars),
        ];

        intervalsRef.current = intervals;

        return () => intervals.forEach(clearInterval);
    }, [mounted, ui.showContent, generateParticle]);

    // Skip intro handler
    const handleSkipIntro = useCallback(() => {
        setUi(prev => ({ ...prev, showContent: true }));
    }, []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden relative font-serif">
            <audio
                ref={audioRef}
                loop
                muted={ui.isMuted}
                preload="metadata"
                onPlay={() => setUi(prev => ({ ...prev, isPlaying: true }))}
                onPause={() => setUi(prev => ({ ...prev, isPlaying: false }))}
                onError={() => setUi(prev => ({ ...prev, audioError: true }))}
                onLoadedData={() => setUi(prev => ({ ...prev, audioError: false }))}
            >
                <source src="https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3" type="audio/mpeg" />
                Your browser does not support the audio element.
            </audio>

            <style>{styles}</style>

            {/* Enhanced Audio Controls */}
            {ui.showContent && !ui.audioError && (
                <div className="fixed top-6 right-6 z-50 flex gap-3" role="toolbar" aria-label="Audio controls">
                    <button
                        onClick={toggleAudio}
                        className="p-3 glass-effect rounded-full hover:bg-white/20 transition-all duration-300 animate-button-glow group focus:outline-none focus:ring-2 focus:ring-white/50"
                        aria-label={ui.isPlaying ? "Pause background music" : "Play background music"}
                    >
                        {ui.isPlaying ? (
                            <Pause className="w-5 h-5 text-white/80 group-hover:text-white" />
                        ) : (
                            <Play className="w-5 h-5 text-white/80 group-hover:text-white" />
                        )}
                    </button>

                    {ui.isPlaying && (
                        <button
                            onClick={toggleMute}
                            className="p-3 glass-effect rounded-full hover:bg-white/20 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-white/50"
                            aria-label={ui.isMuted ? "Unmute background music" : "Mute background music"}
                        >
                            {ui.isMuted ? (
                                <VolumeX className="w-5 h-5 text-white/80 group-hover:text-white" />
                            ) : (
                                <Volume2 className="w-5 h-5 text-white/80 group-hover:text-white" />
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* Enhanced Intro Animation */}
            {!ui.showContent && (
                <div className="absolute inset-0 flex items-center justify-center z-50 bg-gradient-to-br from-gray-900 via-purple-900/20 to-black">
                    <div className="relative flex flex-col items-center justify-center text-center px-4">

                        {/* Main intro container with elegant background */}
                        <div
                            className="relative w-80 h-80 rounded-full flex items-center justify-center"
                            style={{
                                animation: "intro-background 4s ease-in-out forwards, intro-glow 4s ease-in-out infinite",
                                background: "radial-gradient(circle at center, rgba(139,69,19,0.3) 0%, rgba(0,0,0,0.8) 70%)",
                                backdropFilter: "blur(20px)"
                            }}
                        >
                            {/* Inner decorative circle */}
                            <div className="absolute inset-4 rounded-full border border-white/20 opacity-60"></div>
                            <div className="absolute inset-8 rounded-full border border-white/10 opacity-40"></div>

                            {/* Floating petals around the flower */}
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-4 h-4 opacity-30"
                                    style={{
                                        top: "20%",
                                        left: "50%",
                                        transformOrigin: "2px 120px",
                                        transform: `rotate(${i * 60}deg)`,
                                        animation: `floating-petals ${3 + i * 0.5}s ease-in-out infinite ${i * 0.3}s`
                                    }}
                                >
                                    <Flower className="text-white/60" size={16} />
                                </div>
                            ))}

                            {/* Main flower icon */}
                            <Flower
                                className="text-white relative z-10"
                                size={120}
                                style={{
                                    animation: "flower-intro 4s ease-in-out forwards",
                                    filter: "drop-shadow(0 0 20px rgba(255,255,255,0.5))"
                                }}
                                aria-hidden="true"
                            />

                            {/* Enhanced ripple effects */}
                            <div
                                className="absolute w-60 h-60 rounded-full border border-white/20 pointer-events-none"
                                style={{ animation: "ripple 3s ease-out infinite" }}
                                aria-hidden="true"
                            />
                            <div
                                className="absolute w-80 h-80 rounded-full border border-white/15 pointer-events-none"
                                style={{ animation: "ripple 4s ease-out infinite 1s" }}
                                aria-hidden="true"
                            />
                            <div
                                className="absolute w-96 h-96 rounded-full border border-white/10 pointer-events-none"
                                style={{ animation: "ripple 5s ease-out infinite 2s" }}
                                aria-hidden="true"
                            />
                        </div>

                        {/* Elegant title text */}
                        <div className="mt-12 text-center">
                            <h1 className="text-2xl md:text-4xl font-light text-white/90 mb-2 tracking-wider animate-text-glow">
                                A Letter of Love
                            </h1>
                            <p className="text-sm text-white/60 tracking-widest uppercase">
                                Loading...
                            </p>
                        </div>

                        <button
                            onClick={handleSkipIntro}
                            className="mt-8 text-white/70 hover:text-white text-sm glass-effect px-8 py-3 rounded-full hover:bg-white/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 animate-button-glow"
                        >
                            Skip Intro
                        </button>
                    </div>
                </div>
            )}

            {/* Optimized Background Effects */}
            {ui.showContent && (
                <>
                    {particles.stars.map(star => (
                        <div
                            key={star.id}
                            className="shooting-star particle-element"
                            style={{
                                top: `${star.top}%`,
                                left: `${star.left}%`,
                                animation: `shooting-star ${star.duration}s ease-in-out ${star.delay}s forwards`
                            }}
                            aria-hidden="true"
                        />
                    ))}

                    {particles.roses.map(rose => (
                        <div
                            key={rose.id}
                            className="fixed pointer-events-none z-0 particle-element"
                            style={{
                                left: `${rose.x}%`,
                                bottom: "-50px",
                                animation: `rose-float 15s ease-in-out ${rose.delay}s forwards`,
                                transform: `rotate(${rose.rotation}deg)`
                            }}
                            aria-hidden="true"
                        >
                            <Flower className="text-white opacity-50 drop-shadow-lg animate-pulse-slow" size={36} />
                        </div>
                    ))}

                    {particles.smoke.map(particle => (
                        <div
                            key={particle.id}
                            className="fixed pointer-events-none z-0 particle-element"
                            style={{
                                left: `${particle.x}%`,
                                bottom: "20%",
                                animation: `smoke-rise 10s ease-in-out ${particle.delay}s forwards`
                            }}
                            aria-hidden="true"
                        >
                            <div className="w-3 h-3 bg-white opacity-25 rounded-full blur-md" />
                        </div>
                    ))}

                    <div className="absolute inset-0 bg-gradient-radial from-white/5 via-transparent to-transparent pointer-events-none" aria-hidden="true" />
                </>
            )}

            {/* Enhanced Main Content */}
            {ui.showContent && (
                <main className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 py-20"
                    style={{ animation: `content-fade ${ANIMATION_CONFIG.durations.contentFade}ms ease-out forwards` }}>

                    {/* Enhanced Header */}
                    <header
                        id="header"
                        data-animate
                        className={`text-center mb-24 transition-all duration-[2500ms] ease-in-out ${isVisible.header
                                ? "opacity-100 translate-y-0 scale-100"
                                : "opacity-0 translate-y-20 scale-95"
                            }`}
                    >
                        <h1 className="text-4xl md:text-7xl font-extralight text-white mb-8 tracking-widest animate-text-glow">
                            Like Cigarettes After Sex
                        </h1>

                        <div className="flex justify-center items-center space-x-6 mb-6" aria-hidden="true">
                            <div className="w-12 md:w-24 h-px bg-white/50"></div>
                            <Flower className="text-white opacity-70 animate-pulse-slow" size={28} />
                            <div className="w-12 md:w-24 h-px bg-white/50"></div>
                        </div>

                        <h2 className="text-xl md:text-3xl font-extralight text-white/85 tracking-widest">
                            & White Roses
                        </h2>
                    </header>

                    {/* Enhanced Sections */}
                    <article className="space-y-10">
                        {sections.map((section, index) => (
                            <section
                                key={section.id}
                                id={section.id}
                                data-animate
                                className={`transition-all duration-[2500ms] ease-in-out ${isVisible[section.id]
                                        ? "opacity-100 translate-y-0 translate-x-0 scale-100"
                                        : section.animation === "translate-y"
                                            ? "opacity-0 translate-y-15"
                                            : section.animation === "translate-x"
                                                ? "opacity-0 -translate-x-15"
                                                : "opacity-0 scale-95"
                                    }`}
                                style={{ transitionDelay: `${index * ANIMATION_CONFIG.durations.sectionDelay}ms` }}
                            >
                                {section.isSignature ? (
                                    <footer className="text-center border-t border-white/30 pt-10 mt-16">
                                        <p className="text-lg text-white/70 italic font-light mb-2">
                                            With all my love,
                                        </p>
                                        <p className="text-2xl text-white/80 font-cursive">
                                            Your Devoted One
                                        </p>
                                    </footer>
                                ) : (
                                    <p className="text-lg md:text-xl text-white/85 leading-relaxed md:leading-loose font-extralight italic max-w-3xl mx-auto">
                                        {section.text}
                                    </p>
                                )}
                            </section>
                        ))}
                    </article>
                </main>
            )}
        </div>
    );
};

export default ApologyLetter;