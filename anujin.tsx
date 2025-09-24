import React, { useState, useEffect, useRef } from 'react';
import { Flower } from 'lucide-react';

type VisibleSections = { [key: string]: boolean };

type Rose = { id: number; x: number; delay: number; rotation: number };
type SmokeParticle = { id: number; x: number; delay: number };
type ShootingStar = { id: number; top: number; left: number; delay: number; duration: number };

// Static styles outside component to avoid SSR mismatch
const styles = `
@keyframes rose-float {
  0% { transform: translateY(120vh) rotate(0deg); opacity: 0; }
  10% { opacity: 0.7; }
  90% { opacity: 0.3; }
  100% { transform: translateY(-300px) rotate(720deg); opacity: 0; }
}
@keyframes smoke-rise {
  0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
  15% { opacity: 0.4; }
  85% { opacity: 0.1; transform: scale(1.5); }
  100% { transform: translateY(-250px) translateX(30px) scale(2); opacity: 0; }
}
@keyframes shooting-star {
  0% { transform: translateX(120vw) translateY(-120vh) rotate(225deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 0.2; }
  100% { transform: translateX(-120vw) translateY(120vh) rotate(225deg); opacity: 0; }
}
@keyframes pulse-slow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}
.shooting-star {
  position: fixed;
  width: 3px;
  height: 100px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.9), transparent);
  border-radius: 50%;
  opacity: 0;
  filter: blur(1px);
}
.animate-pulse-slow { animation: pulse-slow 4s infinite ease-in-out; }
.bg-gradient-radial { background: radial-gradient(circle at center, var(--tw-gradient-stops)); }
.shadow-glow { box-shadow: 0 0 20px 8px rgba(255,255,255,0.15), 0 0 40px 15px rgba(255,255,255,0.08); }
.font-cursive { font-family: 'Brush Script MT', cursive; }
`;

const ApologyLetter: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState<VisibleSections>({});
  const [roses, setRoses] = useState<Rose[]>([]);
  const [smoke, setSmoke] = useState<SmokeParticle[]>([]);
  const [stars, setStars] = useState<ShootingStar[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => setMounted(true), []);

  // IntersectionObserver for fade-in animations
  useEffect(() => {
    if (!mounted) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = Array.from(document.querySelectorAll('[data-animate]'));
    elements.forEach(el => observer.observe(el));
    return () => elements.forEach(el => observer.unobserve(el));
  }, [mounted]);

  // Generate roses, smoke, stars (client only)
  useEffect(() => {
    if (!mounted) return;

    const createEffect = <T extends { id: number }>(
      setter: React.Dispatch<React.SetStateAction<T[]>>,
      generator: () => T,
      interval: number,
      maxCount: number
    ) => {
      const id = setInterval(() => {
        setter(prev => [...prev.slice(-maxCount), generator()]);
      }, interval);
      return () => clearInterval(id);
    };

    const roseGen = (): Rose => ({ id: Date.now() + Math.random(), x: Math.random() * 90 + 5, delay: Math.random() * 3, rotation: Math.random() * 360 });
    const smokeGen = (): SmokeParticle => ({ id: Date.now() + Math.random(), x: Math.random() * 20 + 75, delay: Math.random() * 2 });
    const starGen = (): ShootingStar => ({ id: Date.now() + Math.random(), top: Math.random() * 60, left: Math.random() * 100, delay: Math.random() * 10, duration: Math.random() * 3 + 2 });

    const roseCleanup = createEffect(setRoses, roseGen, 3000, 10);
    const smokeCleanup = createEffect(setSmoke, smokeGen, 1500, 15);
    const starCleanup = createEffect(setStars, starGen, 4000, 8);

    return () => { roseCleanup(); smokeCleanup(); starCleanup(); };
  }, [mounted]);

  // Play background music
  useEffect(() => {
    if (mounted && audioRef.current) audioRef.current.play().catch(() => {});
  }, [mounted]);

  if (!mounted) return null; // Skip SSR rendering

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden relative font-serif">
      <audio ref={audioRef} src="/song.mp3" loop />
      <style>{styles}</style>

      {/* Stars */}
      {stars.map(star => (
        <div
          key={star.id}
          className="fixed shooting-star z-0"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            animation: `shooting-star ${star.duration}s ease-in-out ${star.delay}s forwards`,
          }}
        />
      ))}

      {/* Roses */}
      {roses.map(rose => (
        <div
          key={rose.id}
          className="fixed pointer-events-none z-0"
          style={{
            left: `${rose.x}%`,
            bottom: '-50px',
            animation: `rose-float 15s ease-in-out ${rose.delay}s forwards`,
            transform: `rotate(${rose.rotation}deg)`,
          }}
        >
          <Flower className="text-white opacity-50 drop-shadow-lg animate-pulse-slow" size={36} />
        </div>
      ))}

      {/* Smoke */}
      {smoke.map(p => (
        <div
          key={p.id}
          className="fixed pointer-events-none z-0"
          style={{
            left: `${p.x}%`,
            bottom: '20%',
            animation: `smoke-rise 10s ease-in-out ${p.delay}s forwards`,
          }}
        >
          <div className="w-3 h-3 bg-white opacity-25 rounded-full blur-md" />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-transparent pointer-events-none" />

      {/* Letter Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-8 py-20">
        {/* Header */}
        <div
          id="header"
          data-animate
          className={`text-center mb-24 transition-all duration-[2500ms] ease-in-out ${isVisible.header ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-20 scale-95'}`}
        >
          <h1 className="text-7xl font-extralight text-white mb-8 tracking-widest">Like Cigarettes After Sex</h1>
          <div className="flex justify-center items-center space-x-6 mb-6">
            <div className="w-24 h-px bg-white/50"></div>
            <Flower className="text-white opacity-70 animate-pulse-slow" size={28} />
            <div className="w-24 h-px bg-white/50"></div>
          </div>
          <h2 className="text-3xl font-extralight text-white/85 tracking-widest">& White Roses</h2>
        </div>

        {/* Letter Sections */}
        {[
          { id: 'opening', text: `"You remind me of quiet moments after passion fades,
of white roses in moonlight, delicate and pure..."`, animation: 'translate-x' },
          { id: 'apology1', text: `I know I've hurt you, and the weight of that reality sits heavy in my chest like smoke in still air. You are everything beautiful and tender in this world - like the softness that follows intimacy, like white roses that bloom against all odds in darkness.`, animation: 'translate-y' },
          { id: 'apology2', text: `I was careless with something precious. Your love feels like those perfect, quiet moments - raw, honest, beautiful. And I let my own flaws cast shadows on that purity.`, animation: 'translate-x' },
          { id: 'apology3', text: `You deserve love that feels like silk sheets and morning light, like the gentle burn of shared cigarettes and whispered confessions. You deserve someone who handles your heart like white roses - with reverence, with care, with wonder.`, animation: 'translate-y' },
          { id: 'promise', text: `I want to be better for you. To love you like you're poetry made flesh, like you're every beautiful thing I've ever wanted to touch but was afraid to break. Give me the chance to show you that kind of love - careful, devoted, real.`, animation: 'scale' },
          { id: 'signature', text: `With all my love,\nYour Devoted One`, animation: 'translate-y' },
        ].map((section, index) => (
          <div
            key={section.id}
            id={section.id}
            data-animate
            className={`transition-all duration-[2500ms] ease-in-out delay-[${index * 300}ms] ${
              isVisible[section.id]
                ? 'opacity-100 translate-y-0 translate-x-0 scale-100'
                : section.animation === 'translate-y'
                ? 'opacity-0 translate-y-15'
                : section.animation === 'translate-x'
                ? 'opacity-0 -translate-x-15'
                : 'opacity-0 scale-95'
            }`}
          >
            {section.id === 'signature' ? (
              <div className="text-center border-t border-white/30 pt-10">
                <p className="text-lg text-white/70 italic font-light">With all my love,</p>
                <p className="text-2xl text-white/80 font-cursive mt-2">Your Devoted One</p>
              </div>
            ) : (
              <p className="text-xl text-white/85 leading-loose mb-10 text-justify font-extralight italic">{section.text}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApologyLetter;
