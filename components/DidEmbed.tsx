
import React, { useState } from 'react';

export const DidEmbed: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  // Specific D-ID Share URL provided
  const url = "https://studio.d-id.com/agents/share?id=v2_agt_56bnv71C&utm_source=copy&key=WVhWMGFEQjhOamRsWldJM05tWXdPVFl4WkRVMFlqZzJOMlk0WldFM09rTXdjRXhxZUhwRFlrbDBWV3QwTjFkQlEwNTZXUT09";

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center rounded-lg shadow-inner">
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 z-10">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium">Connecting to Sarah Johnson...</p>
        </div>
      )}
      
      {/* 
        Container to clip the iframe. 
        "Frameless Window" Technique:
        1. overflow-hidden on parent.
        2. Iframe is scaled UP to push edges off-screen.
        3. Negative margins/positioning re-centers the face.
      */}
      <div className="relative w-full h-full overflow-hidden">
        <iframe
          src={url}
          onLoad={() => setIsLoaded(true)}
          className={`
            transition-opacity duration-1000
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
          `}
          style={{
            // Zoom to 150% to push header/footer off-screen
            width: '150%',
            height: '150%',
            // Center the zoomed iframe
            position: 'absolute',
            top: '-25%',
            left: '-25%',
            border: 'none',
            pointerEvents: 'auto', // Ensure clicks still work on the video/mic
          }}
          allow="microphone; camera; display-capture; autoplay; encrypted-media"
          title="Sarah Johnson AI Agent"
        />
      </div>
      
      {/* Visual blockers (matte) to ensure branding is covered if screen ratio varies widely */}
      <div className="absolute top-0 left-0 w-full h-1 bg-black z-20 pointer-events-none opacity-0 sm:opacity-100" />
    </div>
  );
};
