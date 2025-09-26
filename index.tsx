import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Flower, Volume2, VolumeX } from "lucide-react";

// --- TYPE DEFINITIONS ---
interface VisibleSections {
  [key: string]: boolean;
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

interface AudioState {
  readonly mainAudio: HTMLAudioElement | null;
  readonly introAudio: HTMLAudioElement | null;
  readonly isMuted: boolean;
  readonly isIntroPlaying: boolean;
  readonly isMainPlaying: boolean;
  readonly audioError: boolean;
}

type ParticleType = 'rose' | 'smoke' | 'star' | 'bb8' | 'yoda';
type AnimationType = 'translate-x' | 'translate-y' | 'scale';

// --- CONSTANTS & CONFIGURATION ---
const CONFIG = {
  audio: {
    mainSrc: "./cry.mp3",
    introSrc: "./cry.mp3", // Placeholder - you can replace with your intro music
    fallbackSrc: "./cry.mp3", // Fallback audio source
  },
  animation: {
    intervals: { roses: 3000, smoke: 1500, stars: 4000, starWars: 6000 },
    maxParticles: { roses: 8, smoke: 12, stars: 6, starWars: 4 },
    durations: { intro: 4000, contentFade: 1500, sectionDelay: 300 },
  },
  intersectionObserver: {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  },
  starWarsCharacters: {
    bb8: { size: 32, color: '#FF6B35', animationDuration: 12 },
    yoda: { size: 28, color: '#4ADE80', animationDuration: 15 },
  },
} as const;

const SECTIONS_CONFIG: readonly SectionConfig[] = [
  {
    id: "opening",
    text: `"You remind me of quiet moments after passion fades, of white roses in moonlight, delicate and pure..."`,
    animation: "translate-x",
  },
  {
    id: "apology1",
    text: `I know I've hurt you, and the weight of that reality sits heavy in my chest like smoke in still air. You are everything beautiful and tender in this world - like the softness that follows intimacy, like white roses that bloom against all odds in darkness.`,
    animation: "translate-y",
  },
  {
    id: "apology2",
    text: `I was careless with something precious. Your love feels like those perfect, quiet moments - raw, honest, beautiful. And I let my own flaws cast shadows on that purity.`,
    animation: "translate-x",
  },
  {
    id: "apology3",
    text: `You deserve love that feels like silk sheets and morning light, like the gentle burn of shared cigarettes and whispered confessions. You deserve someone who handles your heart like white roses - with reverence, with care, with wonder.`,
    animation: "translate-y",
  },
  {
    id: "promise",
    text: `I want to be better for you. To love you like you're poetry made flesh, like you're every beautiful thing I've ever wanted to touch but was afraid to break. Give me the chance to show you that kind of love - careful, devoted, real.`,
    animation: "scale",
  },
  {
    id: "signature",
    text: `With all my love,\nYour Devoted Droid`,
    animation: "translate-y",
    isSignature: true,
  },
];

// --- STYLES ---
const componentStyles = `
/* Animations */
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

@keyframes bb8-roll {
  0% { transform: translate3d(-100px, 100vh, 0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.8; }
  90% { opacity: 0.3; }
  100% { transform: translate3d(calc(100vw + 100px), -50px, 0) rotate(720deg); opacity: 0; }
}

@keyframes yoda-float {
  0% { transform: translate3d(calc(100vw + 50px), 80vh, 0) scale(1); opacity: 0; }
  15% { opacity: 0.7; }
  50% { transform: translate3d(50vw, 60vh, 0) scale(1.1); opacity: 0.8; }
  85% { opacity: 0.4; }
  100% { transform: translate3d(-100px, 40vh, 0) scale(0.9); opacity: 0; }
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
  0% { background: radial-gradient(circle at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 100%); transform: scale(0.8); }
  50% { background: radial-gradient(circle at center, rgba(139,69,19,0.4) 0%, rgba(0,0,0,0.8) 70%); transform: scale(1.1); }
  100% { background: radial-gradient(circle at center, rgba(139,69,19,0.2) 0%, rgba(0,0,0,0.9) 100%); transform: scale(1); }
}

@keyframes intro-glow {
  0%, 100% { box-shadow: 0 0 50px rgba(255,255,255,0.2), inset 0 0 100px rgba(139,69,19,0.1); }
  50% { box-shadow: 0 0 100px rgba(255,255,255,0.4), inset 0 0 150px rgba(139,69,19,0.3); }
}

@keyframes floating-petals {
  0% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-10px) rotate(120deg); }
  66% { transform: translateY(-5px) rotate(240deg); }
  100% { transform: translateY(0px) rotate(360deg); }
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

/* Enhanced luxury animations */
@keyframes luxury-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes luxury-float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(1deg); }
  50% { transform: translateY(-5px) rotate(-1deg); }
  75% { transform: translateY(-10px) rotate(1deg); }
}

@keyframes golden-pulse {
  0%, 100% { 
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.2), 
                inset 0 0 20px rgba(212, 175, 55, 0.1); 
  }
  50% { 
    box-shadow: 0 0 40px rgba(212, 175, 55, 0.4), 
                0 0 60px rgba(212, 175, 55, 0.2),
                inset 0 0 30px rgba(212, 175, 55, 0.2); 
  }
}

@keyframes luxury-text-glow {
  0%, 100% { 
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.3),
                 0 0 20px rgba(212, 175, 55, 0.2),
                 0 0 30px rgba(212, 175, 55, 0.1); 
  }
  50% { 
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.5),
                 0 0 40px rgba(212, 175, 55, 0.4),
                 0 0 60px rgba(212, 175, 55, 0.2); 
  }
}

@keyframes luxury-border {
  0% { border-color: rgba(212, 175, 55, 0.3); }
  50% { border-color: rgba(212, 175, 55, 0.6); }
  100% { border-color: rgba(212, 175, 55, 0.3); }
}

@keyframes enhanced-ripple {
  0% { 
    transform: scale3d(0.1, 0.1, 1); 
    opacity: 0.8; 
    border-color: rgba(212, 175, 55, 0.4); 
  }
  50% { 
    transform: scale3d(1.0, 1.0, 1); 
    opacity: 0.4; 
    border-color: rgba(255, 255, 255, 0.2); 
  }
  100% { 
    transform: scale3d(2.0, 2.0, 1); 
    opacity: 0; 
    border-color: rgba(212, 175, 55, 0.1); 
  }
}

@keyframes button-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.2); }
  50% { box-shadow: 0 0 30px rgba(255, 255, 255, 0.4); }
}

/* Luxury utility classes */
.luxury-text { animation: luxury-text-glow 3s infinite ease-in-out; }
.luxury-button {
  position: relative;
  overflow: hidden;
}
.luxury-button:before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg, 
    transparent, 
    rgba(212, 175, 55, 0.2), 
    transparent
  );
  transition: left 0.5s;
}
.luxury-button:hover:before {
  left: 100%;
}


/* Enhanced main content styling */
.main-title {
  background: linear-gradient(
    135deg, 
    #ffffff 0%, 
    #f8fafc 25%, 
rgb(224, 220, 207) 50%, 
    #f8fafc 75%, 
    #ffffff 100%
  );
  background-size: 200% 200%;
  animation: luxury-shimmer 3s infinite linear;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-text {
  position: relative;
}
.section-text:before {
  content: '';
  position: absolute;
  left: -20px;
  top: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(212, 175, 55, 0.3) 25%,
    rgba(212, 175, 55, 0.6) 50%,
    rgba(212, 175, 55, 0.3) 75%,
    transparent 100%
  );
  border-radius: 2px;
  opacity: 0;
  transition: opacity 1s ease-in-out;
}
.section-text.visible:before {
  opacity: 1;
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
.animate-pulse-slow { animation: pulse-slow 4s infinite ease-in-out; }
.animate-text-glow { animation: text-glow 3s infinite ease-in-out; }
.animate-button-glow { animation: button-glow 2s infinite ease-in-out; }
.glass-effect {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.font-cursive { font-family: 'Brush Script MT', 'Lucida Handwriting', cursive; }

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Responsive design */
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

button:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.8);
  outline-offset: 2px;
}
`;

// --- CUSTOM COMPONENTS ---
const BB8Component: React.FC<{ size: number }> = React.memo(({ size }) => (
  <div className="relative" style={{ width: size, height: size }}>
    {/* Main Body Sphere */}
    <div
      className="absolute bottom-0 rounded-full border-2 shadow-2xl"
      style={{
        width: size * 0.8,
        height: size * 0.8,
        background: 'linear-gradient(145deg, #ffffff 0%, #f0f0f0 25%, #e8e8e8 50%, #d5d5d5 75%, #c0c0c0 100%)',
        borderColor: CONFIG.starWarsCharacters.bb8.color,
        left: '10%',
        boxShadow: `
          0 0 20px rgba(255, 107, 53, 0.3),
          inset 0 0 15px rgba(255, 255, 255, 0.8),
          inset 0 -10px 20px rgba(0, 0, 0, 0.1)
        `,
      }}
    >
      {/* Orange Central Panel */}
      <div
        className="absolute rounded-full border"
        style={{
          width: '35%',
          height: '35%',
          background: `linear-gradient(135deg, ${CONFIG.starWarsCharacters.bb8.color} 0%, #e55a2b 50%, #cc4a1f 100%)`,
          top: '18%',
          left: '32%',
          borderColor: '#b8441a',
          boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 10px rgba(255, 107, 53, 0.4)',
        }}
      >
        {/* Inner orange details */}
        <div
          className="absolute rounded-full"
          style={{
            width: '60%',
            height: '60%',
            background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.3) 0%, transparent 100%)',
            top: '10%',
            left: '10%',
          }}
        />
      </div>
      
      {/* Side Panels */}
      <div
        className="absolute rounded-full border"
        style={{
          width: '18%',
          height: '18%',
          background: 'linear-gradient(135deg, #ddd 0%, #999 100%)',
          borderColor: '#666',
          top: '58%',
          left: '20%',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)',
        }}
      />
      <div
        className="absolute rounded-full border"
        style={{
          width: '12%',
          height: '12%',
          background: 'linear-gradient(135deg, #ddd 0%, #999 100%)',
          borderColor: '#666',
          top: '25%',
          left: '70%',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)',
        }}
      />
      
      {/* Body Seam Lines */}
      <div
        className="absolute"
        style={{
          width: '90%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, #aaa 50%, transparent 100%)',
          top: '50%',
          left: '5%',
        }}
      />
    </div>
    
    {/* Head Sphere */}
    <div
      className="absolute rounded-full border-2 shadow-xl"
      style={{
        width: size * 0.5,
        height: size * 0.5,
        background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 25%, #ebebeb 50%, #d8d8d8 75%, #c5c5c5 100%)',
        borderColor: CONFIG.starWarsCharacters.bb8.color,
        top: '-8%',
        left: '25%',
        boxShadow: `
          0 0 15px rgba(255, 107, 53, 0.2),
          inset 0 0 10px rgba(255, 255, 255, 0.9),
          inset 0 -5px 15px rgba(0, 0, 0, 0.05)
        `,
      }}
    >
      {/* Main Eye */}
      <div
        className="absolute rounded-full border-2"
        style={{
          width: '30%',
          height: '30%',
          background: 'radial-gradient(circle at 30% 30%, #4a90e2 0%, #2c5aa0 50%, #1a365d 100%)',
          borderColor: '#333',
          top: '32%',
          left: '35%',
          boxShadow: `
            0 0 8px rgba(74, 144, 226, 0.5),
            inset 0 0 5px rgba(255, 255, 255, 0.3)
          `,
        }}
      >
        {/* Eye Lens Reflection */}
        <div
          className="absolute rounded-full"
          style={{
            width: '40%',
            height: '40%',
            background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.8) 0%, transparent 60%)',
            top: '15%',
            left: '20%',
          }}
        />
      </div>
      
      {/* Antenna */}
      <div
        className="absolute"
        style={{
          width: '3px',
          height: size * 0.15,
          background: 'linear-gradient(180deg, #666 0%, #999 50%, #666 100%)',
          top: '8%',
          left: '48%',
          borderRadius: '2px',
          boxShadow: '0 0 3px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: '6px',
            height: '6px',
            background: 'radial-gradient(circle, #ff4444 0%, #cc0000 100%)',
            top: '-3px',
            left: '-1.5px',
            boxShadow: '0 0 4px rgba(255, 68, 68, 0.6)',
          }}
        />
      </div>
    </div>
  </div>
));

const YodaComponent: React.FC<{ size: number }> = React.memo(({ size }) => (
  <div className="relative" style={{ width: size, height: size }}>
    {/* Body/Robe */}
    <div
      className="absolute bottom-0 rounded-t-full shadow-2xl"
      style={{
        width: size * 0.9,
        height: size * 0.7,
        background: 'linear-gradient(180deg, #8B4513 0%, #654321 30%, #4a2c17 60%, #3d1f0f 100%)',
        left: '5%',
        boxShadow: `
          0 0 20px rgba(139, 69, 19, 0.4),
          inset 0 0 15px rgba(255, 255, 255, 0.1),
          inset 0 -10px 20px rgba(0, 0, 0, 0.3)
        `,
      }}
    >
      {/* Robe Details */}
      <div
        className="absolute"
        style={{
          width: '2px',
          height: '60%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%)',
          top: '20%',
          left: '30%',
        }}
      />
      <div
        className="absolute"
        style={{
          width: '2px',
          height: '60%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%)',
          top: '20%',
          right: '30%',
        }}
      />
    </div>
    
    {/* Head */}
    <div
      className="absolute rounded-full shadow-xl"
      style={{
        width: size * 0.6,
        height: size * 0.5,
        background: 'linear-gradient(145deg, #7dd87a 0%, #4ade80 25%, #22c55e 50%, #16a34a 75%, #15803d 100%)',
        top: '15%',
        left: '20%',
        boxShadow: `
          0 0 15px rgba(74, 222, 128, 0.3),
          inset 0 0 10px rgba(255, 255, 255, 0.2),
          inset 0 -8px 15px rgba(0, 0, 0, 0.1)
        `,
      }}
    >
      {/* Wrinkle Lines */}
      <div
        className="absolute"
        style={{
          width: '40%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.3) 50%, transparent 100%)',
          top: '65%',
          left: '30%',
        }}
      />
      <div
        className="absolute"
        style={{
          width: '30%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.2) 50%, transparent 100%)',
          top: '75%',
          left: '35%',
        }}
      />
      
      {/* Left Ear */}
      <div
        className="absolute rounded-full shadow-lg"
        style={{
          width: '22%',
          height: '45%',
          background: 'linear-gradient(135deg, #7dd87a 0%, #4ade80 50%, #22c55e 100%)',
          top: '8%',
          left: '-8%',
          transform: 'rotate(-25deg)',
          boxShadow: `
            0 0 8px rgba(74, 222, 128, 0.2),
            inset 0 0 5px rgba(255, 255, 255, 0.3),
            inset 0 -3px 8px rgba(0, 0, 0, 0.1)
          `,
        }}
      >
        {/* Ear Details */}
        <div
          className="absolute"
          style={{
            width: '60%',
            height: '1px',
            background: 'rgba(0, 0, 0, 0.2)',
            top: '30%',
            left: '20%',
          }}
        />
      </div>
      
      {/* Right Ear */}
      <div
        className="absolute rounded-full shadow-lg"
        style={{
          width: '22%',
          height: '45%',
          background: 'linear-gradient(135deg, #7dd87a 0%, #4ade80 50%, #22c55e 100%)',
          top: '8%',
          right: '-8%',
          transform: 'rotate(25deg)',
          boxShadow: `
            0 0 8px rgba(74, 222, 128, 0.2),
            inset 0 0 5px rgba(255, 255, 255, 0.3),
            inset 0 -3px 8px rgba(0, 0, 0, 0.1)
          `,
        }}
      >
        {/* Ear Details */}
        <div
          className="absolute"
          style={{
            width: '60%',
            height: '1px',
            background: 'rgba(0, 0, 0, 0.2)',
            top: '30%',
            left: '20%',
          }}
        />
      </div>
      
      {/* Left Eye */}
      <div
        className="absolute rounded-full shadow-inner"
        style={{
          width: '14%',
          height: '14%',
          background: 'radial-gradient(circle at 30% 30%, #4a4a4a 0%, #333 50%, #1a1a1a 100%)',
          top: '42%',
          left: '22%',
          boxShadow: `
            inset 0 0 3px rgba(0, 0, 0, 0.8),
            0 0 2px rgba(255, 255, 255, 0.1)
          `,
        }}
      >
        {/* Eye Highlight */}
        <div
          className="absolute rounded-full"
          style={{
            width: '25%',
            height: '25%',
            background: 'rgba(255, 255, 255, 0.3)',
            top: '20%',
            left: '30%',
          }}
        />
      </div>
      
      {/* Right Eye */}
      <div
        className="absolute rounded-full shadow-inner"
        style={{
          width: '14%',
          height: '14%',
          background: 'radial-gradient(circle at 30% 30%, #4a4a4a 0%, #333 50%, #1a1a1a 100%)',
          top: '42%',
          right: '22%',
          boxShadow: `
            inset 0 0 3px rgba(0, 0, 0, 0.8),
            0 0 2px rgba(255, 255, 255, 0.1)
          `,
        }}
      >
        {/* Eye Highlight */}
        <div
          className="absolute rounded-full"
          style={{
            width: '25%',
            height: '25%',
            background: 'rgba(255, 255, 255, 0.3)',
            top: '20%',
            left: '30%',
          }}
        />
      </div>
      
      {/* Nose */}
      <div
        className="absolute"
        style={{
          width: '8%',
          height: '6%',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.1) 100%)',
          top: '58%',
          left: '46%',
          borderRadius: '50%',
        }}
      />
    </div>
    
    {/* Lightsaber */}
    <div
      className="absolute shadow-lg"
      style={{
        width: '4px',
        height: size * 0.4,
        background: 'linear-gradient(180deg, #8B4513 0%, #654321 30%, #4a2c17 100%)',
        top: '25%',
        right: '8%',
        borderRadius: '2px',
        boxShadow: '0 0 3px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Lightsaber Hilt Details */}
      <div
        className="absolute"
        style={{
          width: '6px',
          height: '8px',
          background: 'linear-gradient(135deg, #999 0%, #666 100%)',
          top: '15%',
          left: '-1px',
          borderRadius: '1px',
        }}
      />
      <div
        className="absolute"
        style={{
          width: '6px',
          height: '6px',
          background: 'linear-gradient(135deg, #999 0%, #666 100%)',
          top: '35%',
          left: '-1px',
          borderRadius: '1px',
        }}
      />
      
      {/* Lightsaber Blade */}
      <div
        className="absolute"
        style={{
          width: '2px',
          height: size * 0.25,
          background: `linear-gradient(180deg, ${CONFIG.starWarsCharacters.yoda.color} 0%, rgba(74, 222, 128, 0.8) 50%, rgba(74, 222, 128, 0.4) 100%)`,
          top: '-40%',
          left: '1px',
          borderRadius: '1px',
          boxShadow: `
            0 0 8px ${CONFIG.starWarsCharacters.yoda.color},
            0 0 15px ${CONFIG.starWarsCharacters.yoda.color},
            0 0 20px rgba(74, 222, 128, 0.3)
          `,
          filter: 'blur(0.5px)',
        }}
      />
    </div>
  </div>
));

// --- CUSTOM HOOKS ---
const useIntroTransition = (introDuration: number) => {
  const [mounted, setMounted] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setShowContent(true), introDuration);
    return () => clearTimeout(timer);
  }, [introDuration]);

  const skipIntro = useCallback(() => setShowContent(true), []);
  return { mounted, showContent, skipIntro };
};

const useAudioSystem = () => {
  const mainAudioRef = useRef<HTMLAudioElement | null>(null);
  const introAudioRef = useRef<HTMLAudioElement | null>(null);
  const [audioState, setAudioState] = useState<AudioState>({
    mainAudio: null,
    introAudio: null,
    isMuted: false,
    isIntroPlaying: false,
    isMainPlaying: false,
    audioError: false,
  });

  // Initialize audio elements with better error handling
  useEffect(() => {
    const initializeAudio = async () => {
      console.log('Initializing audio system...');
      
      try {
        // Initialize main audio
        if (mainAudioRef.current) {
          const mainAudio = mainAudioRef.current;
          
          // Set audio properties
          mainAudio.volume = 0.7;
          mainAudio.loop = true;
          mainAudio.preload = 'auto';
          
          // Add event listeners for debugging
          mainAudio.addEventListener('loadstart', () => console.log('Main audio: Load started'));
          mainAudio.addEventListener('loadeddata', () => console.log('Main audio: Data loaded'));
          mainAudio.addEventListener('canplay', () => console.log('Main audio: Can play'));
          mainAudio.addEventListener('error', async (e) => {
            console.error('Main audio error:', e);
            console.error('Audio error details:', {
              error: mainAudio.error,
              networkState: mainAudio.networkState,
              readyState: mainAudio.readyState,
              src: mainAudio.src
            });
            
            // Try fallback source if available
            if (CONFIG.audio.fallbackSrc && mainAudio.src !== CONFIG.audio.fallbackSrc) {
              console.log('Trying fallback audio source...');
              mainAudio.src = CONFIG.audio.fallbackSrc;
              mainAudio.load();
              try {
                await new Promise(resolve => setTimeout(resolve, 500));
                await mainAudio.play();
                setAudioState(prev => ({ ...prev, isMainPlaying: true, audioError: false }));
              } catch (fallbackError) {
                console.error('Fallback audio also failed:', fallbackError);
                setAudioState(prev => ({ ...prev, audioError: true }));
              }
            } else {
              setAudioState(prev => ({ ...prev, audioError: true }));
            }
          });
          
          // Try to load and play
          console.log('Attempting to play main audio from:', CONFIG.audio.mainSrc);
          
          // Force load
          mainAudio.load();
          
          // Wait a bit for loading
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Attempt to play
          try {
            const playPromise = mainAudio.play();
            if (playPromise !== undefined) {
              await playPromise;
              console.log('Main audio playing successfully');
              setAudioState(prev => ({ ...prev, isMainPlaying: true }));
            }
          } catch (playError) {
            console.warn('Main audio autoplay blocked:', playError);
            setAudioState(prev => ({ ...prev, audioError: true }));
          }
        }

        // Initialize intro audio (less critical, so simpler handling)
        if (introAudioRef.current) {
          const introAudio = introAudioRef.current;
          introAudio.volume = 0.3;
          introAudio.loop = false;
          
          try {
            const introPlayPromise = introAudio.play();
            if (introPlayPromise !== undefined) {
              await introPlayPromise;
              console.log('Intro audio playing');
              setAudioState(prev => ({ ...prev, isIntroPlaying: true }));
            }
          } catch (introError) {
            console.warn('Intro audio autoplay blocked:', introError);
          }
        }
      } catch (error) {
        console.error("Audio initialization failed:", error);
        setAudioState(prev => ({ ...prev, audioError: true }));
      }
    };

    // Delay to ensure DOM is ready
    const timer = setTimeout(initializeAudio, 200);
    return () => clearTimeout(timer);
  }, []);

  // Handle intro audio end
  useEffect(() => {
    const introAudio = introAudioRef.current;
    if (!introAudio) return;

    const handleIntroEnd = () => {
      console.log('Intro audio ended');
      setAudioState(prev => ({ ...prev, isIntroPlaying: false }));
    };

    introAudio.addEventListener('ended', handleIntroEnd);
    return () => introAudio.removeEventListener('ended', handleIntroEnd);
  }, []);

  const toggleMainAudio = useCallback(async () => {
    if (!mainAudioRef.current) {
      console.error('Main audio ref is null');
      return;
    }

    const mainAudio = mainAudioRef.current;
    console.log('Toggle main audio. Current state:', {
      isPlaying: audioState.isMainPlaying,
      paused: mainAudio.paused,
      readyState: mainAudio.readyState,
      src: mainAudio.src
    });

    try {
      if (audioState.isMainPlaying && !mainAudio.paused) {
        mainAudio.pause();
        console.log('Main audio paused');
        setAudioState(prev => ({ ...prev, isMainPlaying: false }));
      } else {
        // Force reload if needed
        if (mainAudio.readyState === 0) {
          console.log('Reloading audio...');
          mainAudio.load();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        await mainAudio.play();
        console.log('Main audio playing');
        setAudioState(prev => ({ ...prev, isMainPlaying: true, audioError: false }));
      }
    } catch (error) {
      console.error("Audio control failed:", error);
      setAudioState(prev => ({ ...prev, audioError: true }));
    }
  }, [audioState.isMainPlaying]);

  const toggleMute = useCallback(() => {
    console.log('Toggling mute');
    setAudioState(prev => {
      const newMuted = !prev.isMuted;
      if (mainAudioRef.current) {
        mainAudioRef.current.muted = newMuted;
        console.log('Main audio muted:', newMuted);
      }
      if (introAudioRef.current) {
        introAudioRef.current.muted = newMuted;
      }
      return { ...prev, isMuted: newMuted };
    });
  }, []);

  const enableAudioWithUserGesture = useCallback(async () => {
    console.log('User gesture - enabling audio');
    
    try {
      if (mainAudioRef.current && !audioState.isMainPlaying) {
        const mainAudio = mainAudioRef.current;
        
        // Force reload if needed
        if (mainAudio.readyState === 0) {
          console.log('Force loading main audio...');
          mainAudio.load();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('Attempting to play main audio via user gesture');
        await mainAudio.play();
        console.log('Main audio started via user gesture');
        setAudioState(prev => ({ ...prev, isMainPlaying: true, audioError: false }));
      }
      
      if (introAudioRef.current && !audioState.isIntroPlaying) {
        try {
          await introAudioRef.current.play();
          setAudioState(prev => ({ ...prev, isIntroPlaying: true }));
        } catch (introError) {
          console.warn('Intro audio failed even with user gesture:', introError);
        }
      }
    } catch (error) {
      console.error("Manual audio start failed:", error);
      setAudioState(prev => ({ ...prev, audioError: true }));
    }
  }, [audioState.isMainPlaying, audioState.isIntroPlaying]);

  return {
    mainAudioRef,
    introAudioRef,
    audioState,
    toggleMainAudio,
    toggleMute,
    enableAudioWithUserGesture,
  };
};

const useParticleEffects = (isEnabled: boolean) => {
  const [particles, setParticles] = useState<ParticleState>({
    roses: [],
    smoke: [],
    stars: [],
    starWarsCharacters: [],
  });

  const generateParticle = useCallback((type: ParticleType): AnimatedElement | ShootingStar | StarWarsCharacter => {
    const baseId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const baseElement = { id: baseId, x: Math.random() * 90 + 5, delay: Math.random() * 3 };

    switch (type) {
      case 'rose':
        return { ...baseElement, rotation: Math.random() * 360 } as AnimatedElement;
      case 'smoke':
        return { ...baseElement, x: Math.random() * 20 + 75, delay: Math.random() * 2 } as AnimatedElement;
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
          top: Math.random() * 40 + 40,
          left: -50,
          size: CONFIG.starWarsCharacters.bb8.size,
          animationDuration: CONFIG.starWarsCharacters.bb8.animationDuration + Math.random() * 3,
          character: 'bb8',
        } as StarWarsCharacter;
      case 'yoda':
        return {
          ...baseElement,
          top: Math.random() * 30 + 30,
          left: window.innerWidth + 50,
          size: CONFIG.starWarsCharacters.yoda.size,
          animationDuration: CONFIG.starWarsCharacters.yoda.animationDuration + Math.random() * 5,
          character: 'yoda',
        } as StarWarsCharacter;
      default:
        throw new Error(`Unknown particle type: ${type satisfies never}`);
    }
  }, []);

  useEffect(() => {
    if (!isEnabled) return;

    const intervals = [
      setInterval(() =>
        setParticles(prev => ({
          ...prev,
          roses: [...prev.roses.slice(-CONFIG.animation.maxParticles.roses + 1), generateParticle('rose') as AnimatedElement],
        })), CONFIG.animation.intervals.roses),
      setInterval(() =>
        setParticles(prev => ({
          ...prev,
          smoke: [...prev.smoke.slice(-CONFIG.animation.maxParticles.smoke + 1), generateParticle('smoke') as AnimatedElement],
        })), CONFIG.animation.intervals.smoke),
      setInterval(() =>
        setParticles(prev => ({
          ...prev,
          stars: [...prev.stars.slice(-CONFIG.animation.maxParticles.stars + 1), generateParticle('star') as ShootingStar],
        })), CONFIG.animation.intervals.stars),
      setInterval(() =>
        setParticles(prev => ({
          ...prev,
          starWarsCharacters: [
            ...prev.starWarsCharacters.slice(-CONFIG.animation.maxParticles.starWars + 1),
            generateParticle(Math.random() < 0.5 ? 'bb8' : 'yoda') as StarWarsCharacter,
          ],
        })), CONFIG.animation.intervals.starWars),
    ];

    return () => intervals.forEach(clearInterval);
  }, [isEnabled, generateParticle]);

  return particles;
};

const useSectionObserver = (isEnabled: boolean) => {
  const [visibleSections, setVisibleSections] = useState<VisibleSections>({});

  useEffect(() => {
    if (!isEnabled) return;
    const observer = new IntersectionObserver(
      entries => {
        const updates: VisibleSections = {};
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            updates[entry.target.id] = true;
            observer.unobserve(entry.target);
          }
        });
        setVisibleSections(prev => ({ ...prev, ...updates }));
      },
      CONFIG.intersectionObserver
    );

    const timer = setTimeout(() => document.querySelectorAll("[data-animate]").forEach(el => observer.observe(el)), 100);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [isEnabled]);

  return visibleSections;
};

// --- CHILD COMPONENTS ---
const IntroScreen: React.FC<{ onSkip: () => void; onUserGesture: () => void }> = React.memo(({ onSkip, onUserGesture }) => (
  <div className="absolute inset-0 flex items-center justify-center z-50 bg-gradient-to-br from-gray-900 via-purple-900/20 to-black">
    <div className="relative flex flex-col items-center justify-center text-center px-4">
      <div
        className="relative w-80 h-80 rounded-full flex items-center justify-center"
        style={{
          animation: "intro-background 4s ease-in-out forwards, intro-glow 4s ease-in-out infinite",
          background: "radial-gradient(circle at center, rgba(139,69,19,0.4) 0%, rgba(75, 85, 99, 0.3) 40%, rgba(0,0,0,0.9) 100%)",
          backdropFilter: "blur(25px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: `
            0 0 80px rgba(139, 69, 19, 0.3),
            inset 0 0 50px rgba(255, 255, 255, 0.05),
            0 20px 60px rgba(0, 0, 0, 0.5)
          `,
        }}
      >
        {/* Luxury ornamental rings */}
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border opacity-30"
            style={{
              inset: `${15 + i * 15}px`,
              borderColor: i === 1 ? '#d4af37' : 'rgba(255, 255, 255, 0.2)',
              borderWidth: i === 1 ? '2px' : '1px',
              background: i === 1 ? 'linear-gradient(45deg, rgba(212, 175, 55, 0.1) 0%, transparent 100%)' : 'none',
            }}
            aria-hidden="true"
          />
        ))}
        
        {/* Floating petals with luxury feel */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-5 h-5 opacity-40"
            style={{
              top: "15%",
              left: "50%",
              transformOrigin: "2.5px 140px",
              transform: `rotate(${i * 45}deg)`,
              animation: `floating-petals ${4 + i * 0.3}s ease-in-out infinite ${i * 0.2}s`,
            }}
            aria-hidden="true"
          >
            <Flower 
              className="text-amber-200" 
              size={20} 
              style={{ 
                filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.4))',
              }}
            />
          </div>
        ))}
        
        {/* Central flower with luxury styling */}
        <Flower
          className="text-white relative z-10"
          size={140}
          style={{ 
            animation: "flower-intro 4s ease-in-out forwards", 
            filter: `
              drop-shadow(0 0 30px rgba(255,255,255,0.6))
              drop-shadow(0 0 60px rgba(212, 175, 55, 0.3))
            `,
          }}
          aria-hidden="true"
        />
        
        {/* Enhanced ripple effects */}
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border pointer-events-none"
            style={{ 
              width: `${80 + i * 30}px`,
              height: `${80 + i * 30}px`,
              borderColor: i % 2 === 0 ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.15)',
              animation: `enhanced-ripple ${4 + i * 0.5}s ease-out infinite ${i * 0.8}s`,
            }}
            aria-hidden="true"
          />
        ))}
      </div>
      
      <div className="mt-12 text-center">
        <h1 className="text-3xl md:text-5xl font-light text-white/95 mb-4 tracking-wider animate-text-glow luxury-text">
          A Cosmic Love Letter
        </h1>
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
          <div className="w-2 h-2 rounded-full bg-amber-400/80 shadow-lg shadow-amber-400/50" />
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
        </div>
        <p className="text-sm text-white/70 tracking-widest uppercase font-light mb-2">
          Transmitting Message...
        </p>
        <div className="flex justify-center">
          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-amber-400/60"
                style={{
                  animation: `pulse 1.5s ease-in-out infinite ${i * 0.3}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex gap-4 mt-10">
        <button
          onClick={() => { onUserGesture(); onSkip(); }}
          className="luxury-button text-white/80 hover:text-white text-sm px-10 py-4 rounded-full transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 animate-button-glow group"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(212, 175, 55, 0.1) 100%)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
          aria-label="View message and enable audio"
        >
          <span className="flex items-center gap-2 font-light tracking-wide">
            Enter Experience
            <div className="w-1 h-1 rounded-full bg-amber-400/80 group-hover:bg-amber-300 transition-colors" />
          </span>
        </button>
      </div>
    </div>
  </div>
));

const AudioControls: React.FC<{ 
  audioState: AudioState; 
  onToggleMainAudio: () => void; 
  onToggleMute: () => void;
  onEnableAudio: () => void;
}> = React.memo(({ audioState, onToggleMainAudio, onToggleMute, onEnableAudio }) => {
  return (
    <div className="fixed top-8 right-8 z-50 flex flex-col gap-3" role="toolbar" aria-label="Audio controls">
      {audioState.audioError && (
        <button
          onClick={onEnableAudio}
          className="group p-4 rounded-full transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 luxury-float"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(245, 158, 11, 0.15) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
          aria-label="Enable audio"
          title="Click to enable audio"
        >
          <Volume2 className="w-6 h-6 text-amber-300 group-hover:text-amber-200 transition-colors duration-300" />
          <div className="absolute inset-0 rounded-full bg-amber-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
        </button>
      )}
      
      {!audioState.audioError && (
        <button
          onClick={onToggleMute}
          className="group p-4 rounded-full transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-white/50 luxury-float"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.08) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
          aria-label={audioState.isMuted ? "Unmute audio" : "Mute audio"}
        >
          {audioState.isMuted ? (
            <VolumeX className="w-6 h-6 text-white/80 group-hover:text-white transition-colors duration-300" />
          ) : (
            <Volume2 className="w-6 h-6 text-white/80 group-hover:text-white transition-colors duration-300" />
          )}
          <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
        </button>
      )}
      
      {/* Luxury indicator */}
      <div className="flex justify-center">
        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-amber-400/60 to-amber-600/40 shadow-lg shadow-amber-400/30 animate-pulse" />
      </div>
    </div>
  );
});

const ParticleEffects: React.FC<ParticleState> = React.memo(({ roses, smoke, stars, starWarsCharacters }) => (
  <>
    {stars.map(star => (
      <div
        key={star.id}
        className="shooting-star particle-element"
        style={{ top: `${star.top}%`, left: `${star.left}%`, animation: `shooting-star ${star.duration}s ease-in-out ${star.delay}s forwards` }}
        aria-hidden="true"
      />
    ))}
    {roses.map(rose => (
      <div
        key={rose.id}
        className="fixed pointer-events-none z-0 particle-element"
        style={{
          left: `${rose.x}%`,
          bottom: "-50px",
          animation: `rose-float 15s ease-in-out ${rose.delay}s forwards`,
          transform: `rotate(${rose.rotation || 0}deg)`,
        }}
        aria-hidden="true"
      >
        <Flower className="text-white opacity-50 drop-shadow-lg animate-pulse-slow" size={36} />
      </div>
    ))}
    {smoke.map(particle => (
      <div
        key={particle.id}
        className="fixed pointer-events-none z-0 particle-element"
        style={{
          left: `${particle.x}%`,
          bottom: "20%",
          animation: `smoke-rise 10s ease-in-out ${particle.delay}s forwards`,
        }}
        aria-hidden="true"
      >
        <div className="w-3 h-3 bg-white opacity-25 rounded-full blur-md" />
      </div>
    ))}
    {starWarsCharacters.map(character => (
      <div
        key={character.id}
        className="fixed pointer-events-none z-5 particle-element"
        style={{
          top: `${character.top}%`,
          left: `${character.left}px`,
          animation: character.character === 'bb8'
            ? `bb8-roll ${character.animationDuration}s ease-in-out ${character.delay}s forwards`
            : `yoda-float ${character.animationDuration}s ease-in-out ${character.delay}s forwards`,
          filter: `drop-shadow(0 0 8px ${CONFIG.starWarsCharacters[character.character].color})`,
        }}
        aria-hidden="true"
      >
        <div className="animate-pulse-slow" style={{ animation: "star-wars-glow 3s ease-in-out infinite" }}>
          {character.character === 'bb8' ? <BB8Component size={character.size} /> : <YodaComponent size={character.size} />}
        </div>
      </div>
    ))}
    <div
      className="absolute inset-0 bg-gradient-radial from-white/5 via-transparent to-transparent pointer-events-none"
      aria-hidden="true"
    />
  </>
));

const LetterContent: React.FC<{ sections: readonly SectionConfig[]; visibleSections: VisibleSections }> = React.memo(
  ({ sections, visibleSections }) => (
    <main
      className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-24"
      style={{ animation: `content-fade ${CONFIG.animation.durations.contentFade}ms ease-out forwards` }}
    >
      <header
        id="header"
        data-animate
        className={`text-center mb-32 transition-all duration-[3000ms] ease-in-out luxury-float ${
          visibleSections.header ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-20 scale-95"
        }`}
      >
        <div className="relative">
          {/* Luxury background accent */}
          <div 
            className="absolute inset-0 bg-gradient-radial from-amber-400/5 via-transparent to-transparent blur-3xl"
            aria-hidden="true" 
          />
          
          <h1 className="relative text-5xl md:text-8xl font-extralight text-white mb-12 tracking-widest main-title luxury-text">
            Like Cigarettes After Sex
          </h1>
          
          {/* Enhanced decorative divider */}
          <div className="flex justify-center items-center space-x-8 mb-8" aria-hidden="true">
            <div className="w-16 md:w-32 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-amber-400/30" />
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-md animate-pulse" />
              <Flower className="relative text-amber-200 opacity-80 golden-glow" size={32} />
            </div>
            <div className="w-4 h-4 rounded-full bg-gradient-radial from-amber-400/80 to-amber-400/40 shadow-lg shadow-amber-400/30" />
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-md animate-pulse" />
              <Flower className="relative text-amber-200 opacity-80 golden-glow" size={32} />
            </div>
            <div className="w-16 md:w-32 h-px bg-gradient-to-l from-transparent via-amber-400/60 to-amber-400/30" />
          </div>
          
          <h2 className="text-2xl md:text-4xl font-extralight text-white/90 tracking-widest luxury-text">
            A Droid's Devotion
          </h2>
          
          {/* Luxury subtitle accent */}
          <div className="mt-6 flex justify-center">
            <div className="px-6 py-2 rounded-full border border-amber-400/30 bg-amber-400/5 backdrop-blur-sm">
              <span className="text-sm text-amber-200/80 tracking-widest uppercase font-light">
                Transmitted with Love
              </span>
            </div>
          </div>
        </div>
      </header>
      
      <article className="space-y-16">
        {sections.map((section, index) => (
          <section
            key={section.id}
            id={section.id}
            data-animate
            className={`transition-all duration-[3000ms] ease-in-out ${
              visibleSections[section.id]
                ? "opacity-100 translate-y-0 translate-x-0 scale-100"
                : section.animation === "translate-y"
                ? "opacity-0 translate-y-20"
                : section.animation === "translate-x"
                ? "opacity-0 -translate-x-20"
                : "opacity-0 scale-95"
            }`}
            style={{ transitionDelay: `${index * CONFIG.animation.durations.sectionDelay}ms` }}
          >
            {section.isSignature ? (
              <footer className="text-center relative">
                {/* Luxury signature container */}
                <div className="relative max-w-md mx-auto">
                  <div 
                    className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-amber-400/5 rounded-2xl blur-xl"
                    aria-hidden="true"
                  />
                  <div className="relative border-t border-amber-400/30 pt-12 mt-20 rounded-lg backdrop-blur-sm">
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-radial from-amber-400/20 to-transparent rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-amber-400/60 shadow-lg shadow-amber-400/30" />
                    </div>
                    
                    <p className="text-xl text-white/80 italic font-light mb-4 luxury-text">
                      With all my love,
                    </p>
                    <p className="text-3xl text-white/90 font-cursive luxury-text tracking-wide">
                      Your Devoted Droid
                    </p>
                    
                    {/* Signature flourish */}
                    <div className="mt-6 flex justify-center">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-px bg-gradient-to-r from-transparent to-amber-400/40" />
                        <div className="w-1 h-1 rounded-full bg-amber-400/60" />
                        <div className="w-4 h-4 border border-amber-400/40 rounded rotate-45" />
                        <div className="w-1 h-1 rounded-full bg-amber-400/60" />
                        <div className="w-8 h-px bg-gradient-to-l from-transparent to-amber-400/40" />
                      </div>
                    </div>
                  </div>
                </div>
              </footer>
            ) : (
              <div className="relative max-w-4xl mx-auto">
                {/* Luxury quote styling */}
                <div className="relative">
                  {index === 0 && (
                    <div className="absolute -left-4 -top-2 text-6xl text-amber-400/20 font-serif">"</div>
                  )}
                  
                  <p className={`text-xl md:text-2xl text-white/90 leading-relaxed md:leading-loose font-extralight italic section-text ${visibleSections[section.id] ? 'visible' : ''}`}>
                    {section.text}
                  </p>
                  
                  {index === sections.length - 2 && (
                    <div className="absolute -right-2 -bottom-4 text-6xl text-amber-400/20 font-serif">"</div>
                  )}
                </div>
                
                {/* Section number indicator */}
                <div className="absolute -right-8 top-0 hidden md:flex items-center justify-center w-8 h-8 rounded-full border border-amber-400/20 bg-amber-400/5 backdrop-blur-sm">
                  <span className="text-xs text-amber-200/60 font-light">
                    {index + 1}
                  </span>
                </div>
              </div>
            )}
          </section>
        ))}
      </article>
      
      {/* Enhanced background elements */}
      <div className="absolute top-1/4 left-10 w-32 h-32 bg-amber-400/5 rounded-full blur-3xl animate-pulse" aria-hidden="true" />
      <div className="absolute bottom-1/4 right-10 w-24 h-24 bg-amber-400/3 rounded-full blur-2xl animate-pulse" aria-hidden="true" />
    </main>
  )
);

// --- MAIN COMPONENT ---
const ApologyLetter: React.FC = () => {
  const { mounted, showContent, skipIntro } = useIntroTransition(CONFIG.animation.durations.intro);
  const { 
    mainAudioRef, 
    introAudioRef, 
    audioState, 
    toggleMainAudio, 
    toggleMute, 
    enableAudioWithUserGesture 
  } = useAudioSystem();
  const particles = useParticleEffects(showContent);
  const visibleSections = useSectionObserver(showContent);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden relative font-serif">
      {/* Main Audio - CasCry.mp3 */}
      <audio 
        ref={mainAudioRef} 
        loop 
        preload="auto" 
        muted={audioState.isMuted}
        playsInline
      >
        <source src={CONFIG.audio.mainSrc} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      
      {/* Intro Audio */}
      <audio 
        ref={introAudioRef} 
        preload="auto" 
        muted={audioState.isMuted}
        playsInline
      >
        <source src={CONFIG.audio.introSrc} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      <style>{componentStyles}</style>
      
      {showContent ? (
        <>
          <AudioControls 
            audioState={audioState}
            onToggleMainAudio={toggleMainAudio}
            onToggleMute={toggleMute}
            onEnableAudio={enableAudioWithUserGesture}
          />
          <ParticleEffects {...particles} />
          <LetterContent sections={SECTIONS_CONFIG} visibleSections={visibleSections} />
        </>
      ) : (
        <IntroScreen 
          onSkip={skipIntro} 
          onUserGesture={enableAudioWithUserGesture}
        />
      )}
    </div>
  );
};

export default ApologyLetter;