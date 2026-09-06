import { useEffect, useRef, type ReactNode } from "react";

type SignalFluidFieldProps = { children: ReactNode };

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
  phase: number;
};

export function SignalFluidField({ children }: SignalFluidFieldProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const field = fieldRef.current;
    const canvas = canvasRef.current;
    if (!field || !canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let width = 0;
    let height = 0;
    let renderWidth = 0;
    let renderHeight = 0;
    let lastTime = performance.now();
    let lastDraw = 0;
    let visible = false;
    const pointer = { x: .5, y: .55, targetX: .5, targetY: .55, energy: 0 };
    const particles: Particle[] = [
      { x: .18, y: .26, vx: .018, vy: .011, radius: .28, hue: 218, phase: .3 },
      { x: .72, y: .34, vx: -.014, vy: .016, radius: .34, hue: 267, phase: 1.8 },
      { x: .52, y: .7, vx: .012, vy: -.013, radius: .31, hue: 343, phase: 3.1 },
      { x: .86, y: .78, vx: -.01, vy: -.009, radius: .24, hue: 196, phase: 4.2 },
    ];

    const resize = () => {
      const rect = field.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      // The field can span several viewport heights; render it at a deliberately
      // small bitmap and let CSS scale it up instead of blurring thousands of pixels.
      renderWidth = Math.max(240, Math.min(900, Math.round(width * .42)));
      renderHeight = Math.max(240, Math.min(1100, Math.round(height * .42)));
      canvas.width = renderWidth;
      canvas.height = renderHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(renderWidth / width, 0, 0, renderHeight / height, 0, 0);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = field.getBoundingClientRect();
      pointer.targetX = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      pointer.targetY = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      pointer.energy = Math.min(1, pointer.energy + .14);
    };

    const animate = (timestamp: number) => {
      frame = 0;
      if (!visible || document.hidden) return;
      if (timestamp - lastDraw < 34) {
        frame = window.requestAnimationFrame(animate);
        return;
      }
      const delta = Math.min((timestamp - lastTime) / 1000, .05);
      lastTime = timestamp;
      lastDraw = timestamp;
      pointer.x += (pointer.targetX - pointer.x) * Math.min(1, delta * 4.5);
      pointer.y += (pointer.targetY - pointer.y) * Math.min(1, delta * 4.5);
      pointer.energy *= Math.pow(.035, delta);
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "screen";
      context.filter = "blur(22px)";

      particles.forEach((particle) => {
        const drift = reduceMotion ? 0 : timestamp * .00002;
        particle.x += (particle.vx + Math.sin(timestamp * .00025 + particle.phase) * .002 + (pointer.x - particle.x) * pointer.energy * .018) * delta;
        particle.y += (particle.vy + Math.cos(timestamp * .00022 + particle.phase) * .002 + (pointer.y - particle.y) * pointer.energy * .018) * delta;
        if (particle.x < -.18 || particle.x > 1.18) particle.vx *= -1;
        if (particle.y < -.18 || particle.y > 1.18) particle.vy *= -1;
        const x = (particle.x + Math.sin(drift + particle.phase) * .02) * width;
        const y = (particle.y + Math.cos(drift + particle.phase) * .02) * height;
        const radius = particle.radius * Math.min(width, height);
        const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `hsla(${particle.hue}, 78%, 48%, .16)`);
        gradient.addColorStop(.42, `hsla(${particle.hue + 22}, 74%, 34%, .08)`);
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        context.fillStyle = gradient;
        context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      });

      context.filter = "none";
      context.globalCompositeOperation = "source-over";
      frame = window.requestAnimationFrame(animate);
    };

    const start = () => {
      if (visible && !frame) {
        lastTime = performance.now();
        frame = window.requestAnimationFrame(animate);
      }
    };
    const stop = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    }, { rootMargin: "20% 0px 20% 0px" });
    const onVisibilityChange = () => document.hidden ? stop() : start();

    resize();
    observer.observe(field);
    field.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stop();
      observer.disconnect();
      field.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return <div ref={fieldRef} className="signal-fluid-field"><canvas ref={canvasRef} aria-hidden="true" />{children}</div>;
}
