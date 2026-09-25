import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';

export const Interactive3DCake: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isBlown, setIsBlown] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // References for mouse tracking
  const mouseTargetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isBlownRef = useRef<boolean>(false);
  isBlownRef.current = isBlown;

  // Sound chime helper
  const playWishChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.65);
      });
    } catch {}
  };

  const handleCakeClick = () => {
    setIsBlown(true);
    playWishChime();
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#F43F5E', '#EC4899', '#FBBF24', '#FDE047', '#E2BD77', '#FFFFFF'],
    });

    setTimeout(() => {
      setIsBlown(false);
    }, 4500);
  };

  // Cursor movement listener
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!mountRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const nx = (e.clientX - centerX) / (window.innerWidth / 2);
      const ny = (e.clientY - centerY) / (window.innerHeight / 2);

      // Clamp rotation angles so it turns in the direction of the cursor
      mouseTargetRef.current = {
        x: Math.max(-0.5, Math.min(0.5, ny)),
        y: Math.max(-0.85, Math.min(0.85, nx)),
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Three.js Realistic 3-Tier Layer Cake
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = 440;
    const height = 440;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 1000);
    camera.position.set(0, 1.45, 4.4);
    camera.lookAt(0, 0.1, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. High-Fashion Colors (Haute Couture Pink & Champagne Gold)
    const colorFrostingRose = new THREE.Color('#f472b6');
    const colorFrostingRaspberry = new THREE.Color('#ec4899');
    const colorVelvetCream = new THREE.Color('#fff7ed');
    const colorGoldChampagne = new THREE.Color('#e2bd77');

    // 3. Root Interactive 3-Tier Cake Group
    const cakeGroup = new THREE.Group();
    cakeGroup.position.y = -0.35;
    scene.add(cakeGroup);

    // Procedural Buttercream Texture for cake sides
    const creamCanvas = document.createElement('canvas');
    creamCanvas.width = 512;
    creamCanvas.height = 256;
    const cctx = creamCanvas.getContext('2d');
    if (cctx) {
      cctx.fillStyle = '#ffffff';
      cctx.fillRect(0, 0, 512, 256);

      for (let y = 10; y < 256; y += 14) {
        cctx.strokeStyle = 'rgba(253, 242, 248, 0.6)';
        cctx.lineWidth = 4;
        cctx.beginPath();
        cctx.moveTo(0, y + Math.sin(y) * 4);
        cctx.bezierCurveTo(128, y - 6, 256, y + 8, 512, y + Math.sin(y) * 4);
        cctx.stroke();
      }

      for (let i = 0; i < 90; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 256;
        cctx.fillStyle = 'rgba(226, 189, 119, 0.65)';
        cctx.beginPath();
        cctx.arc(x, y, Math.random() * 2.5 + 1, 0, Math.PI * 2);
        cctx.fill();
      }
    }
    const creamTexture = new THREE.CanvasTexture(creamCanvas);
    creamTexture.wrapS = THREE.RepeatWrapping;
    creamTexture.wrapT = THREE.ClampToEdgeWrapping;

    // Materials
    const goldPlateMat = new THREE.MeshStandardMaterial({
      color: colorGoldChampagne,
      metalness: 0.9,
      roughness: 0.18,
    });

    const tierBottomMat = new THREE.MeshPhysicalMaterial({
      color: colorFrostingRaspberry,
      map: creamTexture,
      roughness: 0.35,
      metalness: 0.08,
      clearcoat: 0.45,
      clearcoatRoughness: 0.3,
      sheen: 0.6,
      sheenColor: colorFrostingRaspberry,
    });

    const tierMiddleMat = new THREE.MeshPhysicalMaterial({
      color: colorVelvetCream,
      map: creamTexture,
      roughness: 0.28,
      metalness: 0.05,
      clearcoat: 0.55,
      clearcoatRoughness: 0.2,
    });

    const tierTopMat = new THREE.MeshPhysicalMaterial({
      color: colorFrostingRose,
      map: creamTexture,
      roughness: 0.32,
      metalness: 0.08,
      clearcoat: 0.5,
      clearcoatRoughness: 0.25,
      sheen: 0.7,
      sheenColor: colorFrostingRose,
    });

    const goldRibbonMat = new THREE.MeshStandardMaterial({
      color: colorGoldChampagne,
      metalness: 0.88,
      roughness: 0.22,
    });

    const pearlPipMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.2,
      metalness: 0.15,
    });

    // Stand
    const standPlateGeo = new THREE.CylinderGeometry(1.68, 1.62, 0.08, 64);
    const standPlate = new THREE.Mesh(standPlateGeo, goldPlateMat);
    standPlate.position.y = -0.04;
    standPlate.receiveShadow = true;
    standPlate.castShadow = true;
    cakeGroup.add(standPlate);

    const standStemGeo = new THREE.CylinderGeometry(0.55, 0.85, 0.22, 32);
    const standStem = new THREE.Mesh(standStemGeo, goldPlateMat);
    standStem.position.y = -0.18;
    standStem.receiveShadow = true;
    standStem.castShadow = true;
    cakeGroup.add(standStem);

    // TIER 1
    const t1Height = 0.48;
    const t1Radius = 1.38;
    const t1Geo = new THREE.CylinderGeometry(t1Radius, t1Radius, t1Height, 64);
    const tier1 = new THREE.Mesh(t1Geo, tierBottomMat);
    tier1.position.y = t1Height / 2;
    tier1.castShadow = true;
    tier1.receiveShadow = true;
    cakeGroup.add(tier1);

    const t1RibbonGeo = new THREE.TorusGeometry(t1Radius + 0.015, 0.032, 16, 64);
    const t1Ribbon = new THREE.Mesh(t1RibbonGeo, goldRibbonMat);
    t1Ribbon.rotation.x = Math.PI / 2;
    t1Ribbon.position.y = 0.02;
    cakeGroup.add(t1Ribbon);

    const pearlCount1 = 36;
    const pearlGeo = new THREE.SphereGeometry(0.038, 12, 12);
    for (let i = 0; i < pearlCount1; i++) {
      const angle = (i / pearlCount1) * Math.PI * 2;
      const pearl = new THREE.Mesh(pearlGeo, pearlPipMat);
      pearl.position.set(
        Math.cos(angle) * (t1Radius - 0.02),
        t1Height,
        Math.sin(angle) * (t1Radius - 0.02)
      );
      cakeGroup.add(pearl);
    }

    // TIER 2
    const t2Height = 0.44;
    const t2Radius = 1.0;
    const t2Y = t1Height + t2Height / 2;
    const t2Geo = new THREE.CylinderGeometry(t2Radius, t2Radius, t2Height, 64);
    const tier2 = new THREE.Mesh(t2Geo, tierMiddleMat);
    tier2.position.y = t2Y;
    tier2.castShadow = true;
    tier2.receiveShadow = true;
    cakeGroup.add(tier2);

    const t2RibbonGeo = new THREE.TorusGeometry(t2Radius + 0.015, 0.03, 16, 64);
    const t2Ribbon = new THREE.Mesh(t2RibbonGeo, goldRibbonMat);
    t2Ribbon.rotation.x = Math.PI / 2;
    t2Ribbon.position.y = t1Height + 0.02;
    cakeGroup.add(t2Ribbon);

    const pearlCount2 = 28;
    for (let i = 0; i < pearlCount2; i++) {
      const angle = (i / pearlCount2) * Math.PI * 2;
      const pearl = new THREE.Mesh(pearlGeo, pearlPipMat);
      pearl.position.set(
        Math.cos(angle) * (t2Radius - 0.02),
        t1Height + t2Height,
        Math.sin(angle) * (t2Radius - 0.02)
      );
      cakeGroup.add(pearl);
    }

    // TIER 3
    const t3Height = 0.40;
    const t3Radius = 0.65;
    const t3Y = t1Height + t2Height + t3Height / 2;
    const t3Geo = new THREE.CylinderGeometry(t3Radius, t3Radius, t3Height, 64);
    const tier3 = new THREE.Mesh(t3Geo, tierTopMat);
    tier3.position.y = t3Y;
    tier3.castShadow = true;
    tier3.receiveShadow = true;
    cakeGroup.add(tier3);

    const t3RibbonGeo = new THREE.TorusGeometry(t3Radius + 0.012, 0.026, 16, 64);
    const t3Ribbon = new THREE.Mesh(t3RibbonGeo, goldRibbonMat);
    t3Ribbon.rotation.x = Math.PI / 2;
    t3Ribbon.position.y = t1Height + t2Height + 0.02;
    cakeGroup.add(t3Ribbon);

    const rosetteCount = 18;
    const rosetteGeo = new THREE.SphereGeometry(0.045, 12, 12);
    for (let i = 0; i < rosetteCount; i++) {
      const angle = (i / rosetteCount) * Math.PI * 2;
      const rosette = new THREE.Mesh(rosetteGeo, pearlPipMat);
      rosette.position.set(
        Math.cos(angle) * (t3Radius - 0.02),
        t1Height + t2Height + t3Height,
        Math.sin(angle) * (t3Radius - 0.02)
      );
      cakeGroup.add(rosette);
    }

    // Macarons
    const macaronCount = 5;
    const macaronGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.06, 24);
    const macaronMat = new THREE.MeshStandardMaterial({
      color: '#f43f5e',
      roughness: 0.4,
    });
    for (let m = 0; m < macaronCount; m++) {
      const ang = (m / macaronCount) * Math.PI * 2 + 0.3;
      const macaron = new THREE.Mesh(macaronGeo, macaronMat);
      macaron.position.set(
        Math.cos(ang) * 0.38,
        t1Height + t2Height + t3Height + 0.04,
        Math.sin(ang) * 0.38
      );
      macaron.rotation.x = 0.2;
      macaron.rotation.z = Math.sin(m) * 0.2;
      cakeGroup.add(macaron);
    }

    // Candle
    const candleGroup = new THREE.Group();
    const candleBaseY = t1Height + t2Height + t3Height;
    candleGroup.position.set(0, candleBaseY, 0);
    cakeGroup.add(candleGroup);

    const holderGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.04, 24);
    const holder = new THREE.Mesh(holderGeo, goldRibbonMat);
    holder.position.y = 0.02;
    candleGroup.add(holder);

    const pillarGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.42, 24);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.35,
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = 0.23;
    pillar.castShadow = true;
    candleGroup.add(pillar);

    const wickGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.06, 8);
    const wickMat = new THREE.MeshBasicMaterial({ color: '#27272a' });
    const wick = new THREE.Mesh(wickGeo, wickMat);
    wick.position.y = 0.46;
    candleGroup.add(wick);

    const flameGeo = new THREE.ConeGeometry(0.04, 0.16, 16);
    flameGeo.translate(0, 0.08, 0);
    const flameMat = new THREE.MeshStandardMaterial({
      color: '#ffedd5',
      emissive: '#f59e0b',
      emissiveIntensity: 2.4,
      roughness: 0.1,
    });
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.position.y = 0.48;
    candleGroup.add(flameMesh);

    const flameLight = new THREE.PointLight('#fbbf24', 2.0, 4.5);
    flameLight.position.y = 0.55;
    flameLight.castShadow = true;
    candleGroup.add(flameLight);

    const smokePuffs: { mesh: THREE.Mesh; startY: number; life: number }[] = [];
    const smokeGeo = new THREE.SphereGeometry(0.024, 8, 8);
    const smokeMat = new THREE.MeshBasicMaterial({ color: '#cbd5e1', transparent: true, opacity: 0.45 });

    for (let s = 0; s < 5; s++) {
      const sm = new THREE.Mesh(smokeGeo, smokeMat.clone());
      sm.visible = false;
      candleGroup.add(sm);
      smokePuffs.push({ mesh: sm, startY: 0.5, life: s * 0.2 });
    }

    // Orbiting Sparkles
    const sparklesCount = 60;
    const sparkleGeo = new THREE.DodecahedronGeometry(0.026, 0);
    const sparkleMats = [
      new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.9, roughness: 0.15 }),
      new THREE.MeshStandardMaterial({ color: '#ec4899', metalness: 0.6, roughness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2, metalness: 0.1 }),
    ];

    const sparkleParticles: { mesh: THREE.Mesh; angle: number; radius: number; speed: number; y: number }[] = [];

    for (let p = 0; p < sparklesCount; p++) {
      const spMat = sparkleMats[p % sparkleMats.length];
      const spMesh = new THREE.Mesh(sparkleGeo, spMat);
      const radius = 1.6 + Math.random() * 0.8;
      const angle = (p / sparklesCount) * Math.PI * 2;
      const y = Math.random() * 1.6 - 0.2;

      spMesh.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      cakeGroup.add(spMesh);

      sparkleParticles.push({
        mesh: spMesh,
        angle,
        radius,
        speed: (0.004 + Math.random() * 0.006) * (p % 2 === 0 ? 1 : -1),
        y,
      });
    }

    // Lighting
    const keyLight = new THREE.DirectionalLight('#fff1f2', 2.6);
    keyLight.position.set(4, 6, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight('#f472b6', 1.3);
    fillLight.position.set(-4, 1, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight('#fef08a', 2.2);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    const ambientLight = new THREE.AmbientLight('#18181b', 0.9);
    scene.add(ambientLight);

    // Floor Shadow Disk
    const shadowDiskGeo = new THREE.PlaneGeometry(3.6, 3.6);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext('2d');
    if (sctx) {
      const g = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(0,0,0,0.8)');
      g.addColorStop(0.35, 'rgba(236,72,153,0.18)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      sctx.fillStyle = g;
      sctx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowDisk = new THREE.Mesh(shadowDiskGeo, shadowMat);
    shadowDisk.rotation.x = -Math.PI / 2;
    shadowDisk.position.y = -0.52;
    scene.add(shadowDisk);

    // Animation Loop
    let animFrameId: number;
    let clock = new THREE.Clock();

    let curRotX = 0.12;
    let curRotY = 0;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      const targetRotX = mouseTargetRef.current.x * 0.45 + 0.12;
      const targetRotY = mouseTargetRef.current.y * 0.85;

      curRotX += (targetRotX - curRotX) * 0.06;
      curRotY += (targetRotY - curRotY) * 0.06;

      cakeGroup.rotation.x = curRotX;
      cakeGroup.rotation.y = curRotY + time * 0.18;

      cakeGroup.position.y = -0.35 + Math.sin(time * 1.6) * 0.03;
      shadowDisk.scale.setScalar(1 - Math.sin(time * 1.6) * 0.05);

      sparkleParticles.forEach(p => {
        p.angle += p.speed;
        p.mesh.position.x = Math.cos(p.angle) * p.radius;
        p.mesh.position.z = Math.sin(p.angle) * p.radius;
        p.mesh.rotation.x += 0.02;
        p.mesh.rotation.y += 0.03;
      });

      if (!isBlownRef.current) {
        flameMesh.visible = true;
        flameLight.visible = true;
        const flicker = Math.sin(time * 15) * 0.05 + Math.cos(time * 24) * 0.03;
        flameMesh.scale.set(1 + flicker * 0.5, 1 + Math.sin(time * 18) * 0.15, 1 + flicker * 0.5);
        flameMesh.rotation.z = Math.sin(time * 9) * 0.1;
        flameLight.intensity = 2.0 + Math.sin(time * 20) * 0.4;
        smokePuffs.forEach(sp => (sp.mesh.visible = false));
      } else {
        flameMesh.visible = false;
        flameLight.visible = false;

        smokePuffs.forEach(sp => {
          sp.mesh.visible = true;
          sp.life += delta * 1.2;
          if (sp.life > 1) sp.life = 0;
          sp.mesh.position.y = sp.startY + sp.life * 0.32;
          sp.mesh.position.x = Math.sin(sp.life * 4) * 0.04;
          const sScale = 0.6 + sp.life * 1.2;
          sp.mesh.scale.set(sScale, sScale, sScale);
          (sp.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - sp.life) * 0.45;
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameId);
      renderer.dispose();
      t1Geo.dispose();
      t2Geo.dispose();
      t3Geo.dispose();
      creamTexture.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        mouseTargetRef.current = { x: 0, y: 0 };
      }}
      onClick={handleCakeClick}
      className="relative w-full max-w-[440px] mx-auto select-none cursor-pointer group flex flex-col items-center justify-center transition-transform duration-300 hover:scale-[1.02]"
    >
      {/* ONLY badge text with the cake: Click to blow candle */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center text-xs backdrop-blur-xl bg-black/75 px-4 py-2 rounded-full border border-white/15 shadow-2xl transition-all group-hover:border-pink-500/40 z-10 whitespace-nowrap">
        <span className="text-xs font-bold tracking-wider uppercase text-amber-300 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30">
          {isBlown ? 'Wish Released! ✨' : 'Click to blow candle'}
        </span>
      </div>
    </div>
  );
};
