import React, { useRef, useMemo, useEffect, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useStore } from '../store';
import { generateTreePoints, generateNebulaPoints } from '../utils/geometry';
import snowImg from '../assets/snow.png'; // 根据你的实际路径调整
const importAll = (r) => r.keys().map(r);
const photoUrls = importAll(require.context('../assets/photos', false, /\.(png|jpe?g|svg)$/));

// 🎨 核心参数大幅调整区 🎨
const TREE_SCALE = 0.55;
// 🔥 1. 照片基础大小大幅增加 (原来 0.8 -> 现在 1.3)
const PHOTO_SCALE_BASE = 0.8; 
// 🔥 2. 照片墙半径加大，增加间距 (原来 6.5 -> 现在 12.0)
const NEBULA_RADIUS = 5.5;    

// 🌟 新增：创建五角星 2D 形状的辅助函数
// outerRadius: 外圈半径 (尖尖角)
// innerRadius: 内圈半径 (凹进去的角)
const createStarShape = (outerRadius, innerRadius) => {
  const shape = new THREE.Shape();
  const points = 5;
  // 计算角度步长 (一圈是 Math.PI * 2，分成了10份：5个尖角+5个凹角)
  const step = Math.PI / points; 

  // 从顶点开始画
  shape.moveTo(0, outerRadius);

  for (let i = 0; i < 2 * points; i++) {
    // 偶数是外角，奇数是内角
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const a = i * step;
    // 使用三角函数计算坐标
    shape.lineTo(Math.sin(a) * r, Math.cos(a) * r);
  }

  shape.closePath(); // 闭合路径
  return shape;
};

// 🌟 新增：星星的挤压设置 (厚度和倒角)
const starExtrudeSettings = {
  steps: 1,
  depth: 0.1,         // 厚度
  bevelEnabled: true, // 启用倒角 (让边缘圆润一点，更好看)
  bevelThickness: 0.03,
  bevelSize: 0.05,
  bevelSegments: 3,
};

// 螺旋参数 (树形态)
const SPIRAL_PARAMS = {
    loops: 5, height: 6.5, yOffset: 3.0, topRadius: 0.5, bottomRadius: 3.2
};

const getSpiralPoint = (t) => {
    const angle = t * SPIRAL_PARAMS.loops * Math.PI * 2;
    const y = SPIRAL_PARAMS.yOffset - t * SPIRAL_PARAMS.height;
    const r = THREE.MathUtils.lerp(SPIRAL_PARAMS.topRadius, SPIRAL_PARAMS.bottomRadius, t);
    return new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);
}

// src/components/ChristmasTree.jsx 顶部附近

// ... (SPIRAL_PARAMS 和 getSpiralPoint 代码保持不变)

// 🔥🔥🔥 新增：计算完美的圆锥倾斜角 🔥🔥🔥
// 利用三角函数：tan(角度) = 对边 / 邻边
// 对边 = 底部半径 - 顶部半径
// 邻边 = 高度
const CONE_SLOPE_RADS = Math.atan(
  (SPIRAL_PARAMS.bottomRadius - SPIRAL_PARAMS.topRadius) / SPIRAL_PARAMS.height
);

// src/components/ChristmasTree.jsx 中的 Snowfall 组件

const Snowfall = ({ count = 2000 }) => {
  const snowTexture = useTexture(snowImg);
  
  // 🔥 1. 新增：创建一个引用，用来获取真正的粒子对象
  const pointsRef = useRef();

  // 2. 生成几何体数据 (变量名改为 geometry 以免混淆)
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      let i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 30;
      positions[i3 + 1] = Math.random() * 20 + 5; 
      positions[i3 + 2] = (Math.random() - 0.5) * 30;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count]);

  const material = useMemo(() => new THREE.PointsMaterial({
    size: 0.25,            
    map: snowTexture,      
    color: '#ffffff',
    transparent: true,     
    opacity: 0.8,          
    depthWrite: false,     
    blending: THREE.AdditiveBlending, 
  }), [snowTexture]); 

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    // 获取位置数据
    const positions = geometry.attributes.position.array;

    for (let i = 0; i < count; i++) {
      let i3 = i * 3;
      const speed = 0.02 + (i % 5) * 0.005;
      positions[i3 + 1] -= speed; 

      positions[i3] += Math.sin(time + i) * 0.003; 
      positions[i3 + 2] += Math.cos(time * 0.8 + i) * 0.003;

      if (positions[i3 + 1] < -2) {
        positions[i3 + 1] = 20;
        positions[i3] = (Math.random() - 0.5) * 30;
        positions[i3 + 2] = (Math.random() - 0.5) * 30;
      }
    }
    
    geometry.attributes.position.needsUpdate = true;
    
    // 🔥 3. 修复报错的核心：旋转引用对象 (pointsRef.current)，而不是几何体
    if (pointsRef.current) {
        pointsRef.current.rotation.y = time * 0.02;
    }
  });

  // 🔥 4. 绑定 ref
  return <points ref={pointsRef} geometry={geometry} material={material} />;
};
// 这个角度大约是 0.39弧度 (约22度)，是数学上最完美的贴合角度。

// 💡 灯珠组件 (保持不变)
// src/components/ChristmasTree.jsx 中的 BulbSpiral 组件

const analyzeSpiralPath = (segments = 2000) => {
    let totalLength = 0;
    const distanceMap = [0]; // 记录每个采样点对应的累计距离
    let prevPos = getSpiralPoint(0);

    for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const currentPos = getSpiralPoint(t);
        const segmentLen = currentPos.distanceTo(prevPos);
        totalLength += segmentLen;
        distanceMap.push(totalLength);
        prevPos = currentPos;
    }
    return { totalLength, distanceMap, segments };
};

// 💡 终极版灯珠组件：匀速排列 + 自动计数 + 塑料彩球
const BulbSpiral = () => {
    // 🎛️ 控制台
    const BULB_RADIUS = 0.15; // 球半径
    const GAP_FACTOR = 1.00;  // 间隙系数 (1.0紧挨，1.1微缝，越小越密)

    // 1. 预计算螺旋线数据
    const { totalLength, distanceMap, segments } = useMemo(() => analyzeSpiralPath(), []);

    // 2. 根据实际总长度计算最合适的数量
    const count = Math.floor(totalLength / (BULB_RADIUS * 2 * GAP_FACTOR));

    const meshRef = useRef();
    const { phase } = useStore();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // 彩色盘
    const colors = useMemo(() => [
        new THREE.Color('#ff0055'), new THREE.Color('#00ffaa'), new THREE.Color('#ffcc00'),
        new THREE.Color('#00ccff'), new THREE.Color('#aa00ff'), new THREE.Color('#ff6600')
    ], []);

    useLayoutEffect(() => {
        if (!meshRef.current || count === 0) return;

        for (let i = 0; i < count; i++) {
            // --- 核心算法：根据距离找进度 t ---
            // 计算当前球应该在多远的距离
            const targetDist = (i / (count - 1 || 1)) * totalLength;

            // 在 distanceMap 中找到这个距离对应的索引 (简单的线性查找)
            let stepIndex = 0;
            while (stepIndex < segments && distanceMap[stepIndex] < targetDist) {
                stepIndex++;
            }
            
            // 插值计算精确的 t 值，确保平滑
            const lowerDist = distanceMap[stepIndex - 1] || 0;
            const upperDist = distanceMap[stepIndex] || totalLength;
            const segmentProgress = (targetDist - lowerDist) / (upperDist - lowerDist || 1);
            const t = (stepIndex - 1 + segmentProgress) / segments;
            
            // 获取修正后的位置
            const pos = getSpiralPoint(t);
            
            dummy.position.copy(pos);
            dummy.scale.setScalar(1); 
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
            meshRef.current.setColorAt(i, colors[i % colors.length]);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        meshRef.current.instanceColor.needsUpdate = true;
    }, [dummy, colors, count, distanceMap, segments, totalLength]); // 依赖项更新

    useFrame((state) => {
        if (!meshRef.current) return;
        const brightness = 1.2 + Math.sin(state.clock.elapsedTime * 4) * 0.8;
        meshRef.current.material.emissiveIntensity = brightness;
        meshRef.current.visible = (phase === 'tree' || phase === 'collapsing');
        meshRef.current.rotation.y = state.clock.elapsedTime * 0.1; 
    });

    return (
        <instancedMesh ref={meshRef} args={[null, null, count]}>
            <sphereGeometry args={[BULB_RADIUS, 16, 16]} /> 
            {/* 塑料材质 */}
            <meshStandardMaterial 
                emissive="#d3ccccff" emissiveIntensity={1} 
                roughness={0.2} metalness={0.6} toneMapped={false} 
            />
        </instancedMesh>
    );
};

// 📸 照片组件 (核心聚焦算法修改)
// src/components/ChristmasTree.jsx 中的 PhotoOrnament 组件

const PhotoOrnament = ({ url, index, total }) => {
  const texture = useTexture(url);
  const { phase, carouselRotation } = useStore(); 
  const groupRef = useRef();
  
  const t = index / total; 
  const spiralPos = getSpiralPoint(t); 
  const frontFocusPoint = useMemo(() => new THREE.Vector3(0, 0, NEBULA_RADIUS), []);

  // --- 🔧 核心参数 (保持你觉得不错的值) ---
  // 向外推的距离 (必须大于灯球半径 0.15)
  const NUDGE = 0.35; 
  // 向下挂的距离
  const DROP_OFFSET = 0.18; 
  // 倾斜角度
  const FIXED_TILT_ANGLE = THREE.MathUtils.degToRad(-1);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const isTreeState = (phase === 'tree' || phase === 'collapsing');

    if (isTreeState) {
      // --- 🌲 树形态 ---

      // 1. 计算基础旋转位置 (这一定与 BulbSpiral 的旋转完全同步)
      const currentSpiralYRotation = time * 0.1;
      const baseX = spiralPos.x * Math.cos(currentSpiralYRotation) - spiralPos.z * Math.sin(currentSpiralYRotation);
      const baseZ = spiralPos.x * Math.sin(currentSpiralYRotation) + spiralPos.z * Math.cos(currentSpiralYRotation);
      
      // 2. 计算方向向量
      const currentRadius = Math.sqrt(baseX * baseX + baseZ * baseZ);
      const dirX = currentRadius > 0.0001 ? baseX / currentRadius : 0;
      const dirZ = currentRadius > 0.0001 ? baseZ / currentRadius : 0;
      
      // 3. 计算最终目标位置
      const targetPos = new THREE.Vector3(
          baseX + dirX * NUDGE, 
          spiralPos.y - DROP_OFFSET, 
          baseZ + dirZ * NUDGE
      );
      
      // 🔥🔥🔥 核心修改 1：删除延迟，瞬间到位 🔥🔥🔥
      // 原来是：groupRef.current.position.lerp(targetPos, 0.08);
      // 现在改为直接复制，消除任何“果冻”滞后感
      groupRef.current.position.copy(targetPos);

      // 4. 朝向逻辑
      // 让照片看向外面中心点
      groupRef.current.lookAt(targetPos.x * 1.5, targetPos.y, targetPos.z * 1.5);

      // 5. 应用固定倾斜角
      groupRef.current.rotateX(FIXED_TILT_ANGLE); 
      
      // 🔥🔥🔥 核心修改 2：删除独立摆动 🔥🔥🔥
      // 注释掉或删除下面这行，让照片不再自己晃动
      // groupRef.current.rotateZ(Math.sin(time * 3 + index) * 0.01);

      // 恢复大小 (缩放可以用 lerp 保持平滑，不影响位置同步)
      groupRef.current.scale.lerp(new THREE.Vector3(PHOTO_SCALE_BASE*0.7, PHOTO_SCALE_BASE*0.7, PHOTO_SCALE_BASE*0.7), 0.1);

    } else {
      // --- ✨ 旋转木马形态 (保持不变，这里需要 lerp 来实现飞散效果) ---
      const angle = (index / total) * Math.PI * 2 + carouselRotation + Math.PI / 2;
      let targetX = Math.cos(angle) * NEBULA_RADIUS;
      let targetZ = Math.sin(angle) * NEBULA_RADIUS;
      groupRef.current.rotation.set(0, 0, 0);
      const tempTargetPos = new THREE.Vector3(targetX, 0, targetZ);
      const distanceToFront = tempTargetPos.distanceTo(frontFocusPoint);
      const normalizedDist = Math.min(distanceToFront / (NEBULA_RADIUS * 2), 1);
      const focusFactor = Math.pow(1 - normalizedDist, 3); 
      const dynamicScale = PHOTO_SCALE_BASE * (0.7 + focusFactor * 1.2);
      const forwardOffset = focusFactor * 3.0;
      targetZ += forwardOffset;
      // 照片墙形态依然需要平滑移动
      groupRef.current.position.lerp(new THREE.Vector3(targetX, 1.5, targetZ), 0.1);
      groupRef.current.scale.lerp(new THREE.Vector3(dynamicScale, dynamicScale, dynamicScale), 0.1);
    }
  });

  return (
    <group ref={groupRef}>
      {/* 保持锚点在顶部的结构不变 */}
      <group position={[0, -0.75, 0]}> 
        <mesh>
          <boxGeometry args={[1.22, 1.47, 0.03]} />
          <meshStandardMaterial color="#fff" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.1, 0.02]}>
          <planeGeometry args={[1.1, 1.1]} />
          <meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide}/>
        </mesh>
      </group>
    </group>
  );
};
// 粒子系统 (解决遮挡问题)
const ParticleSystem = () => {
    const meshRef = useRef();
    const { phase, setPhase } = useStore();
    const count = 4000;
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const treeData = useMemo(() => generateTreePoints(count, 3.0, 8), []); 
    // 🔥 4. 关键修改：大幅增加星云半径到 35，让它们远离照片墙 (原来是 12)
    const nebulaData = useMemo(() => generateNebulaPoints(count, 35), []);
    const progress = useRef({ value: 0 });

    useEffect(() => {
        if (phase === 'blooming') {
            gsap.to(progress.current, { 
                value: 1, duration: 2.5, ease: "power2.out",
                onComplete: () => setPhase('nebula') 
            });
        } else if (phase === 'collapsing') {
            gsap.to(progress.current, { 
                value: 0, duration: 2, ease: "power2.inOut",
                onComplete: () => setPhase('tree') 
            });
        }
    }, [phase, setPhase]);

    useFrame((state) => {
        if(!meshRef.current) return;
        const time = state.clock.getElapsedTime();
        for(let i=0; i<count; i++){
            const tPos = treeData[i];
            const nPos = nebulaData[i];
            dummy.position.lerpVectors(tPos, nPos, progress.current.value);
            if(progress.current.value < 0.1) {
                const angle = -time * 0.05; 
                const x = dummy.position.x; const z = dummy.position.z;
                dummy.position.x = x * Math.cos(angle) - z * Math.sin(angle);
                dummy.position.z = x * Math.sin(angle) + z * Math.cos(angle);
            }
            const scale = phase === 'tree' ? 1 : 1.5;
            dummy.scale.setScalar(scale);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[null, null, count]}>
            <sphereGeometry args={[0.035]} />
            <meshStandardMaterial color="#2f5d35" transparent opacity={0.8} />
        </instancedMesh>
    );
};

export const ChristmasTree = () => {
  // 🌟 新增：使用 useMemo 创建星星几何体
  // 参数 (0.5, 0.25) 控制星星的胖瘦，可以自己微调
  const starShape = useMemo(() => createStarShape(0.4, 0.20), []);
  const starGeometry = useMemo(() => new THREE.ExtrudeGeometry(starShape, starExtrudeSettings), [starShape]);
  
  
  useLayoutEffect(() => {
      starGeometry.center(); 
  }, [starGeometry])

  // 🌟 1. 新增：定义星星的引用
  const starRef = useRef();

  // 🌟 2. 新增：添加旋转动画
  useFrame((state) => {
    if (starRef.current) {
      // 让星星绕 Y 轴旋转
      // 0.1 是速度，要和 BulbSpiral 里的速度保持一致 (state.clock.elapsedTime * 0.1)
      starRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <>
      {/* ❄️ 这里添加雪花特效，放在树的外部，让它充满全屏 */}
      <Snowfall count={2000} />
    <group scale={[TREE_SCALE, TREE_SCALE, TREE_SCALE]} position={[0, -0.50, 0]}>
      <ParticleSystem />
      <BulbSpiral />
      {photoUrls.map((url, i) => (
        <PhotoOrnament key={i} url={url} index={i} total={photoUrls.length} />
      ))}
      
      {/* 👇👇👇 修改这里：加上 ref={starRef} 👇👇👇 */}
      <mesh 
        ref={starRef} 
        position={[0, 4.2, 0]} 
        rotation={[0, 0, 0]}
      >
        {/* 使用我们生成的挤压几何体 */}
        <primitive object={starGeometry} attach="geometry" />
        
        {/* 材质 */}
        <meshStandardMaterial 
            color="#ffd700" 
            emissive="#ffaa00"
            emissiveIntensity={0.5}
            roughness={0.1}
            metalness={0.8}
            toneMapped={false} 
        />

        {/* 光源 */}
        <pointLight intensity={2} distance={15} color="#ffff00" />
        
        {/* 外部辉光圈 (作为星星的子元素，它会自动跟着星星转) */}
        <mesh rotation={[0, 0, 0]} scale={[1.1,1.1,1.1]}>
             <sphereGeometry args={[0.5]} />
             <meshBasicMaterial color="#ffff00" transparent opacity={0.1} toneMapped={false} />
        </mesh>
      </mesh>
    </group>
    </>
  );
};