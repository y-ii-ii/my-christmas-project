import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { ChristmasTree } from './ChristmasTree';

export const Scene = () => {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ antialias: false }}>
      <color attach="background" args={['#050505']} /> {/* 深邃黑色背景 */}
      
      <Suspense fallback={null}>
        {/* 灯光系统 */}
        <ambientLight intensity={0.2} />
        <pointLight position={[5, 5, 5]} intensity={1} color="#ffaa00" /> {/* 暖色主光 */}
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#0055ff" /> {/* 冷色补光 */}
        <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={2} castShadow />
        
        {/* 环境贴图增强金属质感 */}
        <Environment preset="city" /> 

        {/* 核心内容 */}
        <ChristmasTree />

        {/* 背景氛围 */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Sparkles count={200} scale={10} size={2} speed={0.4} opacity={0.5} />

        {/* 后期处理 */}
        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.8} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
        
        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 1.5} />
      </Suspense>
    </Canvas>
  );
};