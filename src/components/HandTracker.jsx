// src/components/HandTracker.jsx
import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { useStore } from '../store';

export const HandTracker = () => {
  const videoRef = useRef(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const { setHandGesture, setPhase, phase, setCarouselRotation } = useStore();

  useEffect(() => {
    let handLandmarker = null;
    let animationFrameId = null;

    const setupMediaPipe = async () => {
      try {
        const baseUrl = window.location.origin;
        const vision = await FilesetResolver.forVisionTasks(baseUrl);
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `${baseUrl}/hand_landmarker.task`,
            delegate: "CPU" // 保持 CPU 模式以确保稳定
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        console.log("✅ MediaPipe 模型加载成功");
      } catch (error) {
        console.error("❌ 模型加载失败", error);
      }
    };

    setupMediaPipe();

    const predict = () => {
      if (videoRef.current && videoRef.current.readyState >= 2 && handLandmarker) {
        const results = handLandmarker.detectForVideo(videoRef.current, performance.now());

        if (results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          
          // 1. 手指计数逻辑
          const fingersUp = [8, 12, 16, 20].filter(
            (idx) => landmarks[idx].y < landmarks[idx - 2].y
          ).length;

          // 2. 获取手掌中心 X 坐标 (0在左边, 1在右边)
          // 这里的 landmarks[9] 是中指根部，比较稳定
          // 注意：摄像头是镜像的，所以 1-x 才是符合直觉的方向
          const handX = 1 - landmarks[9].x; 

          // --- ✋ 张开手掌 (触发 + 控制) ---
          if (fingersUp >= 4) {
            setHandGesture('Open_Palm');
            
            if (phase === 'tree') {
              setPhase('blooming'); // 触发炸开
            } else {
              // 在炸开/星云状态下，手掌移动控制旋转！
              // 将 0~1 的坐标映射到 -2 ~ 2 的旋转角度
              const rotationAngle = (handX - 0.5) * 5; 
              setCarouselRotation(rotationAngle);
            }
          } 
          // --- ✊ 握拳 (复原) ---
          else if (fingersUp === 0) {
            setHandGesture('Closed_Fist');
            // 只要不是在树形态，握拳都可以强制复原
            if (phase !== 'tree' && phase !== 'collapsing') {
              setPhase('collapsing');
              setCarouselRotation(0); // 重置旋转
            }
          } 
          else {
            setHandGesture('Moving');
          }
        } else {
          setHandGesture('None');
        }
      }
      animationFrameId = requestAnimationFrame(predict);
    };

    if (webcamRunning) predict();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [webcamRunning, phase]); // 去掉 setCarouselRotation 依赖防止死循环

  const toggleCamera = () => {
    if (!webcamRunning) {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener("loadeddata", () => setWebcamRunning(true));
      });
    } else {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setWebcamRunning(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 p-3 rounded-xl border border-white/20 backdrop-blur-md bg-black/30 shadow-lg">
      <div className="relative w-32 h-24 bg-black/50 rounded-lg overflow-hidden mb-2 border border-white/10">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
        {!webcamRunning && <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/50">CAMERA OFF</div>}
      </div>
      <button onClick={toggleCamera} className={`w-full py-1.5 text-[10px] font-bold tracking-wider text-white rounded transition-colors ${webcamRunning ? 'bg-red-500/20 hover:bg-red-500/40' : 'bg-green-500/20 hover:bg-green-500/40'}`}>
        {webcamRunning ? 'STOP TRACKING' : 'START CAMERA'}
      </button>
      <div className="mt-2 text-center">
         <p className="text-[10px] text-white/40 uppercase tracking-widest">Gesture</p>
         <p className="text-xs font-mono font-bold text-yellow-400 mt-0.5">{useStore.getState().handGesture || 'None'}</p>
      </div>
    </div>
  );
};