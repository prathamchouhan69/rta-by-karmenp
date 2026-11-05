import { useEffect, useRef, useState } from "react";
import {
  AmbientLight,
  BufferGeometry,
  Color,
  CubicBezierCurve3,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
  type Material,
} from "three";

type Props = { mode: "mock" | "live"; visualMode: "day" | "night" | "classic" };

function readColor(value: string, fallback: number): number {
  const parsed = Number.parseInt(value.trim().replace(/^#/, ""), 16);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function SourceTopology3D({ mode, visualMode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [failureReason, setFailureReason] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let frame = 0;
    let resizeObserver: ResizeObserver | undefined;
    let intersectionObserver: IntersectionObserver | undefined;
    let renderer: WebGLRenderer | undefined;
    let scene: Scene | undefined;
    let geometry: BufferGeometry[] = [];
    let materials: Material[] = [];
    let topology: Group | undefined;
    let contextLostHandler: ((event: Event) => void) | undefined;
    let contextRestoredHandler: (() => void) | undefined;
    let motionChangeHandler: (() => void) | undefined;
    let reducedMotion: MediaQueryList | undefined;

    void Promise.resolve().then(() => {
      if (disposed) return;
      try {
        const context = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "low-power" });
        if (!context) throw new Error("WebGL is unavailable.");
        const bounds = canvas.getBoundingClientRect();
        const width = Math.max(bounds.width, 1);
        const height = Math.max(bounds.height, 1);

        const rootStyle = getComputedStyle(document.documentElement);
        const signal = new Color(readColor(rootStyle.getPropertyValue("--cyan"), 0x00d9eb));
        const secondary = new Color(readColor(rootStyle.getPropertyValue("--violet"), 0xbd68f6));
        const source = new Color(mode === "live" ? rootStyle.getPropertyValue("--green").trim() || "#22d3a6" : rootStyle.getPropertyValue("--amber").trim() || "#f4ba42");

        renderer = new WebGLRenderer({ canvas, context, alpha: true, antialias: true, powerPreference: "low-power" });
        setUnavailable(false);
        setFailureReason("");
        renderer.debug.onShaderError = () => setUnavailable(true);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setSize(width, height, false);
        renderer.outputColorSpace = SRGBColorSpace;
        scene = new Scene();
        const camera = new PerspectiveCamera(34, width / height, 0.1, 30);
        camera.position.set(0, 0, 6);

        topology = new Group();
        scene.add(topology);
        const ambient = new AmbientLight(0xffffff, visualMode === "day" ? 1.5 : 1.1);
        const key = new PointLight(signal, 2.4, 9);
        key.position.set(-2.5, 2.7, 3.2);
        const rim = new PointLight(secondary, 1.8, 8);
        rim.position.set(2.4, -1.5, -2);
        scene.add(ambient, key, rim);

        const coreGeometry = new SphereGeometry(0.43, 32, 24);
        const coreMaterial = new ShaderMaterial({
          uniforms: { uBase: { value: visualMode === "day" ? new Color("#b5d5c6") : new Color("#142333") }, uAccent: { value: signal }, uTime: { value: 0 } },
          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
              vNormal = normalize(normalMatrix * normal);
            vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
            vPosition = viewPosition.xyz;
            gl_Position = projectionMatrix * viewPosition;
            }
          `,
          fragmentShader: `
            uniform vec3 uBase;
            uniform vec3 uAccent;
            uniform float uTime;
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
              vec3 viewDirection = normalize(-vPosition);
              float rim = pow(1.0 - max(dot(normalize(vNormal), viewDirection), 0.0), 2.1);
              float pulse = 0.5 + 0.5 * sin(uTime * 1.1);
              vec3 color = mix(uBase, uAccent, clamp(rim * 0.9 + pulse * 0.08, 0.0, 1.0));
              gl_FragColor = vec4(color, 0.92);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }
          `,
          transparent: true,
        });
        const core = new Mesh(coreGeometry, coreMaterial);
        topology.add(core);
        geometry.push(coreGeometry);
        materials.push(coreMaterial);

        const shellGeometry = new SphereGeometry(0.59, 24, 16);
        const shellMaterial = new MeshBasicMaterial({ color: signal, wireframe: true, transparent: true, opacity: visualMode === "day" ? 0.17 : 0.3 });
        const shell = new Mesh(shellGeometry, shellMaterial);
        shell.rotation.set(0.3, 0.15, 0.2);
        topology.add(shell);
        geometry.push(shellGeometry);
        materials.push(shellMaterial);

        const points = [
          new Vector3(-1.42, 0.58, 0.12),
          new Vector3(-1.3, -0.62, -0.18),
          new Vector3(1.34, 0.12, -0.24),
        ];
        const edgeColors = [source, signal, secondary];
        points.forEach((point, index) => {
          const curve = new CubicBezierCurve3(
            new Vector3(0, 0, 0),
            new Vector3(point.x * 0.28, point.y * 1.22, 0.55),
            new Vector3(point.x * 0.78, point.y * 0.7, -0.15),
            point,
          );
          const edgeGeometry = new TubeGeometry(curve, 28, 0.008, 5, false);
          const edgeMaterial = new MeshBasicMaterial({ color: edgeColors[index], transparent: true, opacity: visualMode === "day" ? 0.56 : 0.74 });
          const edge = new Mesh(edgeGeometry, edgeMaterial);
          topology?.add(edge);
          geometry.push(edgeGeometry);
          materials.push(edgeMaterial);

          const nodeGeometry = new SphereGeometry(index === 0 ? 0.105 : 0.08, 18, 12);
          const nodeMaterial = new MeshStandardMaterial({ color: edgeColors[index], emissive: edgeColors[index], emissiveIntensity: visualMode === "night" ? 0.55 : 0.22, roughness: 0.35, metalness: 0.12 });
          const node = new Mesh(nodeGeometry, nodeMaterial);
          node.position.copy(point);
          topology?.add(node);
          geometry.push(nodeGeometry);
          materials.push(nodeMaterial);
        });

        const referenceVertices: number[] = [];
        for (let index = 0; index < 50; index += 1) {
          const y = 1 - (index / 49) * 2;
          const radius = Math.sqrt(Math.max(0, 1 - y * y));
          const angle = Math.PI * (3 - Math.sqrt(5)) * index;
          referenceVertices.push(Math.cos(angle) * radius * 1.05, y * 1.05, Math.sin(angle) * radius * 1.05);
        }
        const referenceGeometry = new BufferGeometry();
        referenceGeometry.setAttribute("position", new Float32BufferAttribute(referenceVertices, 3));
        const referenceMaterial = new PointsMaterial({ color: secondary, size: 0.022, transparent: true, opacity: visualMode === "day" ? 0.32 : 0.48, sizeAttenuation: true });
        topology.add(new Points(referenceGeometry, referenceMaterial));
        geometry.push(referenceGeometry);
        materials.push(referenceMaterial);

        const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
        reducedMotion = motionPreference;
        let visible = true;
        const draw = (time: number) => {
          if (disposed || !renderer || !scene) return;
          if (visible) {
            coreMaterial.uniforms.uTime.value = time * 0.001;
            topology!.rotation.y = motionPreference.matches ? -0.08 : time * 0.00012;
            topology!.rotation.x = 0.06 + Math.sin(time * 0.00018) * (motionPreference.matches ? 0 : 0.035);
            renderer.render(scene, camera);
          }
          if (!motionPreference.matches) frame = requestAnimationFrame(draw);
        };
        const resize = () => {
          const rect = canvas.getBoundingClientRect();
          if (!renderer || !rect.width || !rect.height) return;
          renderer.setSize(rect.width, rect.height, false);
          camera.aspect = rect.width / rect.height;
          camera.position.z = rect.width < 300 ? 6.8 : 6;
          camera.updateProjectionMatrix();
          if (motionPreference.matches) draw(0);
        };
        motionChangeHandler = () => {
          cancelAnimationFrame(frame);
          if (motionPreference.matches) draw(0);
          else if (visible) frame = requestAnimationFrame(draw);
        };
        motionPreference.addEventListener("change", motionChangeHandler);
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(canvas);
        resize();
        intersectionObserver = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (!visible) cancelAnimationFrame(frame);
          else if (!motionPreference.matches) frame = requestAnimationFrame(draw);
        });
        intersectionObserver.observe(canvas);
        if (motionPreference.matches) draw(0);
        else frame = requestAnimationFrame(draw);
        contextLostHandler = (event: Event) => {
          event.preventDefault();
          setUnavailable(true);
          setFailureReason("WebGL context was lost.");
          cancelAnimationFrame(frame);
        };
        contextRestoredHandler = () => {
          setUnavailable(false);
          setFailureReason("");
          resize();
          if (!motionPreference.matches) frame = requestAnimationFrame(draw);
        };
        canvas.addEventListener("webglcontextlost", contextLostHandler);
        canvas.addEventListener("webglcontextrestored", contextRestoredHandler);
      } catch (error) {
        if (!disposed) {
          setUnavailable(true);
          setFailureReason(error instanceof Error ? error.message : "WebGL renderer initialization failed.");
        }
      }
    }).catch((error: unknown) => {
      if (!disposed) {
        setUnavailable(true);
        setFailureReason(error instanceof Error ? error.message : "Three.js could not be loaded.");
      }
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      if (contextLostHandler) canvas.removeEventListener("webglcontextlost", contextLostHandler);
      if (contextRestoredHandler) canvas.removeEventListener("webglcontextrestored", contextRestoredHandler);
      if (motionChangeHandler) reducedMotion?.removeEventListener("change", motionChangeHandler);
      geometry.forEach((item) => item.dispose());
      materials.forEach((item) => item.dispose());
      renderer?.dispose();
    };
  }, [mode, visualMode]);

  return <canvas ref={canvasRef} className="source-topology-3d" aria-hidden="true" data-unavailable={unavailable || undefined} data-error={failureReason || undefined} />;
}
