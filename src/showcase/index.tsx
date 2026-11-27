import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { chapters, getChapter } from './chapters';
import { watchModes } from './displays';
import { createScene, sceneVeil } from './scene';

const clamp = (value: number) => Math.max(0, Math.min(value, 1));

const fallbackImages = [
  'material/fb91c1a17d330ca059d103e384a6119f.png',
  'material/showcase-cable.webp',
  'material/showcase-phone.webp',
  'material/showcase-board.webp',
  'material/9111f6ef15fec70092e2f92908c5e1bb.png',
];

const watchScreenDescriptions = [
  'Циферблат с часами, датой и показателем пульса.',
  'Тренировка с расстоянием, темпом и маршрутом GPS.',
  'Входящий звонок со смартфона, подключённого по Bluetooth.',
];

function Showcase({ track }: { track: HTMLElement }) {
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState(0);
  const [hasScene, setHasScene] = useState(false);
  const [reduced, setReduced] = useState(matchMedia('(prefers-reduced-motion: reduce)').matches);
  const frame = useRef({ progress: 0, display: 0, manual: false, buttonAt: -Infinity, active: 0 });
  const queue = useRef<() => void>(() => {});
  const graph = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = graph.current!;
    const pin = track.querySelector<HTMLElement>('.showcase-pin')!;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let scene: ReturnType<typeof createScene> | undefined;
    let raf = 0;
    let near = true;
    let dirty = true;
    let lastTime = performance.now();

    try {
      scene = createScene(host);
    } catch {
      setHasScene(false);
    }

    function updateMode() {
      setReduced(media.matches);
      track.classList.toggle('is-pinned', Boolean(scene) && !media.matches);
      dirty = true;
      schedule();
    }

    function onFrame(now: number) {
      raf = 0;
      const view = scene;
      const previousTime = lastTime;
      lastTime = now;
      if (!view) return;
      const state = frame.current;
      const pinned = !media.matches;
      const distance = Math.max(1, track.offsetHeight - pin.offsetHeight);
      const scroll = clamp((pin.getBoundingClientRect().top - track.getBoundingClientRect().top) / distance);
      const target = pinned ? scroll : chapters[state.active].stop;
      const oldProgress = state.progress;
      const elapsed = Math.max(12, Math.min(55, now - previousTime));
      state.progress = pinned && Math.abs(target - oldProgress) > .0007
        ? oldProgress + (target - oldProgress) * (1 - Math.exp(-elapsed / 74))
        : target;
      const activeChapter = pinned ? getChapter(state.progress) : state.active;
      if (activeChapter !== state.active) {
        state.active = activeChapter;
        state.manual = false;
        setActive(activeChapter);
      }

      const autoScreen = pinned && state.progress > .948 ? 2 : pinned && state.progress > .889 ? 1 : 0;
      if (!state.manual && state.display !== autoScreen) {
        state.display = autoScreen;
        setMode(autoScreen);
      }

      stage.current?.style.setProperty('--showcase-progress', String(state.progress));
      if (veil.current) veil.current.style.opacity = String(pinned ? sceneVeil(state.progress) : 0);
      const sincePress = now - state.buttonAt;
      const press = media.matches ? 0 : Math.sin(Math.PI * clamp(sincePress / 265));
      if (dirty || oldProgress !== state.progress || sincePress < 290) {
        dirty = false;
        try {
          view.render({ progress: state.progress, display: state.display, overrideDisplay: state.manual || !pinned, press });
        } catch {
          stopScene();
          return;
        }
      }
      if (Math.abs(target - state.progress) > .00001 || (sincePress < 290 && pinned)) schedule();
    }

    function schedule() {
      if (!raf && near && scene) raf = requestAnimationFrame(onFrame);
    }

    function stopScene() {
      if (!scene) return;
      scene.canvas.removeEventListener('webglcontextlost', stopScene);
      scene.dispose();
      scene = undefined;
      track.classList.remove('is-pinned');
      setHasScene(false);
    }

    function resize() {
      const width = host.clientWidth, height = host.clientHeight;
      if (width && height) scene?.resize(width, height);
      dirty = true;
      schedule();
    }

    queue.current = () => {
      dirty = true;
      schedule();
    };
    if (scene) {
      setHasScene(true);
      scene.canvas.addEventListener('webglcontextlost', stopScene);
    }

    const visibility = new IntersectionObserver(([entry]) => {
      near = entry.isIntersecting;
      if (near) {
        dirty = true;
        schedule();
      } else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }, { rootMargin: '160px' });
    visibility.observe(track);
    const sizes = new ResizeObserver(resize);
    sizes.observe(host);
    media.addEventListener('change', updateMode);
    window.addEventListener('scroll', schedule, { passive: true });
    updateMode();
    resize();

    return () => {
      cancelAnimationFrame(raf);
      visibility.disconnect();
      sizes.disconnect();
      media.removeEventListener('change', updateMode);
      window.removeEventListener('scroll', schedule);
      scene?.canvas.removeEventListener('webglcontextlost', stopScene);
      scene?.dispose();
      track.classList.remove('is-pinned');
      queue.current = () => {};
    };
  }, [track]);

  function openChapter(index: number) {
    const chapter = chapters[index];
    if (hasScene && !reduced) {
      const pin = track.querySelector<HTMLElement>('.showcase-pin')!;
      const stickyTop = parseFloat(getComputedStyle(pin).top);
      const top = window.scrollY + track.getBoundingClientRect().top - stickyTop;
      window.scrollTo({ top: top + chapter.stop * (track.offsetHeight - pin.offsetHeight), behavior: 'smooth' });
    } else {
      frame.current.active = index;
      frame.current.manual = false;
      setActive(index);
      setMode(0);
      queue.current();
    }
  }

  function changeDisplay(index: number) {
    frame.current.manual = true;
    frame.current.display = index;
    frame.current.buttonAt = performance.now();
    setMode(index);
    if (status.current) status.current.textContent = watchScreenDescriptions[index];
    queue.current();
  }

  const chapter = chapters[active];
  return (
    <div className="showcase-frame" data-chapter={active} ref={stage}>
      <div className="showcase-render" ref={graph} aria-hidden="true" />
      {!hasScene && <img className="showcase-poster" src={fallbackImages[active]} alt="" />}
      <div className="showcase-veil" ref={veil} aria-hidden="true" />
      <div className="showcase-shade" aria-hidden="true" />
      <div className="showcase-copy">
        <div className="showcase-story" key={chapter.label}>
          <p className="showcase-product">{chapter.product}</p>
          <h3>{chapter.title}</h3>
          <p className="showcase-description">{chapter.body}</p>
        </div>
        {active === 4 && hasScene && (
          <div className="showcase-screen-controls" role="group" aria-label="Экран часов">
            {watchModes.map((label, index) => (
              <button key={label} type="button" aria-pressed={mode === index} onClick={() => changeDisplay(index)}>{label}</button>
            ))}
          </div>
        )}
        <a className="showcase-link" href={chapter.link}>{chapter.action} <span aria-hidden="true">↗</span></a>
      </div>
      <div className="showcase-chapters" role="group" aria-label="Кадры 3D-обзора">
        {chapters.map(({ label }, index) => (
          <button key={label} type="button" aria-current={index === active ? 'step' : undefined} onClick={() => openChapter(index)}>{label}</button>
        ))}
      </div>
      <div className="showcase-status" role="status" ref={status} />
    </div>
  );
}

export function mount(track: HTMLElement) {
  const root = track.querySelector('.showcase-pin');
  if (root) createRoot(root).render(<Showcase track={track} />);
}
