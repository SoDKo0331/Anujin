import React, { useState, useEffect, useRef } from 'react';
import { Heart, Flower } from 'lucide-react';

type VisibleSections = {
  header?: boolean;
  opening?: boolean;
  apology1?: boolean;
  apology2?: boolean;
  apology3?: boolean;
  promise?: boolean;
  signature?: boolean;
  footer?: boolean;
};

type Rose = {
  id: number;
  x: number;
  delay: number;
};

type SmokeParticle = {
  id: number;
  x: number;
  delay: number;
};

const ApologyLetter = () => {
  const [isVisible, setIsVisible] = useState<VisibleSections>({});
  const [roses, setRoses] = useState<Rose[]>([]);
  const [smoke, setSmoke] = useState<SmokeParticle[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const elements = document.querySelectorAll('[data-animate]');
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(prev => ({
            ...prev,
            [entry.target.id]: true
          }));
        }
      });
    });

    elements.forEach(el => {
      if (observerRef.current) {
        observerRef.current.observe(el);
      }
    });

    return () => {
      if (observerRef.current) {
        elements.forEach(el => {
          observerRef.current?.unobserve(el);
        });
      }
      setRoses((prev) => prev.slice(-8));
      setSmoke((prev) => prev.slice(-12));
    };
  }, []);

  // Floating white roses
  useEffect(() => {
    const interval = setInterval(() => {
      setRoses((prev: any) => [...prev, {
        id: Date.now(),
        x: Math.random() * 90 + 5,
        delay: Math.random() * 3
      }]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Smoke particles
  useEffect(() => {
    const interval = setInterval(() => {
      setSmoke((prev: any) => [...prev, {
        id: Date.now() + Math.random(),
        x: Math.random() * 20 + 75,
        delay: Math.random() * 2
      }]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const cleanup = setTimeout(() => {
      setRoses((prev: Rose[]) => prev.slice(-8));
      setSmoke((prev: SmokeParticle[]) => prev.slice(-12));
    }, 15000);
    return () => clearTimeout(cleanup);
  }, [roses, smoke]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden relative">
      {/* Floating white roses */}
      {roses.map((rose: { id: any; x: any; delay: any; }) => (
        <div
          key={rose.id}
          className="fixed pointer-events-none z-0"
          style={{
            left: `${rose.x}%`,
            bottom: '-50px',
            animation: `rose-float 12s ease-out ${rose.delay}s forwards`
          }}
        >
          <div className="transform rotate-12">
            <Flower className="text-white opacity-40 drop-shadow-lg" size={32} />
          </div>
        </div>
      ))}

      {/* Smoke particles */}
      {smoke.map((particle: { id: any; x: any; delay: any; }) => (
        <div
          key={particle.id}
          className="fixed pointer-events-none z-0"
          style={{
            left: `${particle.x}%`,
            bottom: '20%',
            animation: `smoke-rise 8s ease-out ${particle.delay}s forwards`
          }}
        >
          <div className="w-2 h-2 bg-white opacity-20 rounded-full blur-sm"></div>
        </div>
      ))}

      {/* Ambient lighting effects */}
      <div className="absolute inset-0 bg-gradient-radial from-white/5 via-transparent to-transparent pointer-events-none"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div
          id="header"
          data-animate
          className={`text-center mb-20 transition-all duration-2000 ${
            isVisible.header
              ? 'opacity-100 transform translate-y-0'
              : 'opacity-0 transform translate-y-20'
          }`}
        >
          <h1 className="text-6xl font-light text-white mb-6 tracking-wide">
            Like Cigarettes After Sex
          </h1>
          <div className="flex justify-center items-center space-x-4 mb-4">
            <div className="w-16 h-px bg-white/40"></div>
            <Flower className="text-white opacity-60" size={24} />
            <div className="w-16 h-px bg-white/40"></div>
          </div>
          <h2 className="text-2xl font-light text-white/80 tracking-widest">
            & White Roses
          </h2>
        </div>

        {/* Main content */}
        <div className="bg-black/40 backdrop-blur-md rounded-lg border border-white/10 shadow-2xl p-12 mb-16">
          <div
            id="opening"
            data-animate
            className={`transition-all duration-2000 delay-500 ${
              isVisible.opening
                ? 'opacity-100 transform translate-x-0'
                : 'opacity-0 transform -translate-x-20'
            }`}
          >
            <p className="text-xl text-white/90 leading-relaxed mb-8 font-light italic text-center">
              "You remind me of quiet moments after passion fades,<br/>
              of white roses in moonlight, delicate and pure..."
            </p>
          </div>

          <div
            id="apology1"
            data-animate
            className={`transition-all duration-2000 delay-1000 ${
              isVisible.apology1
                ? 'opacity-100 transform translate-y-0'
                : 'opacity-0 transform translate-y-15'
            }`}
          >
            <p className="text-lg text-white/80 leading-loose mb-8 text-justify font-light">
              I know I've hurt you, and the weight of that reality sits heavy in my chest like smoke 
              in still air. You are everything beautiful and tender in this world - like the softness 
              that follows intimacy, like white roses that bloom against all odds in darkness.
            </p>
          </div>

          <div
            id="apology2"
            data-animate
            className={`transition-all duration-2000 delay-1500 ${
              isVisible.apology2
                ? 'opacity-100 transform translate-x-0'
                : 'opacity-0 transform translate-x-15'
            }`}
          >
            <p className="text-lg text-white/80 leading-loose mb-8 text-justify font-light">
              I was careless with something precious. Your love feels like those perfect, quiet moments - 
              raw, honest, beautiful. And I let my own flaws cast shadows on that purity. 
              I'm sorry for dimming your light with my mistakes.
            </p>
          </div>

          <div
            id="apology3"
            data-animate
            className={`transition-all duration-2000 delay-2000 ${
              isVisible.apology3
                ? 'opacity-100 transform translate-y-0'
                : 'opacity-0 transform translate-y-15'
            }`}
          >
            <p className="text-lg text-white/80 leading-loose mb-8 text-justify font-light">
              You deserve love that feels like silk sheets and morning light, like the gentle burn 
              of shared cigarettes and whispered confessions. You deserve someone who handles 
              your heart like white roses - with reverence, with care, with wonder.
            </p>
          </div>

          <div
            id="promise"
            data-animate
            className={`transition-all duration-2000 delay-2500 ${
              isVisible.promise
                ? 'opacity-100 transform scale-100'
                : 'opacity-0 transform scale-95'
            }`}
          >
            <p className="text-lg text-white/80 leading-loose mb-10 text-justify font-light">
              I want to be better for you. To love you like you're poetry made flesh, 
              like you're every beautiful thing I've ever wanted to touch but was afraid to break. 
              Give me the chance to show you that kind of love - careful, devoted, real.
            </p>
          </div>

          <div
            id="signature"
            data-animate
            className={`transition-all duration-2000 delay-3000 ${
              isVisible.signature
                ? 'opacity-100 transform translate-y-0'
                : 'opacity-0 transform translate-y-10'
            }`}
          >
            <div className="text-center border-t border-white/20 pt-8">
              <style>
                {`
                @keyframes rose-float {
                  0% {
                    transform: translateY(100vh) rotate(0deg);
                    opacity: 0;
                  }
                  15% {
                    opacity: 0.6;
                  }
                  85% {
                    opacity: 0.4;
                  }
                  100% {
                    transform: translateY(-200px) rotate(360deg);
                    opacity: 0;
                  }
                }
                
                @keyframes smoke-rise {
                  0% {
                    transform: translateY(0) translateX(0);
                    opacity: 0;
                  }
                  20% {
                    opacity: 0.3;
                  }
                  80% {
                    opacity: 0.1;
                  }
                  100% {
                    transform: translateY(-200px) translateX(20px);
                    opacity: 0;
                  }
                }
                
                .bg-gradient-radial {
                  background: radial-gradient(circle at center, var(--tw-gradient-stops));
                }
                `}
              </style>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
};

export default ApologyLetter;
