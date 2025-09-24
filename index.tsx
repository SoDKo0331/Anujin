import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Flower, Volume2, VolumeX, Play, Pause } from "lucide-react";

// Enhanced Type definitions with strict typing
interface VisibleSections {
  readonly [key: string]: boolean;
}

interface BaseAnimatedElement {
  readonly id: string;
  readonly x: number;
  readonly delay: number;
}

interface AnimatedElement extends BaseAnimatedElement {
  readonly rotation?: number;
}

interface ShootingStar extends BaseAnimatedElement {
  readonly top: number;
  readonly left: number;
  readonly duration: number;
}

interface StarWarsCharacter extends BaseAnimatedElement {
  readonly top: number;
  readonly left: number;
  readonly size: number;
  readonly animationDuration: number;
  readonly character: 'bb8' | 'yoda';
}

interface SectionConfig {
  readonly id: string;
  readonly text: string;
  readonly animation: 'translate-x' | 'translate-y' | 'scale';
  readonly isSignature?: boolean;
}

interface ParticleState {
  readonly roses: readonly AnimatedElement[];
  readonly smoke: readonly AnimatedElement[];
  readonly stars: readonly ShootingStar[];
  readonly starWarsCharacters: readonly StarWarsCharacter[];
}

interface UIState {
  readonly showContent: boolean;
  readonly isMuted: boolean;
  readonly isPlaying: boolean;
  readonly audioError: boolean;
}

type ParticleType = 'rose' | 'smoke' | 'star' | 'bb8' | 'yoda';
type AnimationType = 'translate-x' | 'translate-y' | 'scale';

// Constants with strict typing
const ANIMATION_CONFIG = {
  intervals: {
    roses: 3000,
    smoke: 1500,
    stars: 4000,
    starWars: 6000,
  },
  maxParticles: {
    roses: 8,
    smoke: 12,
    stars: 6,
    starWars: 4,
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

const STAR_WARS_CHARACTERS = {
  bb8: {
    size: 32,
    color: '#FF6B35',
    animationDuration: 12,
  },
  yoda: {
    size: 28,
    color: '#4ADE80',
    animationDuration: 15,
  },
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

@keyframes bb8-roll {
  0% { 
    transform: translate3d(-100px, 100vh, 0) rotate(0deg); 
    opacity: 0; 
  }
  10% { opacity: 0.8; }
  90% { opacity: 0.3; }
  100% { 
    transform: translate3d(calc(100vw + 100px), -50px, 0) rotate(720deg); 
    opacity: 0; 
  }
}

@keyframes yoda-float {
  0% { 
    transform: translate3d(calc(100vw + 50px), 80vh, 0) scale(1); 
    opacity: 0; 
  }
  15% { opacity: 0.7; }
  50% { transform: translate3d(50vw, 60vh, 0) scale(1.1); opacity: 0.8; }
  85% { opacity: 0.4; }
  100% { 
    transform: translate3d(-100px, 40vh, 0) scale(0.9); 
    opacity: 0; 
  }
}

@keyframes star-wars-glow {
  0%, 100% { filter: drop-shadow(0 0 8px currentColor); }
  50% { filter: drop-shadow(0 0 16px currentColor) drop-shadow(0 0 24px currentColor); }
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
`;

const ApologyLetter: React.FC = () => {
  // Enhanced state management with strict typing
  const [mounted, setMounted] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<VisibleSections>({});
  const [particles, setParticles] = useState<ParticleState>({
    roses: [],
    smoke: [],
    stars: [],
    starWarsCharacters: [],
  });
  const [ui, setUi] = useState<UIState>({
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

  // Enhanced particle generators with strict typing and Star Wars characters
  const generateParticle = useCallback((type: ParticleType): AnimatedElement | ShootingStar | StarWarsCharacter => {
    const baseId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const baseElement = {
      id: baseId,
      x: Math.random() * 90 + 5,
      delay: Math.random() * 3,
    };
    
    switch (type) {
      case 'rose':
        return {
          ...baseElement,
          rotation: Math.random() * 360,
        } as AnimatedElement;
        
      case 'smoke':
        return {
          ...baseElement,
          x: Math.random() * 20 + 75,
          delay: Math.random() * 2,
        } as AnimatedElement;
        
      case 'star':
        return {
          ...baseElement,
          top: Math.random() * 60,
          left: Math.random() * 100,
          delay: Math.random() * 10,
          duration: Math.random() * 3 + 2,
        } as ShootingStar;
        
      case 'bb8':
        return {
          ...baseElement,
          top: Math.random() * 40 + 40, // Keep BB-8 in lower portion
          left: -50, // Start off-screen
          size: STAR_WARS_CHARACTERS.bb8.size,
          animationDuration: STAR_WARS_CHARACTERS.bb8.animationDuration + Math.random() * 3,
          character: 'bb8',
        } as StarWarsCharacter;
        
      case 'yoda':
        return {
          ...baseElement,
          top: Math.random() * 30 + 30, // Keep Yoda in middle portion
          left: window.innerWidth + 50, // Start off-screen right
          size: STAR_WARS_CHARACTERS.yoda.size,
          animationDuration: STAR_WARS_CHARACTERS.yoda.animationDuration + Math.random() * 5,
          character: 'yoda',
        } as StarWarsCharacter;
        
      default:
        throw new Error(`Unknown particle type: ${type satisfies never}`);
    }
  }, []);

  // Star Wars character components
  const BB8Component: React.FC<{ size: number }> = React.memo(({ size }) => (
    <div className="relative" style={{ width: size, height: size }}>
      {/* BB-8 Body */}
      <div 
        className="absolute bottom-0 rounded-full border-2"
        style={{
          width: size * 0.8,
          height: size * 0.8,
          backgroundColor: '#F5F5F5',
          borderColor: '#FF6B35',
          left: '10%',
        }}
      >
        {/* BB-8 Body details */}
        <div 
          className="absolute rounded-full"
          style={{
            width: '30%',
            height: '30%',
            backgroundColor: '#FF6B35',
            top: '20%',
            left: '35%',
          }}
        />
        <div 
          className="absolute rounded-full border"
          style={{
            width: '15%',
            height: '15%',
            borderColor: '#333',
            top: '60%',
            left: '25%',
          }}
        />
      </div>
      {/* BB-8 Head */}
      <div 
        className="absolute rounded-full border-2"
        style={{
          width: size * 0.5,
          height: size * 0.5,
          backgroundColor: '#F5F5F5',
          borderColor: '#FF6B35',
          top: '-10%',
          left: '25%',
        }}
      >
        {/* BB-8 Eye */}
        <div 
          className="absolute rounded-full"
          style={{
            width: '25%',
            height: '25%',
            backgroundColor: '#333',
            top: '35%',
            left: '40%',
          }}
        />
      </div>
    </div>
  ));

  const YodaComponent: React.FC<{ size: number }> = React.memo(({ size }) => (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Yoda's robe */}
      <div 
        className="absolute bottom-0 rounded-t-full"
        style={{
          width: size * 0.9,
          height: size * 0.7,
          backgroundColor: '#8B4513',
          left: '5%',
        }}
      />
      {/* Yoda's head */}
      <div 
        className="absolute rounded-full"
        style={{
          width: size * 0.6,
          height: size * 0.5,
          backgroundColor: '#4ADE80',
          top: '15%',
          left: '20%',
        }}
      >
        {/* Yoda's ears */}
        <div 
          className="absolute rounded-full"
          style={{
            width: '20%',
            height: '40%',
            backgroundColor: '#4ADE80',
            top: '10%',
            left: '-5%',
            transform: 'rotate(-20deg)',
          }}
        />
        <div 
          className="absolute rounded-full"
          style={{
            width: '20%',
            height: '40%',
            backgroundColor: '#4ADE80',
            top: '10%',
            right: '-5%',
            transform: 'rotate(20deg)',
          }}
        />
        {/* Yoda's eyes */}
        <div 
          className="absolute rounded-full"
          style={{
            width: '12%',
            height: '12%',
            backgroundColor: '#333',
            top: '45%',
            left: '25%',
          }}
        />
        <div 
          className="absolute rounded-full"
          style={{
            width: '12%',
            height: '12%',
            backgroundColor: '#333',
            top: '45%',
            right: '25%',
          }}
        />
      </div>
      {/* Lightsaber */}
      <div 
        className="absolute"
        style={{
          width: '8%',
          height: size * 0.4,
          backgroundColor: '#4ADE80',
          top: '25%',
          right: '10%',
          borderRadius: '2px',
          boxShadow: '0 0 8px #4ADE80',
        }}
      />
    </div>
  ));

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

  // Optimized particle effects with Star Wars characters
  useEffect(() => {
    if (!mounted || !ui.showContent) return;

    const createParticleInterval = <T extends keyof ParticleState>(
      particleKey: T,
      particleType: ParticleType,
      interval: number,
      maxCount: number
    ): NodeJS.Timeout => {
      return setInterval(() => {
        setParticles(prev => ({
          ...prev,
          [particleKey]: [...prev[particleKey].slice(-maxCount + 1), generateParticle(particleType)]
        }));
      }, interval);
    };

    const intervals = [
      createParticleInterval('roses', 'rose', ANIMATION_CONFIG.intervals.roses, ANIMATION_CONFIG.maxParticles.roses),
      createParticleInterval('smoke', 'smoke', ANIMATION_CONFIG.intervals.smoke, ANIMATION_CONFIG.maxParticles.smoke),
      createParticleInterval('stars', 'star', ANIMATION_CONFIG.intervals.stars, ANIMATION_CONFIG.maxParticles.stars),
      createParticleInterval('starWarsCharacters', Math.random() < 0.5 ? 'bb8' : 'yoda', ANIMATION_CONFIG.intervals.starWars, ANIMATION_CONFIG.maxParticles.starWars),
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

      {/* Optimized Background Effects with Star Wars Characters */}
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
                transform: `rotate(${rose.rotation || 0}deg)` 
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

          {/* Star Wars Characters */}
          {particles.starWarsCharacters.map(character => (
            <div 
              key={character.id} 
              className="fixed pointer-events-none z-5 particle-element"
              style={{ 
                top: `${character.top}%`, 
                left: `${character.left}px`,
                animation: character.character === 'bb8' 
                  ? `bb8-roll ${character.animationDuration}s ease-in-out ${character.delay}s forwards`
                  : `yoda-float ${character.animationDuration}s ease-in-out ${character.delay}s forwards`,
                filter: `drop-shadow(0 0 8px ${character.character === 'bb8' ? '#FF6B35' : '#4ADE80'})`,
              }}
              aria-hidden="true"
            >
              <div 
                className="animate-pulse-slow"
                style={{ animation: "star-wars-glow 3s ease-in-out infinite" }}
              >
                {character.character === 'bb8' ? (
                  <BB8Component size={character.size} />
                ) : (
                  <YodaComponent size={character.size} />
                )}
              </div>
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
            className={`text-center mb-24 transition-all duration-[2500ms] ease-in-out ${
              isVisible.header 
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
                className={`transition-all duration-[2500ms] ease-in-out ${
                  isVisible[section.id]
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