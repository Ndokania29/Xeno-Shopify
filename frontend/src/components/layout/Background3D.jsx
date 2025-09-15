import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Background3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // Softer, smaller cubes with subtle color
    const geometry = new THREE.BoxGeometry(0.7,0.7,0.7);
    const material = new THREE.MeshStandardMaterial({ color: 0x4CC38A, metalness: 0.1, roughness: 0.9, transparent: true, opacity: 0.08 });
    const cubes = [];
    for (let i = 0; i < 36; i++) {
      const cube = new THREE.Mesh(geometry, material.clone());
      cube.position.set((Math.random()-0.5)*18, (Math.random()-0.5)*10, (Math.random()-0.5)*18);
      cube.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
      cube.material.color.offsetHSL(0, 0, (Math.random()-0.5)*0.2);
      cubes.push(cube);
      scene.add(cube);
    }

    const light = new THREE.DirectionalLight(0xffffff, 0.4);
    light.position.set(5,10,7);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    camera.position.z = 14;

    const onResize = () => {
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
    };
    const onMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      camera.position.x = x * 2.5;
      camera.position.y = -y * 1.3;
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouseMove);

    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      cubes.forEach((c, i) => { c.rotation.y += 0.001 + i*0.00005; c.rotation.x += 0.0006; });
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />;
}


