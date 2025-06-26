import React from 'react';
import DiscordCanary from '../../assets/Discord_Canary.png';

interface DiscordButtonProps {
  className?: string;
  position?: 'fixed' | 'relative';
  size?: 'sm' | 'md' | 'lg';
}

export default function DiscordButton({ 
  className = '', 
  position = 'fixed',
  size = 'md'
}: DiscordButtonProps) {
  const sizeClasses = {
    sm: {
      logo: 'w-10 h-10',
      expandedWidth: 'group-hover:w-28',
      text: 'text-xs',
      padding: 'px-2 py-1'
    },
    md: {
      logo: 'w-12 h-12 sm:w-14 sm:h-14',
      expandedWidth: 'group-hover:w-32 sm:group-hover:w-36',
      text: 'text-xs sm:text-sm',
      padding: 'px-3 py-2'
    },
    lg: {
      logo: 'w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18',
      expandedWidth: 'group-hover:w-36 sm:group-hover:w-40 md:group-hover:w-44',
      text: 'text-sm sm:text-base',
      padding: 'px-4 py-3'
    }
  };

  const positionClasses = position === 'fixed' 
    ? 'fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50' 
    : 'relative';

  const currentSize = sizeClasses[size];

  return (
    <a
      href="https://discord.gg/DSD8mEr6kg"
      target="_blank"
      rel="noopener noreferrer"
      className={`group ${positionClasses} transition-all duration-300 ease-in-out hover:scale-105 ${className}`}
      title="Join our Discord community"
    >
      <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200/50 overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:shadow-indigo-500/25">
        {/* Discord Logo */}
        <div className="flex-shrink-0">
          <img
            src={DiscordCanary}
            alt="Discord"
            className={`${currentSize.logo} transition-all duration-300`}
          />
        </div>
        
        {/* Expandable Text */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out w-0 ${currentSize.expandedWidth}`}>
          <div className={`${currentSize.padding} whitespace-nowrap`}>
            <span className={`text-gray-800 font-semibold ${currentSize.text} opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100`}>
              Join us now
            </span>
          </div>
        </div>
      </div>
      
      {/* Discord brand glow effect on hover */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400/20 via-purple-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-lg"></div>
    </a>
  );
}