import React from 'react';

const LoaderThree: React.FC = () => (
  <div className="flex items-center justify-center space-x-2">
    <div className="w-5 h-5 rounded-full animate-pulse bg-pink-500"></div>
    <div className="w-5 h-5 rounded-full animate-pulse bg-purple-500" style={{ animationDelay: '0.2s' }}></div>
    <div className="w-5 h-5 rounded-full animate-pulse bg-blue-500" style={{ animationDelay: '0.4s' }}></div>
  </div>
);

export default LoaderThree;