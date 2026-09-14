"use client";

import * as React from "react";
import * as THREE from "three";
import type { WebGLCapability } from "@/hooks/useWebGL";

interface DeviceSceneProps {
  capability: Exclude<WebGLCapability, "none">;
}

/**
 * DeviceScene — Pure Three.js implementation of an Android Gaming Device.
 *
 * Features:
 *  - High-performance vanilla Three.js (zero React internal reconciler conflicts)
 *  - Wireframe & brushed metallic body with neon green accent
 *  - Animated live FPS telemetry waveform on the screen
 *  - Interactive rotation on mouse/touch drag with smooth auto-rotation
 *  - Full memory disposal on unmount
 */
export function DeviceScene({ capability }: DeviceSceneProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isLowEnd = capability === "low";

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId: number;
    let isDisposed = false;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const width = container.clientWidth || 380;
    const height = container.clientHeight || 480;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.5);

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isLowEnd,
        alpha: true,
        powerPreference: isLowEnd ? "low-power" : "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowEnd ? 1 : 1.5));
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn("WebGL initialization failed:", e);
      return;
    }

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const greenLight = new THREE.PointLight(0x00e5a0, 3, 10);
    greenLight.position.set(2, 3, 2.5);
    scene.add(greenLight);

    const backLight = new THREE.PointLight(0x3b82f6, 1.5, 10);
    backLight.position.set(-2.5, -2, -2);
    scene.add(backLight);

    // Device Group
    const deviceGroup = new THREE.Group();
    scene.add(deviceGroup);

    // Device Body
    const bodyGeo = new THREE.BoxGeometry(1.2, 2.4, 0.12);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x111318,
      roughness: 0.6,
      metalness: 0.8,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    deviceGroup.add(bodyMesh);

    // Neon edge wireframe highlight
    const edgeGeo = new THREE.EdgesGeometry(bodyGeo);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x00e5a0,
      transparent: true,
      opacity: 0.35,
    });
    const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
    deviceGroup.add(edgeLine);

    // Screen face
    const screenGeo = new THREE.PlaneGeometry(1.04, 2.16);
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x07080a,
      roughness: 0.2,
      metalness: 0.5,
      emissive: 0x00e5a0,
      emissiveIntensity: 0.05,
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.z = 0.062;
    deviceGroup.add(screenMesh);

    // Screen border glow line
    const screenEdgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.04, 2.16, 0.01));
    const screenEdgeMat = new THREE.LineBasicMaterial({
      color: 0x1e2329,
    });
    const screenEdgeLine = new THREE.LineSegments(screenEdgeGeo, screenEdgeMat);
    screenEdgeLine.position.z = 0.063;
    deviceGroup.add(screenEdgeLine);

    // Front Camera Punch-Hole
    const camGeo = new THREE.CircleGeometry(0.025, 16);
    const camMat = new THREE.MeshBasicMaterial({ color: 0x00e5a0 });
    const camMesh = new THREE.Mesh(camGeo, camMat);
    camMesh.position.set(0, 0.96, 0.064);
    deviceGroup.add(camMesh);

    // Home / Gesture Pill
    const pillGeo = new THREE.PlaneGeometry(0.32, 0.015);
    const pillMat = new THREE.MeshBasicMaterial({
      color: 0x00e5a0,
      transparent: true,
      opacity: 0.6,
    });
    const pillMesh = new THREE.Mesh(pillGeo, pillMat);
    pillMesh.position.set(0, -0.96, 0.064);
    deviceGroup.add(pillMesh);

    // FPS Waveform Graph on screen
    const waveformPoints: THREE.Vector3[] = [];
    const numPoints = 24;
    for (let i = 0; i <= numPoints; i++) {
      const x = -0.42 + (i / numPoints) * 0.84;
      const y = -0.15 + Math.sin(i * 0.75) * 0.14 + Math.cos(i * 1.5) * 0.06;
      waveformPoints.push(new THREE.Vector3(x, y, 0.065));
    }
    const waveGeo = new THREE.BufferGeometry().setFromPoints(waveformPoints);
    const waveMat = new THREE.LineBasicMaterial({
      color: 0x00e5a0,
    });
    const waveLine = new THREE.Line(waveGeo, waveMat);
    deviceGroup.add(waveLine);

    // Grid lines on screen (telemetry look)
    const gridPoints: THREE.Vector3[] = [];
    for (let y = -0.5; y <= 0.5; y += 0.25) {
      gridPoints.push(new THREE.Vector3(-0.45, y, 0.064));
      gridPoints.push(new THREE.Vector3(0.45, y, 0.064));
    }
    const gridGeo = new THREE.BufferGeometry().setFromPoints(gridPoints);
    const gridMat = new THREE.LineSegments(
      gridGeo,
      new THREE.LineBasicMaterial({
        color: 0x00e5a0,
        transparent: true,
        opacity: 0.15,
      })
    );
    deviceGroup.add(gridMat);

    // Mouse Interaction
    let targetRotationX = 0.15;
    let targetRotationY = -0.3;
    let isPointerDown = false;
    let prevPointerX = 0;
    let prevPointerY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isPointerDown) {
        const deltaX = e.clientX - prevPointerX;
        const deltaY = e.clientY - prevPointerY;
        targetRotationY += deltaX * 0.008;
        targetRotationX += deltaY * 0.008;
        targetRotationX = Math.max(-0.6, Math.min(0.6, targetRotationX));
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
      }
    };

    const onPointerUp = () => {
      isPointerDown = false;
    };

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation Loop
    const clock = new THREE.Clock();
    const animate = () => {
      if (isDisposed) return;
      animId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Auto-rotation if user is not actively dragging
      if (!isPointerDown) {
        targetRotationY += 0.3 * delta;
      }

      // Smooth dampening
      deviceGroup.rotation.y += (targetRotationY - deviceGroup.rotation.y) * 0.08;
      deviceGroup.rotation.x += (targetRotationX - deviceGroup.rotation.x) * 0.08;

      // Subtle floating bob
      deviceGroup.position.y = Math.sin(time * 1.5) * 0.04;

      // Pulse green light
      greenLight.intensity = 2.5 + Math.sin(time * 3) * 0.8;

      // Subtle waveform live frequency animation
      const positions = waveGeo.attributes["position"];
      if (positions) {
        const posArray = positions.array as Float32Array;
        for (let i = 0; i <= numPoints; i++) {
          const baseIndex = i * 3;
          posArray[baseIndex + 1] =
            -0.15 +
            Math.sin(i * 0.75 + time * 2) * 0.12 +
            Math.cos(i * 1.5 - time) * 0.05;
        }
        positions.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      resizeObserver.disconnect();

      // Dispose Three resources
      bodyGeo.dispose();
      bodyMat.dispose();
      edgeGeo.dispose();
      edgeMat.dispose();
      screenGeo.dispose();
      screenMat.dispose();
      screenEdgeGeo.dispose();
      screenEdgeMat.dispose();
      camGeo.dispose();
      camMat.dispose();
      pillGeo.dispose();
      pillMat.dispose();
      waveGeo.dispose();
      waveMat.dispose();
      gridGeo.dispose();

      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [isLowEnd]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full cursor-grab active:cursor-grabbing select-none"
      style={{ touchAction: "none" }}
    />
  );
}
