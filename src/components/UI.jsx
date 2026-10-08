import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store';

export const UI = () => {
  const { phase, isPlaying, setIsPlaying } = useStore();
  const audioRef = useRef(null);
  const [musicAvailable, setMusicAvailable] = useState(false);

  useEffect(() => {
    // 音乐素材是可选的；将 bgm.mp3 放入 public/music 即可启用。
    const audio = new Audio('/music/bgm.mp3');
    audioRef.current = audio;
    audio.loop = true;
    const handleAvailable = () => setMusicAvailable(true);
    const handleUnavailable = () => {
      setMusicAvailable(false);
      setIsPlaying(false);
    };
    audio.addEventListener('canplaythrough', handleAvailable);
    audio.addEventListener('error', handleUnavailable);
    audio.load();
    return () => {
      audio.pause();
      audio.removeEventListener('canplaythrough', handleAvailable);
      audio.removeEventListener('error', handleUnavailable);
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current || !musicAvailable) return;
    if (isPlaying) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [isPlaying, musicAvailable]);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {/* 1. 标题：依然保持在顶部居中 */}
      <div className="absolute top-10 left-0 right-0 flex justify-center">
        <h1 className="text-6xl md:text-8xl font-cursive text-[#ffd700] drop-shadow-[0_0_15px_rgba(255,215,0,0.6)] animate-pulse">
          Merry Christmas
        </h1>
      </div>

      {/* 2. 操作指引：移到屏幕左侧中间 */}
      <div className="absolute top-1/2 left-8 -translate-y-1/2 flex flex-col gap-4 text-white/80 font-light tracking-widest text-sm">
        <div className="bg-black/40 p-4 rounded-xl border-l-2 border-yellow-400 backdrop-blur-sm">
            <p className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🖐️</span> 
                <span>张开手掌<br/><span className="text-yellow-400 font-bold">炸开星云</span></span>
            </p>
            <p className="flex items-center gap-2">
                <span className="text-2xl">✊</span> 
                <span>握紧拳头<br/><span className="text-blue-400 font-bold">复原</span></span>
            </p>
        </div>
      </div>

      {/* 3. 音乐播放器：移到屏幕右下角 */}
      <div className="absolute bottom-8 right-8 pointer-events-auto">
        <div 
          onClick={() => musicAvailable && setIsPlaying(!isPlaying)}
          aria-disabled={!musicAvailable}
          className={`flex items-center gap-4 px-6 py-3 rounded-full backdrop-blur-md border transition-all duration-500
            ${musicAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}
            ${isPlaying ? 'bg-yellow-500/20 border-yellow-500/60 shadow-[0_0_20px_rgba(255,215,0,0.2)]' : 'bg-white/5 border-white/10'}
          `}
        >
          <div className={`text-2xl ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
            {isPlaying ? '💿' : '🔇'}
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-yellow-400 uppercase tracking-widest opacity-80">
              {!musicAvailable ? 'Music Unavailable' : isPlaying ? 'Now Playing' : 'Music Paused'}
            </span>
            <div className="w-32 overflow-hidden whitespace-nowrap text-right">
              <span className="text-sm text-white">
                {musicAvailable ? 'Merry Christmas Mr. Lawrence' : 'Add public/music/bgm.mp3'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
