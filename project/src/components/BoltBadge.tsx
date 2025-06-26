import React from 'react';
import whiteBadge from '../assets/bolt-badge-white.svg';
import blackBadge from '../assets/bolt-badge-black.svg';

interface BoltBadgeProps {
  variant?: 'light' | 'dark' | 'text';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function BoltBadge({ variant = 'light', size = 'md', className = '' }: BoltBadgeProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const handleClick = () => {
    window.open('https://bolt.new/', '_blank', 'noopener,noreferrer');
  };

  if (variant === 'text') {
    return (
      <div 
        onClick={handleClick}
        className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
      >
        <span className="text-blue-400">⚡</span>
        <span>Built with Bolt.new</span>
      </div>
    );
  }

  const badgeSource = variant === 'light' ? whiteBadge : blackBadge;
  
  return (
    <img
      src={badgeSource}
      alt="Built with Bolt.new"
      onClick={handleClick}
      className={`${sizeClasses[size]} cursor-pointer transition-transform hover:scale-105 ${className}`}
      title="Built with Bolt.new"
    />
  );
}
