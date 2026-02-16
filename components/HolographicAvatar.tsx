
import React from 'react';

interface HolographicAvatarProps {
  src: string;
  className?: string;
}

export const HolographicAvatar: React.FC<HolographicAvatarProps> = ({ src, className = "" }) => {
  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* levitation Container */}
      <div className="animate-levitate relative">
        {/* Holographic Aura Glow */}
        <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-2xl animate-pulse"></div>
        
        {/* Main Projection Container */}
        <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.6)] group">
          {/* Chromatic Edge Flicker */}
          <div className="absolute inset-0 border-4 border-white/20 rounded-full animate-hologram-flicker pointer-events-none"></div>
          
          {/* Base Image with Holographic Transparency */}
          <img 
            src={src} 
            alt="Sarah Johnson AI" 
            className="w-full h-full object-cover opacity-80 mix-blend-screen brightness-110 contrast-125"
          />

          {/* Scanline Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,255,255,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>
          
          {/* Digital Circuitry Texture Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay"></div>
        </div>

        {/* Floating Particles (Simulated with simple CSS) */}
        <div className="absolute -top-4 left-1/2 w-1 h-1 bg-cyan-400 rounded-full animate-ping delay-75"></div>
        <div className="absolute top-10 -left-4 w-1 h-1 bg-blue-400 rounded-full animate-ping delay-300"></div>
        <div className="absolute top-20 -right-2 w-1 h-1 bg-cyan-300 rounded-full animate-ping delay-500"></div>
      </div>

      {/* Radiant Projection Platform */}
      <div className="mt-4 w-16 h-2 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent rounded-full blur-sm shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-pulse"></div>
      
      <style>{`
        @keyframes levitate {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .animate-levitate {
          animation: levitate 4s ease-in-out infinite;
        }
        @keyframes hologram-flicker {
          0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100% { opacity: 1; border-color: rgba(34, 211, 238, 0.4); }
          20%, 21.999%, 63%, 63.999%, 65%, 69.999% { opacity: 0.4; border-color: rgba(255, 255, 255, 0.8); filter: brightness(2); }
        }
        .animate-hologram-flicker {
          animation: hologram-flicker 3s infinite linear;
        }
      `}</style>
    </div>
  );
};
