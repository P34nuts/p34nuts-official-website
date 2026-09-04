import { useReducedMotion } from "framer-motion";
import { useEffect } from "react";

const clamp = (value: number) => Math.min(1, Math.max(0, value));

const desktopProfiles = [
  { lift: 32, rotate: -2.8, depth: 1.12, drift: -18 },
  { lift: 52, rotate: 2.2, depth: 1.16, drift: 24 },
  { lift: 38, rotate: -1.6, depth: 1.1, drift: 15 },
  { lift: 58, rotate: 2.9, depth: 1.17, drift: -25 },
  { lift: 43, rotate: -2.1, depth: 1.13, drift: 20 },
  { lift: 34, rotate: 1.8, depth: 1.11, drift: -16 },
] as const;

/**
 * Gives the existing NO STATIC frames an editorial, scroll-led choreography.
 * It writes only transform/filter variables and never changes gallery content.
 */
export function NoStaticGalleryController() {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const section = document.querySelector<HTMLElement>(".gallery-section");
    const figures = Array.from(section?.querySelectorAll<HTMLElement>(".gallery-grid figure") ?? []);
    if (!section || !figures.length || reduceMotion) return;

    let frame = 0;
    let activeIndex = -1;

    const update = () => {
      frame = 0;
      const viewport = window.innerHeight || 800;
      const mobile = window.matchMedia("(max-width: 820px)").matches;
      const sectionRect = section.getBoundingClientRect();
      const sectionProgress = clamp((viewport - sectionRect.top) / (viewport + sectionRect.height));
      const orbitX = sectionProgress * (mobile ? 12 : 22);
      const orbitScale = .78 + sectionProgress * (mobile ? .24 : .42);
      const orbitOpacity = .25 + sectionProgress * (mobile ? .25 : .5);
      let closestDistance = Number.POSITIVE_INFINITY;
      let nextActive = 0;

      figures.forEach((figure, index) => {
        const rect = figure.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const distance = Math.abs(center - viewport / 2);
        if (distance < closestDistance) {
          closestDistance = distance;
          nextActive = index;
        }

        const localProgress = clamp((viewport - rect.top) / (viewport + rect.height));
        const signed = localProgress - .5;
        const profile = desktopProfiles[index % desktopProfiles.length];
        const strength = mobile ? .36 : 1;
        const lift = -signed * profile.lift * strength;
        const drift = signed * profile.drift * strength;
        const rotate = signed * profile.rotate * strength;
        const imageScale = 1.04 + Math.sin(localProgress * Math.PI) * (profile.depth - 1) * (mobile ? .55 : 1);
        const imageY = -signed * (mobile ? 5 : 13);
        const scan = -rect.height * .2 + localProgress * rect.height * 1.4;

        figure.style.setProperty("--no-static-lift", `${lift.toFixed(2)}px`);
        figure.style.setProperty("--no-static-drift", `${drift.toFixed(2)}px`);
        figure.style.setProperty("--no-static-rotate", `${rotate.toFixed(3)}deg`);
        figure.style.setProperty("--no-static-image-scale", imageScale.toFixed(4));
        figure.style.setProperty("--no-static-image-y", `${imageY.toFixed(2)}px`);
        figure.style.setProperty("--no-static-scan", `${scan.toFixed(2)}px`);
      });

      if (activeIndex !== nextActive) {
        if (activeIndex >= 0) delete figures[activeIndex]?.dataset.noStaticActive;
        figures[nextActive].dataset.noStaticActive = "true";
        activeIndex = nextActive;
      }

      section.dataset.noStaticReady = "true";
      section.style.setProperty("--no-static-orbit-x", `${orbitX.toFixed(2)}vw`);
      section.style.setProperty("--no-static-orbit-scale", orbitScale.toFixed(3));
      section.style.setProperty("--no-static-orbit-opacity", orbitOpacity.toFixed(3));
    };

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
      delete section.dataset.noStaticReady;
      section.style.removeProperty("--no-static-orbit-x");
      section.style.removeProperty("--no-static-orbit-scale");
      section.style.removeProperty("--no-static-orbit-opacity");
      figures.forEach((figure) => {
        delete figure.dataset.noStaticActive;
        ["--no-static-lift", "--no-static-drift", "--no-static-rotate", "--no-static-image-scale", "--no-static-image-y", "--no-static-scan"].forEach((property) => figure.style.removeProperty(property));
      });
    };
  }, [reduceMotion]);

  return null;
}
