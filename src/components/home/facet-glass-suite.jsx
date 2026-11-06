'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { setupSafeWebGLCanvas } from '@/lib/webgl-utils';

// --- GEOMETRY UTILITIES ---
function getPolygonSignedArea(pts) {
  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return area * 0.5;
}

function insetPolygon(pts, insetDist) {
  const n = pts.length;
  if (n < 3) return pts;

  let poly = [...pts];
  if (getPolygonSignedArea(poly) < 0) {
    poly.reverse();
  }

  const edgeNormals = [];
  const edgeDirs = [];
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const dx = poly[next].x - poly[i].x;
    const dy = poly[next].y - poly[i].y;
    const len = Math.hypot(dx, dy) || 1e-6;
    edgeDirs.push({ x: dx / len, y: dy / len });
    edgeNormals.push({ x: -dy / len, y: dx / len });
  }

  const result = [];
  for (let i = 0; i < n; i++) {
    const prev = (i - 1 + n) % n;
    const dirPrev = edgeDirs[prev];
    const dirNext = edgeDirs[i];
    const nPrev = edgeNormals[prev];
    const nNext = edgeNormals[i];

    const pPrev = {
      x: poly[i].x + insetDist * nPrev.x,
      y: poly[i].y + insetDist * nPrev.y,
    };
    const pNext = {
      x: poly[i].x + insetDist * nNext.x,
      y: poly[i].y + insetDist * nNext.y,
    };

    const denom = dirPrev.x * dirNext.y - dirPrev.y * dirNext.x;
    if (Math.abs(denom) > 1e-5) {
      const t =
        ((pNext.x - pPrev.x) * dirNext.y - (pNext.y - pPrev.y) * dirNext.x) /
        denom;
      const interX = pPrev.x + t * dirPrev.x;
      const interY = pPrev.y + t * dirPrev.y;
      const distFromOriginal = Math.hypot(
        interX - poly[i].x,
        interY - poly[i].y
      );
      if (distFromOriginal > insetDist * 2.8) {
        const avgNx = (nPrev.x + nNext.x) * 0.5;
        const avgNy = (nPrev.y + nNext.y) * 0.5;
        const avgLen = Math.hypot(avgNx, avgNy) || 1;
        result.push({
          x: poly[i].x + (avgNx / avgLen) * insetDist,
          y: poly[i].y + (avgNy / avgLen) * insetDist,
        });
      } else {
        result.push({ x: interX, y: interY });
      }
    } else {
      result.push({
        x: poly[i].x + nNext.x * insetDist,
        y: poly[i].y + nNext.y * insetDist,
      });
    }
  }

  return result;
}

function createRoundedShape(pts, radius) {
  const shape = new THREE.Shape();
  const n = pts.length;
  if (n < 3) return shape;

  for (let i = 0; i < n; i++) {
    const curr = pts[i];
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];

    const inDx = curr.x - prev.x;
    const inDy = curr.y - prev.y;
    const inLen = Math.hypot(inDx, inDy);

    const outDx = next.x - curr.x;
    const outDy = next.y - curr.y;
    const outLen = Math.hypot(outDx, outDy);

    const maxR = Math.min(inLen * 0.44, outLen * 0.44, radius);
    const r = Math.max(1, maxR);

    const startX = curr.x - (inDx / (inLen || 1)) * r;
    const startY = curr.y - (inDy / (inLen || 1)) * r;
    const endX = curr.x + (outDx / (outLen || 1)) * r;
    const endY = curr.y + (outDy / (outLen || 1)) * r;

    if (i === 0) {
      shape.moveTo(startX, startY);
    } else {
      shape.lineTo(startX, startY);
    }
    shape.quadraticCurveTo(curr.x, curr.y, endX, endY);
  }

  shape.closePath();
  return shape;
}

function createShardGeometry(shape, S) {
  const depth = Math.max(2, 13 * S);
  const bevel = Math.max(0.6, 2.6 * S);

  const extrudeSettings = {
    steps: 1,
    depth: depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: 0,
    bevelSegments: 3,
    curveSegments: 16,
  };

  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geom.computeVertexNormals();
  return geom;
}

function getPolygonCentroid(pts) {
  let cx = 0;
  let cy = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    cx += pts[i].x;
    cy += pts[i].y;
  }
  return { x: cx / n, y: cy / n };
}

// --- HIGH-DPI CANVAS RENDERER FOR GLASS TEXTURES ---
class FacetSuiteCanvasRenderer {
  constructor() {
    this.panelCanvas = document.createElement('canvas');
    this.panelCtx = this.panelCanvas.getContext('2d');
    this.panelTexture = new THREE.CanvasTexture(this.panelCanvas);
    this.panelTexture.colorSpace = THREE.SRGBColorSpace;
    this.panelTexture.minFilter = THREE.LinearFilter;
    this.panelTexture.magFilter = THREE.LinearFilter;

    this.navCanvas = document.createElement('canvas');
    this.navCtx = this.navCanvas.getContext('2d');
    this.navTexture = new THREE.CanvasTexture(this.navCanvas);
    this.navTexture.colorSpace = THREE.SRGBColorSpace;
    this.navTexture.minFilter = THREE.LinearFilter;
    this.navTexture.magFilter = THREE.LinearFilter;
  }

  resize(dims) {
    const dpr = Math.max(dims.dpr, 1.5);
    this.panelCanvas.width = Math.max(128, Math.round(dims.panelWidth * dpr));
    this.panelCanvas.height = Math.max(128, Math.round(dims.panelHeight * dpr));
    this.navCanvas.width = Math.max(128, Math.round(dims.blockWidth * dpr));
    this.navCanvas.height = Math.max(32, Math.round(dims.navHeight * dpr));
  }

  render(dims, isHoveredCTA, isDark, isGuest) {
    const dpr = Math.max(dims.dpr, 1.5);
    const S = dims.scale;

    this.renderNav(dims, dpr, S, isDark);
    this.renderPanel(dims, dpr, S, isHoveredCTA, isDark, isGuest);

    this.panelTexture.needsUpdate = true;
    this.navTexture.needsUpdate = true;
  }

  renderNav(dims, dpr, S, isDark) {
    const ctx = this.navCtx;
    if (!ctx) return;
    const w = this.navCanvas.width;
    const h = this.navCanvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(dpr, dpr);

    const bw = dims.blockWidth;
    const nh = dims.navHeight;
    const leftPad = bw * 0.045;
    const centerY = nh * 0.5;

    // Diamond Logo Mark
    const markSize = Math.max(14, 16 * S);
    const markX = leftPad;
    const markY = centerY - markSize * 0.5;

    ctx.save();
    ctx.translate(markX + markSize * 0.5, markY + markSize * 0.5);
    ctx.beginPath();
    ctx.moveTo(0, -markSize * 0.5);
    ctx.lineTo(markSize * 0.5, 0);
    ctx.lineTo(0, markSize * 0.5);
    ctx.lineTo(-markSize * 0.5, 0);
    ctx.closePath();
    ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -markSize * 0.5);
    ctx.lineTo(0, markSize * 0.5);
    ctx.strokeStyle = isDark
      ? 'rgba(56, 189, 248, 0.45)'
      : 'rgba(2, 132, 199, 0.45)';
    ctx.stroke();
    ctx.restore();

    // Brand title
    const brandSize = Math.max(12, 14.5 * S);
    ctx.font = `800 ${brandSize}px 'Inter Tight', system-ui, sans-serif`;
    ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('ALL USEFUL TOOLS', markX + markSize + 10 * S, centerY);

    // Center tag
    const centerSize = Math.max(10, 11.5 * S);
    ctx.font = `600 ${centerSize}px 'Inter Tight', monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = isDark
      ? 'rgba(255, 255, 255, 0.45)'
      : 'rgba(15, 23, 42, 0.55)';
    ctx.fillText(
      'DIRECT IN-BROWSER EXECUTION  •  ZERO CLOUD RETENTION',
      bw * 0.5,
      centerY
    );

    // Right status
    const rightPad = bw * 0.045;
    ctx.textAlign = 'right';
    ctx.font = `700 ${centerSize}px 'Inter Tight', system-ui, sans-serif`;
    ctx.fillStyle = '#10b981';
    ctx.fillText('● SYSTEM ACTIVE', bw - rightPad, centerY);

    ctx.restore();
  }

  renderPanel(dims, dpr, S, isHoveredCTA, isDark, isGuest) {
    const ctx = this.panelCtx;
    if (!ctx) return;
    const w = this.panelCanvas.width;
    const h = this.panelCanvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(dpr, dpr);

    const pw = dims.panelWidth;
    const ph = dims.panelHeight;
    const leftMargin = pw * 0.062;

    // 1. Eyebrow
    const eyebrowY = ph * 0.13;
    const eyebrowSize = Math.max(10, 11 * S);
    ctx.font = `800 ${eyebrowSize}px 'Inter Tight', monospace`;
    ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.9)' : '#0284c7';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(
      'ENTERPRISE ECOSYSTEM  •  IDENTITY DESK',
      leftMargin,
      eyebrowY
    );

    // 2. Headline: Experience the Full / Professional Suite
    const headlineSize = Math.max(26, Math.min(pw * 0.068, ph * 0.17));
    const leading = headlineSize * 1.05;
    const headlineY = eyebrowY + eyebrowSize + 18 * S;

    ctx.font = `900 ${headlineSize}px 'Inter Tight', system-ui, sans-serif`;
    ctx.letterSpacing = '-0.035em';

    // First line: Experience the Full
    ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
    ctx.fillText('Experience the Full', leftMargin, headlineY);

    // Second line: Professional Suite (Electric Gradient)
    const suiteGrad = ctx.createLinearGradient(
      leftMargin,
      headlineY + leading,
      leftMargin + 360 * S,
      headlineY + leading
    );
    suiteGrad.addColorStop(0, '#34d399');
    suiteGrad.addColorStop(0.5, '#38bdf8');
    suiteGrad.addColorStop(1, '#60a5fa');
    ctx.fillStyle = suiteGrad;
    ctx.fillText('Professional Suite', leftMargin, headlineY + leading);

    // 3. Subtitle Paragraph
    const subSize = Math.max(11, 13.5 * S);
    const subLeading = subSize * 1.48;
    const subY = headlineY + leading * 2 + 22 * S;

    ctx.font = `500 ${subSize}px 'Inter Tight', system-ui, sans-serif`;
    ctx.fillStyle = isDark
      ? 'rgba(255, 255, 255, 0.65)'
      : 'rgba(15, 23, 42, 0.7)';
    ctx.fillText(
      'Join thousands of creators and professionals. Transform your digital',
      leftMargin,
      subY
    );
    ctx.fillText(
      'workflow with instant local-first tools and AI authoring.',
      leftMargin,
      subY + subLeading
    );

    // 4. Primary CTA Pill Button
    const buttonY = subY + subLeading + 28 * S;
    const pillW = 188 * S;
    const pillH = 44 * S;
    const pillRadius = 12 * S;

    ctx.beginPath();
    ctx.roundRect(leftMargin, buttonY, pillW, pillH, [pillRadius]);
    if (isHoveredCTA) {
      ctx.fillStyle = '#10b981';
    } else {
      ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
    }
    ctx.fill();

    ctx.font = `800 ${Math.max(11.5, 13 * S)}px 'Inter Tight', system-ui, sans-serif`;
    ctx.fillStyle = '#050914';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      isGuest ? 'Initialize Account →' : 'Access Your Profile →',
      leftMargin + pillW * 0.5,
      buttonY + pillH * 0.5
    );

    // 5. Right Shard (Cell E): Identity Desk Card
    const rightCardX = pw * 0.68;
    const rightCardY = ph * 0.22;
    const rightCardW = pw * 0.26;
    const rightCardH = ph * 0.58;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(rightCardX, rightCardY, rightCardW, rightCardH, [18 * S]);
    ctx.fillStyle = isDark
      ? 'rgba(255, 255, 255, 0.035)'
      : 'rgba(15, 23, 42, 0.035)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isDark
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(15, 23, 42, 0.1)';
    ctx.stroke();

    // Shield Icon inside right card
    const cardPad = 22 * S;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.font = `800 ${Math.max(14, 17 * S)}px 'Inter Tight', system-ui, sans-serif`;
    ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
    ctx.fillText('Identity Desk', rightCardX + cardPad, rightCardY + cardPad);

    ctx.font = `600 ${Math.max(10, 11.5 * S)}px 'Inter Tight', monospace`;
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.fillText(
      'Verified Local Processing',
      rightCardX + cardPad,
      rightCardY + cardPad + 26 * S
    );

    // Active Badge in right card
    const badgeY = rightCardY + cardPad + 64 * S;
    ctx.beginPath();
    ctx.roundRect(rightCardX + cardPad, badgeY, 94 * S, 26 * S, [8 * S]);
    ctx.fillStyle = isDark
      ? 'rgba(16, 185, 129, 0.15)'
      : 'rgba(16, 185, 129, 0.12)';
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#10b981';
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.max(9.5, 11 * S)}px 'Inter Tight', monospace`;
    ctx.fillStyle = '#10b981';
    ctx.fillText('● ACTIVE', rightCardX + cardPad + 47 * S, badgeY + 13 * S);

    // Verification specs
    ctx.textAlign = 'left';
    ctx.font = `500 ${Math.max(10, 11 * S)}px 'Inter Tight', sans-serif`;
    ctx.fillStyle = isDark
      ? 'rgba(255, 255, 255, 0.5)'
      : 'rgba(15, 23, 42, 0.6)';
    ctx.fillText(
      '• Hardware Enclave Protected',
      rightCardX + cardPad,
      badgeY + 44 * S
    );
    ctx.fillText('• 0ms Cloud Latency', rightCardX + cardPad, badgeY + 64 * S);
    ctx.fillText(
      '• Full Suite Unlocked',
      rightCardX + cardPad,
      badgeY + 84 * S
    );

    ctx.restore();

    // 6. Footer Notes
    const bottomY = ph - 22 * S;
    const noteSize = Math.max(9, 10.5 * S);
    ctx.font = `600 ${noteSize}px 'Inter Tight', monospace`;
    ctx.fillStyle = isDark
      ? 'rgba(255, 255, 255, 0.35)'
      : 'rgba(15, 23, 42, 0.45)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(
      '© ALL USEFUL TOOLS LAB  •  CLIENT RUNTIME',
      leftMargin,
      bottomY
    );

    ctx.textAlign = 'right';
    ctx.fillText('THREE.JS PHYSICAL DISPERSION', pw - leftMargin, bottomY);

    ctx.restore();
  }

  dispose() {
    this.panelTexture.dispose();
    this.navTexture.dispose();
  }
}

export function FacetGlassSuite({ user, isGuest }) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark' || resolvedTheme === 'nebula';

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isShattered, setIsShattered] = useState(false);

  // Store interactive engine state
  const engineRef = useRef(null);

  const handleToggleShatter = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    setIsShattered((prev) => {
      const next = !prev;
      engine.shatterPhase = next ? 'shattering' : 'reassembling';
      engine.shatterStartTime = performance.now();
      return next;
    });
  }, []);

  const handleCTAClick = useCallback(() => {
    router.push(isGuest ? '/auth?mode=signup' : '/profile');
  }, [router, isGuest]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth || 1100;
    let height = container.clientHeight || 600;

    setupSafeWebGLCanvas(canvas);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.debug.checkShaderErrors = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setClearColor(0, 0);

    const scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    pmremGenerator.dispose();
    scene.environmentIntensity = isDark ? 0.48 : 0.65;

    // Lighting
    const keyLight = new THREE.DirectionalLight(0xe0f2fe, isDark ? 1.4 : 1.8);
    keyLight.position.set(-width * 0.4, height * 0.6, 600);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, isDark ? 0.6 : 0.4);
    fillLight.position.set(width * 0.4, -height * 0.4, 400);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.4);
    scene.add(hemiLight);

    // Camera
    const fov = 30;
    const fovRad = (fov * Math.PI) / 180;
    const cameraDist = height / 2 / Math.tan(fovRad / 2);
    const camera = new THREE.PerspectiveCamera(
      fov,
      width / height,
      1,
      cameraDist * 4
    );
    camera.position.set(0, 0, cameraDist);
    camera.lookAt(0, 0, 0);

    // Compute dimensions
    const S = Math.max(0.65, Math.min(width / 1200, 1.05));
    const blockWidth = width * 0.94;
    const blockHeight = height * 0.88;
    const navHeight = 46 * S;
    const gap = 12 * S;
    const panelWidth = blockWidth;
    const panelHeight = blockHeight - navHeight - gap;

    const dims = {
      width,
      height,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      scale: S,
      blockWidth,
      blockHeight,
      navHeight,
      gap,
      panelWidth,
      panelHeight,
    };

    const canvasRenderer = new FacetSuiteCanvasRenderer();
    canvasRenderer.resize(dims);
    canvasRenderer.render(dims, false, isDark, isGuest);

    const blockGroup = new THREE.Group();
    scene.add(blockGroup);

    const navGroup = new THREE.Group();
    blockGroup.add(navGroup);

    const panelGroup = new THREE.Group();
    blockGroup.add(panelGroup);

    // Cursor Glow Uniforms
    const cursorPosUniform = { value: new THREE.Vector3(0, 0, 0) };
    const cursorHoverUniform = { value: 0 };
    const cursorScaleUniform = { value: 1.0 };

    const createGlassMaterial = (irid) => {
      const mat = new THREE.MeshPhysicalMaterial({
        color: isDark ? 0x0a101d : 0xf8fafc,
        roughness: 0.26,
        clearcoat: 0.85,
        clearcoatRoughness: 0.1,
        specularIntensity: 0.9,
        iridescence: irid,
        iridescenceIOR: 1.35,
        iridescenceThicknessRange: [250, 650],
        envMapIntensity: 1.0,
        transparent: true,
        opacity: isDark ? 0.94 : 0.96,
      });

      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uCursorPos = cursorPosUniform;
        shader.uniforms.uCursorHover = cursorHoverUniform;
        shader.uniforms.uScale = cursorScaleUniform;

        shader.vertexShader = shader.vertexShader.replace(
          '#include <common>',
          `#include <common>
           varying vec3 vFacetWorldPos;`
        );
        shader.vertexShader = shader.vertexShader.replace(
          '#include <worldpos_vertex>',
          `#include <worldpos_vertex>
           vFacetWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <common>',
          `#include <common>
           uniform vec3 uCursorPos;
           uniform float uCursorHover;
           uniform float uScale;
           varying vec3 vFacetWorldPos;`
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          `#include <dithering_fragment>
           float curDist = distance(vFacetWorldPos, uCursorPos);
           float glowRadius = 140.0 * uScale;
           float glow = smoothstep(glowRadius, 0.0, curDist) * uCursorHover;
           vec3 glowColor = vec3(0.2, 0.75, 1.0) * glow * 0.45;
           gl_FragColor.rgb += glowColor;`
        );
      };

      return mat;
    };

    const shards = [];
    const shardsById = new Map();

    // 1. Build Nav Slab
    const navPts = [
      { x: -blockWidth * 0.5, y: navHeight * 0.5 },
      { x: blockWidth * 0.5, y: navHeight * 0.5 },
      { x: blockWidth * 0.5, y: -navHeight * 0.5 },
      { x: -blockWidth * 0.5, y: -navHeight * 0.5 },
    ];
    const insetNav = insetPolygon(navPts, 6 * S);
    const navShape = createRoundedShape(insetNav, 16 * S);
    const navGeom = createShardGeometry(navShape, S);
    const navMat = createGlassMaterial(0.65);
    const navGlassMesh = new THREE.Mesh(navGeom, navMat);

    const navTextGeom = new THREE.ShapeGeometry(navShape, 16);
    const nPos = navTextGeom.attributes.position;
    const nUv = navTextGeom.attributes.uv;
    for (let i = 0; i < nPos.count; i++) {
      const x = nPos.getX(i);
      const y = nPos.getY(i);
      nUv.setXY(
        i,
        (x + blockWidth * 0.5) / blockWidth,
        (y + navHeight * 0.5) / navHeight
      );
    }
    nUv.needsUpdate = true;

    const navTextMat = new THREE.MeshBasicMaterial({
      map: canvasRenderer.navTexture,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    const navTextMesh = new THREE.Mesh(navTextGeom, navTextMat);
    navTextMesh.position.z = (13 + 2.6 + 0.15) * S;

    const navPieceGroup = new THREE.Group();
    navGroup.add(navPieceGroup);
    navPieceGroup.add(navGlassMesh);
    navPieceGroup.add(navTextMesh);

    const navY = blockHeight * 0.5 - navHeight * 0.5;
    navGroup.position.set(0, navY, 0);

    const navShard = {
      id: 'nav',
      group: navPieceGroup,
      glassMesh: navGlassMesh,
      textMesh: navTextMesh,
      centroid: { x: 0, y: 0 },
      springZ: 0,
      velZ: 0,
      springRotX: 0,
      velRotX: 0,
      springRotY: 0,
      velRotY: 0,
      staggerDelay: 0,
      outwardVel: new THREE.Vector3(0, 110 * S, 40 * S),
      tumbleAxis: new THREE.Vector3(1, 0.2, 0.4).normalize(),
      tumbleAngle: 2.2,
      currentShatterProgress: 0,
    };
    shards.push(navShard);
    shardsById.set('nav', navShard);

    // 2. Build 5 Panel Cells
    const curPattern = {
      tAB: { x: 0.24, y: 0 },
      tBC: { x: 0.52, y: 0 },
      tCE: { x: 0.82, y: 0 },
      bAD: { x: 0.36, y: 1 },
      bDE: { x: 0.84, y: 1 },
      J0: { x: 0.4, y: 0.7 },
      J1: { x: 0.5, y: 0.6 },
      J2: { x: 0.72, y: 0.48 },
    };

    const toPanelCoord = (p) => ({
      x: -panelWidth * 0.5 + p.x * panelWidth,
      y: panelHeight * 0.5 - p.y * panelHeight,
    });

    const TL = toPanelCoord({ x: 0, y: 0 });
    const TR = toPanelCoord({ x: 1, y: 0 });
    const BL = toPanelCoord({ x: 0, y: 1 });
    const BR = toPanelCoord({ x: 1, y: 1 });

    const tAB = toPanelCoord(curPattern.tAB);
    const tBC = toPanelCoord(curPattern.tBC);
    const tCE = toPanelCoord(curPattern.tCE);
    const bAD = toPanelCoord(curPattern.bAD);
    const bDE = toPanelCoord(curPattern.bDE);
    const J0 = toPanelCoord(curPattern.J0);
    const J1 = toPanelCoord(curPattern.J1);
    const J2 = toPanelCoord(curPattern.J2);

    const cellPolygons = [
      [TL, tAB, J0, bAD, BL], // Cell A: Hero content
      [tAB, tBC, J1, J0], // Cell B: Center Top
      [tBC, tCE, J2, J1], // Cell C: Right Top
      [J0, J1, J2, bDE, bAD], // Cell D: Center Bottom
      [tCE, TR, BR, bDE, J2], // Cell E: Right Identity Card
    ];

    const cellIds = ['cell_A', 'cell_B', 'cell_C', 'cell_D', 'cell_E'];

    cellIds.forEach((id, idx) => {
      const poly = cellPolygons[idx];
      const centroid = getPolygonCentroid(poly);
      const localPoly = poly.map((pt) => ({
        x: pt.x - centroid.x,
        y: pt.y - centroid.y,
      }));
      const insetPoly = insetPolygon(localPoly, 6 * S);
      const roundedShape = createRoundedShape(insetPoly, 18 * S);

      const glassGeom = createShardGeometry(roundedShape, S);
      const glassMat = createGlassMaterial(0.55 + idx * 0.08);
      const glassMesh = new THREE.Mesh(glassGeom, glassMat);
      glassMesh.name = id;

      const textGeom = new THREE.ShapeGeometry(roundedShape, 16);
      const tPos = textGeom.attributes.position;
      const tUv = textGeom.attributes.uv;
      for (let i = 0; i < tPos.count; i++) {
        const lx = tPos.getX(i);
        const ly = tPos.getY(i);
        const gx = lx + centroid.x + panelWidth * 0.5;
        const gy = ly + centroid.y + panelHeight * 0.5;
        tUv.setXY(i, gx / panelWidth, gy / panelHeight);
      }
      tUv.needsUpdate = true;

      const textMat = new THREE.MeshBasicMaterial({
        map: canvasRenderer.panelTexture,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      });
      const textMesh = new THREE.Mesh(textGeom, textMat);
      textMesh.position.z = (13 + 2.6 + 0.15) * S;

      const cellGroup = new THREE.Group();
      cellGroup.position.set(centroid.x, centroid.y, 0);
      cellGroup.add(glassMesh);
      cellGroup.add(textMesh);
      panelGroup.add(cellGroup);

      const outDir = new THREE.Vector3(
        centroid.x,
        centroid.y,
        60 * S
      ).normalize();
      const tumbleAxis = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize();

      const shardItem = {
        id,
        group: cellGroup,
        glassMesh,
        textMesh,
        centroid,
        restPosition: new THREE.Vector3(centroid.x, centroid.y, 0),
        springZ: 0,
        velZ: 0,
        springRotX: 0,
        velRotX: 0,
        springRotY: 0,
        velRotY: 0,
        staggerDelay: 0.04 * (idx + 1),
        outwardVel: outDir.multiplyScalar(140 * S + idx * 25 * S),
        tumbleAxis,
        tumbleAngle: 2.2 + Math.random() * 1.5,
        currentShatterProgress: 0,
      };

      shards.push(shardItem);
      shardsById.set(id, shardItem);
    });

    const panelY = -blockHeight * 0.5 + panelHeight * 0.5;
    panelGroup.position.set(0, panelY, 0);

    // Raycaster for Shard Hover & CTA Click
    const raycaster = new THREE.Raycaster();
    const mouseNdc = new THREE.Vector2(-999, -999);
    let hoveredShard = null;
    let isHoveredCTA = false;
    let pointerMoved = true;

    const handlePointerMove = (e) => {
      pointerMoved = true;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseNdc.x = (x / rect.width) * 2 - 1;
      mouseNdc.y = -(y / rect.height) * 2 + 1;

      // Update Cursor Glow World Position
      const cursorX = (mouseNdc.x * dims.width) / 2;
      const cursorY = (mouseNdc.y * dims.height) / 2;
      cursorPosUniform.value.set(cursorX, cursorY, 20);
      cursorHoverUniform.value = 1.0;

      // Check if mouse is hovering over the CTA button area in panel
      const pw = dims.panelWidth;
      const ph = dims.panelHeight;
      const leftMargin = pw * 0.062;
      const S = dims.scale;
      const eyebrowSize = Math.max(10, 11 * S);
      const headlineSize = Math.max(26, Math.min(pw * 0.068, ph * 0.17));
      const leading = headlineSize * 1.05;
      const subSize = Math.max(11, 13.5 * S);
      const subLeading = subSize * 1.48;
      const buttonY =
        ph * 0.13 +
        eyebrowSize +
        18 * S +
        leading * 2 +
        22 * S +
        subLeading +
        28 * S;
      const pillW = 188 * S;
      const pillH = 44 * S;

      // Map panel coordinates to canvas pixel space
      const panelCenterX = rect.width / 2;
      const panelCenterY = rect.height / 2 - panelY;
      const ctaMinX = panelCenterX - pw / 2 + leftMargin;
      const ctaMaxX = ctaMinX + pillW;
      const ctaMinY = panelCenterY - ph / 2 + buttonY;
      const ctaMaxY = ctaMinY + pillH;

      const overCTA =
        x >= ctaMinX && x <= ctaMaxX && y >= ctaMinY && y <= ctaMaxY;
      if (overCTA !== isHoveredCTA) {
        isHoveredCTA = overCTA;
        canvasRenderer.render(dims, isHoveredCTA, isDark, isGuest);
      }

      canvas.style.cursor = overCTA
        ? 'pointer'
        : hoveredShard
          ? 'grab'
          : 'default';
    };

    const handlePointerLeave = () => {
      pointerMoved = true;
      mouseNdc.set(-999, -999);
      cursorHoverUniform.value = 0.0;
      if (isHoveredCTA) {
        isHoveredCTA = false;
        canvasRenderer.render(dims, false, isDark, isGuest);
      }
    };

    const handleClick = () => {
      pointerMoved = true;
      if (isHoveredCTA) {
        handleCTAClick();
      } else {
        handleToggleShatter();
      }
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    canvas.addEventListener('click', handleClick);

    // Engine ref for shatter control
    engineRef.current = {
      shatterPhase: 'assembled',
      shatterStartTime: 0,
    };

    // Pre-allocate mesh list to eliminate per-frame GC allocations
    const allMeshes = shards.map((s) => s.glassMesh);

    // Animation Loop with Viewport Visibility Optimization
    let animId = null;
    let lastTime = performance.now();
    let isVisible = true;

    const startLoop = () => {
      if (!animId && isVisible) {
        lastTime = performance.now();
        animId = requestAnimationFrame(loop);
      }
    };

    const stopLoop = () => {
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isVisible;
        isVisible = entry.isIntersecting;
        if (isVisible && !wasVisible) {
          startLoop();
        } else if (!isVisible && wasVisible) {
          stopLoop();
        }
      },
      { rootMargin: '250px' }
    );
    observer.observe(container);

    const loop = () => {
      if (!isVisible) {
        animId = null;
        return;
      }
      animId = requestAnimationFrame(loop);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Raycasting only when pointer state changes or shattering
      if (pointerMoved) {
        raycaster.setFromCamera(mouseNdc, camera);
        const intersects = raycaster.intersectObjects(allMeshes);
        hoveredShard =
          intersects.length > 0
            ? shardsById.get(intersects[0].object.name)
            : null;
        pointerMoved = false;
      }

      const engine = engineRef.current;
      const isShattering = engine && engine.shatterPhase === 'shattering';
      const isReassembling = engine && engine.shatterPhase === 'reassembling';

      // Update shard physics
      for (const shard of shards) {
        const isHovered = hoveredShard === shard;

        // Hover spring physics (when assembled)
        if (
          !isShattering &&
          !isReassembling &&
          engine.shatterPhase === 'assembled'
        ) {
          const targetZ = isHovered ? 26 * S : 0;
          const kSpring = 160;
          const kDamping = 18;

          const fZ =
            (targetZ - shard.springZ) * kSpring - shard.velZ * kDamping;
          shard.velZ += fZ * dt;
          shard.springZ += shard.velZ * dt;

          const targetRotX = isHovered ? (mouseNdc.y - 0.2) * 0.12 : 0;
          const targetRotY = isHovered ? (mouseNdc.x - 0.2) * 0.14 : 0;

          shard.velRotX +=
            ((targetRotX - shard.springRotX) * kSpring -
              shard.velRotX * kDamping) *
            dt;
          shard.springRotX += shard.velRotX * dt;

          shard.velRotY +=
            ((targetRotY - shard.springRotY) * kSpring -
              shard.velRotY * kDamping) *
            dt;
          shard.springRotY += shard.velRotY * dt;

          shard.group.position.z = shard.springZ;
          shard.group.rotation.x = shard.springRotX;
          shard.group.rotation.y = shard.springRotY;
        }

        // Shatter & Reassemble Physics
        if (isShattering || isReassembling) {
          const elapsed = (now - engine.shatterStartTime) / 1000;
          const pieceTime = Math.max(0, elapsed - shard.staggerDelay);
          const duration = 0.85;
          const progress = Math.min(1, pieceTime / duration);
          const easeProgress = 1 - Math.pow(1 - progress, 3);

          if (isShattering) {
            shard.currentShatterProgress = easeProgress;
            const curPos = shard.outwardVel
              .clone()
              .multiplyScalar(easeProgress);
            shard.group.position.set(
              (shard.centroid.x || 0) + curPos.x,
              (shard.centroid.y || 0) + curPos.y,
              curPos.z
            );
            shard.group.setRotationFromAxisAngle(
              shard.tumbleAxis,
              shard.tumbleAngle * easeProgress
            );
          } else if (isReassembling) {
            const reProgress = 1 - easeProgress;
            shard.currentShatterProgress = reProgress;
            const curPos = shard.outwardVel.clone().multiplyScalar(reProgress);
            shard.group.position.set(
              (shard.centroid.x || 0) + curPos.x,
              (shard.centroid.y || 0) + curPos.y,
              curPos.z
            );
            shard.group.setRotationFromAxisAngle(
              shard.tumbleAxis,
              shard.tumbleAngle * reProgress
            );

            if (progress >= 1) {
              engine.shatterPhase = 'assembled';
              shard.springZ = 0;
              shard.velZ = 0;
              shard.springRotX = 0;
              shard.springRotY = 0;
              shard.group.position.set(
                shard.centroid.x || 0,
                shard.centroid.y || 0,
                0
              );
              shard.group.rotation.set(0, 0, 0);
            }
          }
        }
      }

      renderer.render(scene, camera);
    };

    loop();

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 1100;
      height = container.clientHeight || 600;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('click', handleClick);
      if (animId) cancelAnimationFrame(animId);
      renderer.dispose();
      canvasRenderer.dispose();
      shards.forEach((s) => {
        s.glassMesh.geometry.dispose();
        s.glassMesh.material.dispose();
        s.textMesh.geometry.dispose();
        s.textMesh.material.dispose();
      });
    };
  }, [isDark, isGuest, handleCTAClick, handleToggleShatter]);

  return (
    <section className="py-12 sm:py-16 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div
        ref={containerRef}
        className="relative w-full aspect-[16/10] sm:aspect-[16/9] min-h-[540px] max-h-[720px] overflow-hidden flex items-center justify-center select-none group bg-transparent"
      >
        {/* Three.js Facet Glass Sculpture Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block"
        />
      </div>
    </section>
  );
}
