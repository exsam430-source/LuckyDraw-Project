// src/components/common/TokenRoller.jsx
import { useState, useEffect, useRef } from 'react';

const TokenRoller = ({
  isRolling,
  targetNumber,
  animationPool = [],
  onComplete,
  prize = null,
  prizeType = null, // 'grand', 'secondary', 'consolation', or null
  size = 'lg'
}) => {
  const [displayNumber, setDisplayNumber] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [countdown, setCountdown] = useState(null);
  const timeoutRef = useRef(null);
  const countdownRef = useRef(null);
  const startTimeRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { 
      isMounted.current = false;
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Get total roll duration in milliseconds based on prize type
  const getRollDuration = () => {
    if (!prize) return 3000;      // No prize - 3 seconds
    if (prizeType === 'grand') return 15000;  // Grand prize - 15 seconds
    return 10000;                 // Regular prize - 10 seconds
  };

  useEffect(() => {
    if (!isRolling || targetNumber === null || targetNumber === undefined) return;

    setPhase('spinning');
    setCountdown(null);
    startTimeRef.current = Date.now();

    const pool = animationPool.length > 5
      ? [...animationPool]
      : Array.from({ length: Math.max(50, targetNumber + 20) }, (_, i) => i + 1);

    const totalDuration = getRollDuration();
    
    // Start countdown for prize rolls
    if (prize && totalDuration > 3000) {
      const countdownSecs = Math.ceil(totalDuration / 1000);
      setCountdown(countdownSecs);
      countdownRef.current = setInterval(() => {
        if (!isMounted.current) return;
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.ceil((totalDuration - elapsed) / 1000);
        if (remaining <= 0) {
          clearInterval(countdownRef.current);
          setCountdown(null);
        } else {
          setCountdown(remaining);
        }
      }, 500);
    }

    const tick = () => {
      if (!isMounted.current) return;
      
      const elapsed = Date.now() - startTimeRef.current;
      const progress = elapsed / totalDuration; // 0 to 1

      if (progress < 1) {
        // Calculate interval based on progress (slow down as we approach end)
        let interval;
        
        if (progress < 0.5) {
          // Fast spinning phase (first 50%)
          interval = 40 + Math.random() * 30;
          setPhase('spinning');
        } else if (progress < 0.75) {
          // Slowing down phase (50% to 75%)
          const slowProgress = (progress - 0.5) / 0.25;
          interval = 70 + slowProgress * 150 + Math.random() * 50;
          setPhase('slowing');
        } else if (progress < 0.9) {
          // Very slow phase (75% to 90%)
          const verySlowProgress = (progress - 0.75) / 0.15;
          interval = 220 + verySlowProgress * 300 + Math.random() * 100;
          setPhase('slowing');
        } else {
          // Final suspense phase (90% to 100%)
          const finalProgress = (progress - 0.9) / 0.1;
          interval = 500 + finalProgress * 600 + Math.random() * 200;
          setPhase('stopping');
        }

        setDisplayNumber(pool[Math.floor(Math.random() * pool.length)]);
        timeoutRef.current = setTimeout(tick, interval);
      } else {
        // Roll complete - show final number
        setDisplayNumber(targetNumber);
        setPhase('stopped');
        setCountdown(null);
        
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }

        // Brief pause then reveal
        setTimeout(() => {
          if (!isMounted.current) return;
          if (prize) {
            setPhase('prize-reveal');
          }
          // Call onComplete after a short reveal moment
          setTimeout(() => {
            if (!isMounted.current) return;
            if (onComplete) onComplete(targetNumber);
          }, prize ? 800 : 300);
        }, 500);
      }
    };

    tick();
    
    return () => { 
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isRolling, targetNumber]);

  const sizeMap = {
    sm: 'w-28 h-28 text-3xl',
    md: 'w-44 h-44 text-5xl',
    lg: 'w-56 h-56 sm:w-64 sm:h-64 text-6xl sm:text-7xl'
  };

  return (
    <div className="token-roller-wrapper text-center">
      <div className={`token-roller-machine ${phase}`}>
        <div className={`roller-display ${sizeMap[size] || sizeMap.lg} mx-auto ${
          phase === 'stopped' && prize 
            ? prizeType === 'grand' 
              ? 'grand-winner-glow' 
              : 'winner-glow'
            : ''
        } ${phase === 'prize-reveal' && prize
            ? prizeType === 'grand'
              ? 'grand-winner-glow'
              : 'winner-glow'
            : ''
        }`}>
          <div className={`roller-number ${
            (phase === 'stopped' || phase === 'prize-reveal') && prize && prizeType === 'grand' 
              ? 'animate-bounce' 
              : ''
          }`}>
            {displayNumber !== null ? `#${displayNumber}` : '?'}
          </div>
        </div>
      </div>

      {/* Countdown display during rolling */}
      {countdown && countdown > 0 && (phase === 'spinning' || phase === 'slowing' || phase === 'stopping') && (
        <div className="mt-4">
          <span className={`text-lg font-bold ${
            prizeType === 'grand' ? 'text-yellow-600' : prize ? 'text-indigo-600' : 'text-gray-500'
          }`}>
            {countdown}s
          </span>
          <span className="text-gray-400 text-sm ml-2">
            {prizeType === 'grand' ? '🏆 Grand Prize Roll!' : prize ? '🎯 Prize Roll!' : ''}
          </span>
        </div>
      )}

      {/* Saving indicator */}
      {phase === 'stopped' && !prize && (
        <div className="mt-4 animate-pulse">
          <span className="text-sm text-gray-500">💾 Saving...</span>
        </div>
      )}

      {phase === 'prize-reveal' && prize && (
        <div className="mt-6 animate-fadeIn">
          <div className={`inline-block rounded-xl px-8 py-5 shadow-2xl ${
            prizeType === 'grand'
              ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white animate-pulse'
              : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
          }`}>
            <div className="text-4xl mb-1">{prizeType === 'grand' ? '🎉🏆🎉' : '🏆'}</div>
            <h3 className={`font-bold ${prizeType === 'grand' ? 'text-2xl' : 'text-xl'}`}>
              {prizeType === 'grand' ? 'GRAND PRIZE WINNER!' : 'WINNER!'}
            </h3>
            <p className="text-yellow-100 font-semibold">{prize.title}</p>
            <p className="text-yellow-100 text-sm">Worth Rs {prize.value?.toLocaleString()}</p>
            <p className="text-yellow-200 text-xs mt-2 animate-pulse">💾 Saving winner...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenRoller;