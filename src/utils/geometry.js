import * as THREE from 'three';

// 生成圆锥体点云 (树形态)
export const generateTreePoints = (count = 5000, radius = 2, height = 5) => {
  const points = [];
  for (let i = 0; i < count; i++) {
    const y = (Math.random() - 0.5) * height; // 高度分布
    const percent = (y + height / 2) / height; // 0 (底部) -> 1 (顶部)
    const r = (1 - percent) * radius; // 顶部半径小，底部大
    
    // 螺旋分布优化
    const theta = i * 0.1 + Math.random() * 0.5; 
    const x = r * Math.cos(theta) * Math.random(); // 内部填充
    const z = r * Math.sin(theta) * Math.random();
    
    points.push(new THREE.Vector3(x, y, z));
  }
  return points;
};

// 生成环形星云点云 (星云形态)
export const generateNebulaPoints = (count = 5000, radius = 6) => {
  const points = [];
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    // 环形分布，带有一定的随机厚度
    const r = radius + (Math.random() - 0.5) * 2; 
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = (Math.random() - 0.5) * 1.5; // 扁平化
    
    points.push(new THREE.Vector3(x, y, z));
  }
  return points;
};