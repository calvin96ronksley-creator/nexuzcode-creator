import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { NetworkConnection, LocalOrigin } from '../types/network';
import { RotateCw, ZoomIn, ZoomOut, Compass, Crosshair, Pause, Play } from 'lucide-react';

interface NetworkGlobe3DProps {
  connections: NetworkConnection[];
  localOrigin: LocalOrigin;
  selectedConnection: NetworkConnection | null;
  onSelectConnection: (conn: NetworkConnection) => void;
  hoveredConnectionId: string | null;
  onHoverConnection: (id: string | null) => void;
}

// Convert Geo coordinates to 3D Cartesian coordinates on sphere
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Create a procedural high-tech world landmass texture on canvas
function createProceduralEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Deep dark space background
  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle lat/long coordinate grid lines
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
  ctx.lineWidth = 1;
  const stepX = canvas.width / 24;
  const stepY = canvas.height / 12;

  for (let x = 0; x <= canvas.width; x += stepX) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += stepY) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Draw simplified high-contrast tech continent landmasses using geometric paths
  ctx.fillStyle = 'rgba(14, 165, 233, 0.22)';
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
  ctx.lineWidth = 1.5;

  // Approximate world land outlines on equirectangular projection
  const continents: [number, number][][] = [
    // Europe
    [[980, 220], [1050, 210], [1120, 240], [1110, 310], [1040, 330], [980, 290]],
    // Scandinavia & UK
    [[990, 150], [1040, 140], [1060, 200], [1010, 210]],
    [[930, 230], [960, 220], [950, 270], [920, 260]],
    // Africa
    [[970, 350], [1100, 350], [1160, 440], [1140, 580], [1050, 680], [980, 520], [940, 410]],
    // Asia
    [[1120, 240], [1350, 200], [1500, 240], [1620, 290], [1550, 420], [1380, 450], [1240, 420], [1130, 320]],
    // India
    [[1300, 420], [1360, 420], [1330, 520], [1280, 460]],
    // Japan
    [[1630, 280], [1670, 330], [1650, 380], [1620, 340]],
    // Australia & NZ
    [[1520, 620], [1680, 610], [1670, 750], [1520, 720]],
    [[1710, 740], [1730, 790], [1700, 800]],
    // North America
    [[350, 180], [550, 160], [680, 210], [600, 340], [450, 380], [380, 320]],
    // Central & South America
    [[450, 390], [520, 420], [490, 480]],
    [[510, 490], [620, 520], [600, 700], [520, 800], [480, 640]],
  ];

  continents.forEach(path => {
    ctx.beginPath();
    ctx.moveTo(path[0][0], path[0][1]);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i][0], path[i][1]);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  // Futuristic dot matrix grid covering continents for high-tech holographic look
  ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
  for (let x = 0; x < canvas.width; x += 16) {
    for (let y = 0; y < canvas.height; y += 16) {
      // Check if point is inside any continent
      for (const poly of continents) {
        if (isPointInPoly(x, y, poly)) {
          ctx.beginPath();
          ctx.arc(x, y, 1.8, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function isPointInPoly(x: number, y: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export const NetworkGlobe3D: React.FC<NetworkGlobe3DProps> = ({
  connections,
  localOrigin,
  selectedConnection,
  onSelectConnection,
  hoveredConnectionId,
  onHoverConnection,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    conn: NetworkConnection | null;
  }>({ visible: false, x: 0, y: 0, conn: null });

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const nodeMeshesRef = useRef<{ mesh: THREE.Mesh; conn: NetworkConnection; ring: THREE.Mesh }[]>([]);
  const packetParticlesRef = useRef<{
    particle: THREE.Mesh;
    curve: THREE.CubicBezierCurve3;
    progress: number;
    speed: number;
    connId: string;
  }[]>([]);
  const arcsGroupRef = useRef<THREE.Group | null>(null);
  const targetCameraPosRef = useRef<THREE.Vector3 | null>(null);
  const targetControlsAngleRef = useRef<{ rotY: number; rotX: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const globeRadius = 100;

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Atmospheric camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
    camera.position.set(0, 50, 310);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Lighting: studio neon setup
    const ambientLight = new THREE.AmbientLight(0x0e243d, 2.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    keyLight.position.set(200, 200, 150);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x818cf8, 1.8);
    rimLight.position.set(-200, -100, -150);
    scene.add(rimLight);

    const purpleLight = new THREE.PointLight(0xa855f7, 3, 500);
    purpleLight.position.set(0, 180, 100);
    scene.add(purpleLight);

    // Master Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // 1. Core Sphere with procedural world texture
    const earthTexture = createProceduralEarthTexture();
    const sphereGeo = new THREE.SphereGeometry(globeRadius, 64, 64);
    const sphereMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.6,
      metalness: 0.3,
      emissive: new THREE.Color(0x06152b),
      emissiveIntensity: 0.4,
    });
    const earthMesh = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(earthMesh);

    // 2. Wireframe / Longitude-Latitude holographic grid overlay
    const wireframeGeo = new THREE.SphereGeometry(globeRadius + 0.6, 36, 18);
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.07,
    });
    const wireframeMesh = new THREE.Mesh(wireframeGeo, wireframeMat);
    globeGroup.add(wireframeMesh);

    // 3. Glowing Atmosphere Glow Shell
    const atmosGeo = new THREE.SphereGeometry(globeRadius + 8, 48, 48);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // 4. Background Starfield / Particle dust
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 800;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 1600;
      starPositions[i + 1] = (Math.random() - 0.5) * 1600;
      starPositions[i + 2] = (Math.random() - 0.5) * 1600;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 1.5,
      transparent: true,
      opacity: 0.4,
    });
    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    // Group for arcs and data packets
    const arcsGroup = new THREE.Group();
    globeGroup.add(arcsGroup);
    arcsGroupRef.current = arcsGroup;

    // WebGL Context listeners
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('WebGL Context Lost');
    };
    const handleContextRestored = () => {
      console.info('WebGL Context Restored');
    };
    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Auto rotation when not dragging and enabled
      if (globeGroupRef.current && autoRotate && !isDraggingRef.current && !targetCameraPosRef.current) {
        globeGroupRef.current.rotation.y += 0.0025;
      }

      // Smooth camera interpolation towards selected node
      if (targetCameraPosRef.current && cameraRef.current) {
        cameraRef.current.position.lerp(targetCameraPosRef.current, 0.05);
        if (cameraRef.current.position.distanceTo(targetCameraPosRef.current) < 2) {
          targetCameraPosRef.current = null;
        }
      }

      // Pulse node rings
      nodeMeshesRef.current.forEach(({ ring }, idx) => {
        const scale = 1 + 0.3 * Math.sin(elapsedTime * 4 + idx);
        ring.scale.set(scale, scale, 1);
      });

      // Animate packet pulses along curves
      packetParticlesRef.current.forEach(item => {
        item.progress += item.speed * delta;
        if (item.progress > 1) {
          item.progress = 0;
        }
        const point = item.curve.getPoint(item.progress);
        item.particle.position.copy(point);
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      earthTexture.dispose();
      wireframeGeo.dispose();
      wireframeMat.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
      starsGeo.dispose();
      starsMat.dispose();
    };
  }, []);

  // Update Nodes, Local Origin Marker and Arcs whenever connections change
  useEffect(() => {
    if (!globeGroupRef.current || !arcsGroupRef.current) return;
    const globeGroup = globeGroupRef.current;
    const arcsGroup = arcsGroupRef.current;

    // Clear previous dynamic items
    nodeMeshesRef.current.forEach(item => {
      globeGroup.remove(item.mesh);
      globeGroup.remove(item.ring);
      item.mesh.geometry.dispose();
      (item.mesh.material as THREE.Material).dispose();
      item.ring.geometry.dispose();
      (item.ring.material as THREE.Material).dispose();
    });
    nodeMeshesRef.current = [];

    // Clear packet particles
    packetParticlesRef.current.forEach(p => {
      arcsGroup.remove(p.particle);
      p.particle.geometry.dispose();
      (p.particle.material as THREE.Material).dispose();
    });
    packetParticlesRef.current = [];

    // Clear old arc meshes
    while (arcsGroup.children.length > 0) {
      const child = arcsGroup.children[0] as THREE.Line;
      arcsGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) (child.material as THREE.Material).dispose();
    }

    // 1. Add Local Origin Marker (Client in Frankfurt)
    const originPos = latLngToVector3(localOrigin.lat, localOrigin.lng, globeRadius + 1.2);
    const originGeo = new THREE.SphereGeometry(2.4, 16, 16);
    const originMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const originMesh = new THREE.Mesh(originGeo, originMat);
    originMesh.position.copy(originPos);
    globeGroup.add(originMesh);

    // Glowing beacon cylinder projecting upward from local host
    const beaconGeo = new THREE.CylinderGeometry(0.4, 0.4, 14, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.8 });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.copy(originPos.clone().multiplyScalar(1.05));
    beaconMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), originPos.clone().normalize());
    globeGroup.add(beaconMesh);

    // 2. Add Destination Node Markers
    connections.forEach(conn => {
      const pos = latLngToVector3(conn.lat, conn.lng, globeRadius + 1.2);

      // Color coding based on status & protocol
      let nodeColor = 0x38bdf8; // Default bright cyan
      if (conn.status === 'warning') {
        nodeColor = 0xf59e0b; // Amber
      } else if (conn.protocol === 'DNS') {
        nodeColor = 0x10b981; // Emerald
      } else if (conn.protocol === 'QUIC') {
        nodeColor = 0x06b6d4; // Cyan
      } else if (conn.type === 'cloud' || conn.type === 'api') {
        nodeColor = 0xa855f7; // Purple
      }

      const isSelected = selectedConnection?.id === conn.id;
      const isHovered = hoveredConnectionId === conn.id;

      const nodeRadius = isSelected ? 3.0 : isHovered ? 2.4 : 1.8;
      const nodeGeo = new THREE.SphereGeometry(nodeRadius, 16, 16);
      const nodeMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0xffffff : nodeColor,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.copy(pos);
      nodeMesh.userData = { connectionId: conn.id, connection: conn };
      globeGroup.add(nodeMesh);

      // Pulsing Ring around node
      const ringGeo = new THREE.RingGeometry(nodeRadius * 1.3, nodeRadius * 2.1, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: nodeColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isSelected ? 0.9 : 0.4,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos.clone().multiplyScalar(1.01));
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      globeGroup.add(ringMesh);

      nodeMeshesRef.current.push({ mesh: nodeMesh, conn, ring: ringMesh });

      // 3. Build Geodesic 3D Arcs from Local Origin to this node
      const destPos = pos;
      const distance = originPos.distanceTo(destPos);

      // Calculate an elevated midpoint curve above the globe surface
      const midPoint = new THREE.Vector3().addVectors(originPos, destPos).multiplyScalar(0.5);
      const elevationMultiplier = 1.0 + Math.min(0.5, (distance / (globeRadius * 2)) * 0.45);
      midPoint.normalize().multiplyScalar(globeRadius * elevationMultiplier);

      // Create smooth Bezier curve
      const control1 = new THREE.Vector3().lerpVectors(originPos, midPoint, 0.5).normalize().multiplyScalar(globeRadius * (elevationMultiplier * 0.95));
      const control2 = new THREE.Vector3().lerpVectors(destPos, midPoint, 0.5).normalize().multiplyScalar(globeRadius * (elevationMultiplier * 0.95));
      const curve = new THREE.CubicBezierCurve3(originPos, control1, control2, destPos);

      const points = curve.getPoints(50);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points);

      const arcMat = new THREE.LineBasicMaterial({
        color: isSelected ? 0x22d3ee : isHovered ? 0xa855f7 : nodeColor,
        transparent: true,
        opacity: isSelected ? 0.95 : isHovered ? 0.8 : 0.28,
        linewidth: isSelected ? 3 : 1,
      });

      const arcLine = new THREE.Line(arcGeo, arcMat);
      arcsGroup.add(arcLine);

      // 4. Data Packet Particle running on this curve
      const packetGeo = new THREE.SphereGeometry(isSelected ? 1.4 : 0.9, 8, 8);
      const packetMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0x38bdf8 : nodeColor,
      });
      const packetParticle = new THREE.Mesh(packetGeo, packetMat);
      arcsGroup.add(packetParticle);

      // Speed inversely proportional to latency for realistic traffic physics
      const baseSpeed = Math.max(0.15, Math.min(0.9, 45 / (conn.latencyMs || 50)));

      packetParticlesRef.current.push({
        particle: packetParticle,
        curve,
        progress: Math.random(),
        speed: baseSpeed,
        connId: conn.id,
      });
    });
  }, [connections, localOrigin, selectedConnection, hoveredConnectionId]);

  // Smoothly glide camera when selected connection changes
  useEffect(() => {
    if (!selectedConnection || !cameraRef.current) return;
    const destPos = latLngToVector3(selectedConnection.lat, selectedConnection.lng, globeRadius);
    // Position camera along the vector pointing outward from the globe, slightly elevated
    const normal = destPos.clone().normalize();
    const newCameraPos = normal.multiplyScalar(240).add(new THREE.Vector3(0, 30, 0));
    targetCameraPosRef.current = newCameraPos;
  }, [selectedConnection]);

  // Mouse interaction: Raycasting for hover & click selection
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Handle Globe Drag Orbiting
    if (isDraggingRef.current && globeGroupRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;
      globeGroupRef.current.rotation.y += deltaX * 0.005;
      globeGroupRef.current.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globeGroupRef.current.rotation.x + deltaY * 0.005));
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Raycasting for connection nodes
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
    const meshes = nodeMeshesRef.current.map(n => n.mesh);
    const intersects = raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const conn = hit.object.userData.connection as NetworkConnection;
      canvas.style.cursor = 'pointer';
      onHoverConnection(conn.id);
      setTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        conn,
      });
    } else {
      canvas.style.cursor = isDraggingRef.current ? 'grabbing' : 'grab';
      onHoverConnection(null);
      setTooltip(prev => ({ ...prev, visible: false }));
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grabbing';
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab';
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
    const meshes = nodeMeshesRef.current.map(n => n.mesh);
    const intersects = raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const conn = hit.object.userData.connection as NetworkConnection;
      onSelectConnection(conn);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!cameraRef.current) return;
    const zoomDelta = e.deltaY * 0.15;
    const currentDist = cameraRef.current.position.length();
    const newDist = Math.max(160, Math.min(520, currentDist + zoomDelta));
    cameraRef.current.position.setLength(newDist);
  };

  const handleResetCamera = useCallback(() => {
    if (!cameraRef.current || !globeGroupRef.current) return;
    targetCameraPosRef.current = new THREE.Vector3(0, 50, 310);
    globeGroupRef.current.rotation.set(0, 0, 0);
  }, []);

  const handleFocusOrigin = useCallback(() => {
    const originPos = latLngToVector3(localOrigin.lat, localOrigin.lng, globeRadius);
    const normal = originPos.clone().normalize();
    targetCameraPosRef.current = normal.multiplyScalar(240).add(new THREE.Vector3(0, 20, 0));
  }, [localOrigin]);

  const handleZoom = (direction: 'in' | 'out') => {
    if (!cameraRef.current) return;
    const factor = direction === 'in' ? 0.82 : 1.22;
    const currentDist = cameraRef.current.position.length();
    const newDist = Math.max(160, Math.min(520, currentDist * factor));
    cameraRef.current.position.setLength(newDist);
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className="relative w-full h-full select-none overflow-hidden bg-[#030712]"
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          isDraggingRef.current = false;
          setTooltip(prev => ({ ...prev, visible: false }));
        }}
        onClick={handleClick}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
      />

      {/* Floating 3D Navigation HUD Toolbar */}
      <div className="absolute bottom-6 left-6 z-20 flex items-center gap-1.5 p-1.5 bg-slate-950/80 backdrop-blur-md border border-cyan-500/20 rounded-xl shadow-2xl">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          title={autoRotate ? "Auto-Rotation pausieren" : "Auto-Rotation starten"}
          className={`p-2 rounded-lg text-xs font-medium transition-colors ${
            autoRotate ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          onClick={handleResetCamera}
          title="Kamera zurücksetzen"
          className="p-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button
          onClick={handleFocusOrigin}
          title="Fokus auf lokalen Gateway-Knoten (Frankfurt)"
          className="p-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-800 mx-1" />

        <button
          onClick={() => handleZoom('in')}
          title="Heranzoomen"
          className="p-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleZoom('out')}
          title="Herauszoomen"
          className="p-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Compass / Orientation Marker */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-950/70 backdrop-blur-md border border-slate-800 rounded-lg text-xs text-slate-400 font-mono">
        <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '24s' }} />
        <span className="text-cyan-400">3D GLOBE</span>
        <span>·</span>
        <span>LAT {localOrigin.lat.toFixed(2)}° N</span>
        <span>·</span>
        <span>LON {localOrigin.lng.toFixed(2)}° E</span>
      </div>

      {/* Tooltip on Node Hover */}
      {tooltip.visible && tooltip.conn && (
        <div
          style={{
            left: `${tooltip.x + 14}px`,
            top: `${tooltip.y - 14}px`,
          }}
          className="fixed z-50 pointer-events-none p-3 bg-slate-950/90 backdrop-blur-lg border border-cyan-500/40 rounded-xl shadow-2xl min-w-[220px] transition-opacity"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5 mb-2">
            <span className="font-semibold text-white text-xs tracking-wide truncate max-w-[150px]">
              {tooltip.conn.name}
            </span>
            <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.5 bg-cyan-950/50 rounded border border-cyan-800/50">
              {tooltip.conn.protocol}
            </span>
          </div>

          <div className="space-y-1 text-xs text-slate-300 font-mono">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500">Ziel-IP:</span>
              <span className="text-cyan-200">{tooltip.conn.ip}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500">Standort:</span>
              <span>{tooltip.conn.city}, {tooltip.conn.countryCode}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500">Latenz:</span>
              <span className={tooltip.conn.latencyMs > 200 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                {tooltip.conn.latencyMs.toFixed(1)} ms
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500">Autonomes System:</span>
              <span className="text-slate-400 truncate max-w-[110px]">{tooltip.conn.whois.asn}</span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-cyan-400 font-sans flex items-center justify-between">
            <span>Klicken zum Analysieren</span>
            <span>→</span>
          </div>
        </div>
      )}
    </div>
  );
};
