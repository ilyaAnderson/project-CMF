import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { beats, chapters, steppedIndex } from '../showcase/chapters';
import { media } from './products';

type Engine = typeof import('../showcase/scene');
type Scene = Awaited<ReturnType<Engine['createScene']>>;
type Mode = 'intro' | 'loading' | 'live' | 'frames';
export type TourHandle = { begin: (trigger: HTMLElement) => void };

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)');
const chapterGroups = [0, 1, 3, 4] as const;
const groupNames = ['Камни и волна', 'Кейс', 'Neckband Pro', 'Phone (3) / Watch Pro'];
const accents = [.108, .223, .345, .604, .728, .91, .97];
const clamp = (value: number) => Math.max(0, Math.min(1, value));

function artwork(index: number, mobile = false) {
  const { art } = chapters[index];
  return media(index === 0 && !mobile ? art : `frame-${art}${mobile ? '-mobile' : ''}`);
}

function playAccent(context: AudioContext, index: number) {
  const now = context.currentTime;
  const note = context.createOscillator();
  const gain = context.createGain();
  note.type = 'sine';
  note.frequency.setValueAtTime([165, 302, 247, 349, 440, 196, 262][index], now);
  note.frequency.exponentialRampToValueAtTime(note.frequency.value * .76, now + .16);
  gain.gain.setValueAtTime(.001, now);
  gain.gain.exponentialRampToValueAtTime(.075, now + .016);
  gain.gain.exponentialRampToValueAtTime(.001, now + .24);
  note.connect(gain).connect(context.destination);
  note.start(now);
  note.stop(now + .25);
}

export function Tour({ ref, paused, onCollection }: { ref: Ref<TourHandle>; paused: boolean; onCollection: () => void }) {
  const [mode, setMode] = useState<Mode>('intro');
  const [selected, setSelected] = useState(0);
  const [beatIndex, setBeat] = useState(0);
  const [loading, setLoading] = useState({ value: 0, label: 'Загрузка модели и света' });
  const [sound, setSound] = useState(false);
  const [canAnimate, setCanAnimate] = useState(() => !reducedMotion().matches);
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const callout = useRef<SVGSVGElement>(null);
  const loadingDialog = useRef<HTMLDialogElement>(null);
  const framesHeading = useRef<HTMLHeadingElement>(null);
  const explicitEntry = useRef(false);
  const audio = useRef<AudioContext | null>(null);
  const soundRef = useRef(false);
  const modeRef = useRef<Mode>('intro');
  const pausedRef = useRef(paused);
  const pointer = useRef({ x: 0, y: 0 });
  const schedule = useRef<() => void>(() => {});

  function updateMode(next: Mode) {
    modeRef.current = next;
    setMode(next);
  }

  const goToTour = useCallback((moveFocus: boolean) => {
    requestAnimationFrame(() => {
      if (moveFocus) {
        const heading = modeRef.current === 'frames' ? framesHeading.current : stage.current;
        heading?.focus({ preventScroll: true });
      }
      section.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
  }, []);

  function begin(explicit: boolean) {
    if (modeRef.current === 'intro') {
      explicitEntry.current = explicit;
      const next = reducedMotion().matches ? 'frames' : 'loading';
      updateMode(next);
      if (next === 'frames' && explicit) goToTour(true);
    } else if (explicit && modeRef.current !== 'loading') {
      goToTour(true);
    }
  }

  useImperativeHandle(ref, () => ({ begin: () => begin(true) }));

  useEffect(() => {
    let lastY = window.scrollY;
    const checkEntry = () => {
      const y = window.scrollY;
      const rect = section.current?.getBoundingClientRect();
      const header = document.querySelector('.site-header')?.getBoundingClientRect().height ?? 70;
      if (modeRef.current === 'intro' && rect && window.location.hash !== '#product-collections' &&
        y >= lastY && rect.top <= header + 4 && rect.top > -rect.height * .34) {
        begin(false);
      }
      lastY = y;
    };
    window.addEventListener('scroll', checkEntry, { passive: true });
    requestAnimationFrame(checkEntry);
    return () => window.removeEventListener('scroll', checkEntry);
  }, []);

  function showFrames(shouldFocus: boolean) {
    const wasExplicit = modeRef.current === 'loading' && explicitEntry.current;
    updateMode('frames');
    if (shouldFocus || wasExplicit) goToTour(true);
  }

  useEffect(() => {
    const query = reducedMotion();
    const change = () => {
      setCanAnimate(!query.matches);
      if (query.matches && (modeRef.current === 'live' || modeRef.current === 'loading')) showFrames(false);
    };
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);

  useEffect(() => {
    if (mode === 'loading' && explicitEntry.current) {
      const dialog = loadingDialog.current;
      document.documentElement.classList.add('tour-loading-open');
      dialog?.showModal();
      return () => {
        dialog?.close();
        document.documentElement.classList.remove('tour-loading-open');
      };
    }
  }, [mode]);

  useEffect(() => {
    pausedRef.current = paused;
    if (paused) pointer.current = { x: 0, y: 0 };
    schedule.current();
  }, [paused]);

  useEffect(() => {
    if (mode !== 'loading' && mode !== 'live') return;
    const controller = new AbortController();
    const root = section.current!;
    const pin = stage.current!;
    const renderHost = host.current!;
    let view: Scene | undefined;
    let frame = 0;
    let lastChapter = -1;
    let lastBeat = -1;
    let lastProgress: number | undefined;
    let near = true;
    let pointerX = 0;
    let pointerY = 0;
    let lost = false;

    function fallback() {
      if (controller.signal.aborted || lost) return;
      lost = true;
      if (modeRef.current === 'live') setSelected(Math.max(0, lastChapter));
      showFrames(root.getBoundingClientRect().top < innerHeight && root.getBoundingClientRect().bottom > 0 && modeRef.current === 'live');
    }

    function queueFrame() {
      if (!frame && view && near && !lost) frame = requestAnimationFrame(draw);
    }

    function draw() {
      frame = 0;
      if (!view || modeRef.current !== 'live' || !near) return;
      const top = parseFloat(getComputedStyle(pin).top);
      const distance = Math.max(1, root.offsetHeight - pin.offsetHeight);
      const progress = clamp((top - root.getBoundingClientRect().top) / distance);
      const chapter = steppedIndex(chapters, progress);
      const beat = steppedIndex(beats, progress);
      if (lastChapter !== chapter) { lastChapter = chapter; setSelected(chapter); }
      if (lastBeat !== beat) { lastBeat = beat; setBeat(beat); }
      if (lastProgress !== undefined && soundRef.current && audio.current?.state === 'running' && !pausedRef.current) {
        const crossing = accents.findLastIndex(mark => progress >= mark && lastProgress! < mark);
        if (crossing >= 0) playAccent(audio.current, crossing);
      }
      lastProgress = progress;
      const reactToPointer = progress >= .13 && progress < .41 && !pausedRef.current;
      const x = reactToPointer ? pointer.current.x : 0;
      const y = reactToPointer ? pointer.current.y : 0;
      pointerX += (x - pointerX) * .16;
      pointerY += (y - pointerY) * .16;
      try {
        const caption = beats[beat];
        const anchor = view.render(progress, pointerX, pointerY, 'anchor' in caption ? caption.anchor : undefined);
        const rect = renderHost.getBoundingClientRect();
        if (anchor && rect.width > 620) {
          const [x, y] = anchor;
          callout.current?.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
          callout.current?.querySelector('path')?.setAttribute('d', `M ${rect.width * .23} ${rect.height * .69} H ${Math.max(rect.width * .27, x - 32)} L ${x} ${y}`);
          callout.current?.querySelector('circle')?.setAttribute('cx', String(x));
          callout.current?.querySelector('circle')?.setAttribute('cy', String(y));
          callout.current?.setAttribute('data-visible', 'true');
        } else {
          callout.current?.setAttribute('data-visible', 'false');
        }
        pin.style.setProperty('--tour-progress', String(progress));
        pin.style.setProperty('--coast-poster', String(1 - clamp((progress - .005) / .043)));
        pin.style.setProperty('--coast-zoom', String(1 + clamp(progress / .045) * .14));
        pin.style.setProperty('--coast-close', String(Math.min(clamp((progress - .020) / .033), clamp((.079 - progress) / .022))));
        pin.style.setProperty('--foam-alpha', String(Math.min(clamp((progress - .097) / .013), clamp((.124 - progress) / .014))));
        pin.style.setProperty('--thread-alpha', String(Math.min(clamp((progress - .393) / .016), clamp((.441 - progress) / .023))));
        pin.style.setProperty('--wave-alpha', String(Math.min(clamp((progress - .078) / .032), clamp((.131 - progress) / .021))));
        pin.style.setProperty('--wave-slide', `${(clamp((progress - .078) / .053) - .5) * 16}%`);
        pin.style.setProperty('--lineup-alpha', String(clamp((progress - .979) / .010)));
        pin.toggleAttribute('data-light', progress >= .987);
        pin.querySelector('[data-percent]')!.textContent = `${String(Math.round(progress * 100)).padStart(2, '0')}%`;
      } catch {
        fallback();
      }
      if (Math.abs(x - pointerX) + Math.abs(y - pointerY) > .002) queueFrame();
    }

    function resize() {
      if (renderHost.clientWidth > 0 && renderHost.clientHeight > 0) view?.resize(renderHost.clientWidth, renderHost.clientHeight);
      queueFrame();
    }

    const observer = new ResizeObserver(resize);
    observer.observe(renderHost);
    const visibility = new IntersectionObserver(([entry]) => {
      near = entry.isIntersecting;
      if (near) queueFrame();
    }, { rootMargin: '100px' });
    visibility.observe(root);
    schedule.current = queueFrame;
    window.addEventListener('scroll', queueFrame, { passive: true });

    async function load() {
      let timeout = 0;
      try {
        timeout = window.setTimeout(() => { if (modeRef.current === 'loading') fallback(); }, 18000);
        const engine = await import(new URL('./showcase.js', document.baseURI).href) as Engine;
        if (controller.signal.aborted) return;
        const created = await engine.createScene(renderHost, controller.signal, (value, label) => setLoading({ value, label }));
        if (controller.signal.aborted) { created.dispose(); return; }
        view = created;
        view.canvas.addEventListener('webglcontextlost', fallback, { once: true });
        resize();
        await view.prepare();
        if (controller.signal.aborted || lost) return;
        setLoading({ value: 100, label: 'Обзор готов' });
        const shouldEnter = explicitEntry.current;
        updateMode('live');
        if (shouldEnter) goToTour(true);
        queueFrame();
      } catch {
        fallback();
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void load();
    return () => {
      controller.abort();
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
      window.removeEventListener('scroll', queueFrame);
      view?.canvas.removeEventListener('webglcontextlost', fallback);
      view?.dispose();
      schedule.current = () => {};
    };
  // A loading session stays mounted when it becomes live.
  }, [mode === 'loading' || mode === 'live']);

  useEffect(() => () => { if (audio.current) void audio.current.close(); }, []);

  async function toggleSound() {
    try {
      if (!audio.current) audio.current = new AudioContext();
      if (!soundRef.current) await audio.current.resume();
      soundRef.current = !soundRef.current;
      setSound(soundRef.current);
    } catch {
      soundRef.current = false;
      setSound(false);
    }
  }

  function seek(index: number) {
    const root = section.current!;
    const pin = stage.current!;
    if (modeRef.current !== 'live') {
      setSelected(index);
      if (modeRef.current === 'intro') showFrames(true);
      return;
    }
    const top = parseFloat(getComputedStyle(pin).top);
    const start = scrollY + root.getBoundingClientRect().top - top;
    window.scrollTo({ top: start + chapters[index].stop * (root.offsetHeight - pin.offsetHeight), behavior: 'smooth' });
  }

  const beat = beats[mode === 'live' ? beatIndex : 0];
  const loadingPanel = <>
    <h2 id={explicitEntry.current ? 'loading-title' : undefined}>Подготовка 3D-обзора</h2>
    <p>{loading.label}</p>
    <progress max="100" value={loading.value} aria-label="Загрузка 3D-обзора" />
    <span className="loading-value">{loading.value}%</span>
    <button type="button" className="outline-action" onClick={() => showFrames(true)}>Продолжить без 3D <span aria-hidden="true">→</span></button>
  </>;

  return <section ref={section} id="showcase" className={`tour tour-${mode}`} aria-label="3D-обзор CMF">
    {mode !== 'frames' && <div ref={stage} className="tour-stage" tabIndex={-1} aria-label="Интерактивный обзор"
      onPointerMove={event => {
        if (event.pointerType !== 'mouse' || pausedRef.current) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        pointer.current = { x: 2 * (event.clientX - bounds.left) / bounds.width - 1, y: 2 * (event.clientY - bounds.top) / bounds.height - 1 };
        schedule.current();
      }}
      onPointerLeave={() => { pointer.current = { x: 0, y: 0 }; schedule.current(); }}>
      <div className="tour-render" ref={host} aria-hidden="true" />
      <picture className="tour-poster">
        <source media="(max-width: 620px)" srcSet={artwork(0, true)} />
        <img src={artwork(0)} alt="" width="1280" height="720" fetchPriority="low" />
      </picture>
      {mode === 'live' && <>
        <img className="tour-coast-close" src={media('coast-close')} alt="" />
        <img className="tour-wave" src={media('frame-wave')} alt="" />
        <img className="tour-wave-foam" src={media('wave-foam')} alt="" />
        <div className="tour-thread" aria-hidden="true" />
        <div className="tour-final-art"><img src={media('lineup')} alt="" /></div>
        <svg ref={callout} aria-hidden="true" className="tour-callout" data-visible="false">
          <path fill="none" stroke="currentColor" strokeWidth="1" /><circle r="3" fill="currentColor" />
        </svg>
      </>}
      <div className="tour-shade" />
      {beat.title && <div className={`tour-copy${mode === 'live' && beatIndex > 0 ? ' tour-copy-detail' : ''}${beatIndex === beats.length - 1 ? ' tour-copy-final' : ''}`}>
        {beatIndex === 0 && <p className="eyebrow">3D-обзор</p>}
        <h2>{beat.title}</h2>
        {beat.body && <p>{beat.body}</p>}
        {beatIndex === 0 && <span className="scroll-cue"><span aria-hidden="true">↕</span> Прокрутите, чтобы начать</span>}
        {beatIndex === beats.length - 1 && <button type="button" className="action" onClick={onCollection}>Смотреть устройства <span aria-hidden="true">→</span></button>}
      </div>}
      <div className="tour-controls">
        <div className="tour-progress" aria-hidden="true"><span /></div>
        <div className="tour-control-row">
          <div className="tour-chapters" aria-label="Перейти к главе">
            {chapterGroups.map((index, group) => {
              const current = selected >= index && (chapterGroups[group + 1] === undefined || selected < chapterGroups[group + 1]);
              return <button type="button" key={index} aria-current={current ? 'step' : undefined} onClick={() => seek(index)}>{groupNames[group]}</button>;
            })}
          </div>
          <span className="tour-mobile-title">{chapters[selected].title}</span>
          <div className="tour-tools">
            {mode === 'live' && <>
              <button type="button" className="tour-sound" aria-pressed={sound}
                onClick={() => void toggleSound()}>{sound ? 'Выключить звук' : 'Включить звук'}</button>
              <button type="button" onClick={() => showFrames(true)}>Кадры</button>
            </>}
            <span className="tour-count"><span data-percent style={{ display: mode === 'live' ? undefined : 'none' }}>00%</span> {selected + 1} / 7</span>
          </div>
        </div>
        {mode === 'intro' && <p className="tour-mobile-cue">Прокрутите, чтобы начать <span aria-hidden="true">↓</span></p>}
      </div>
      {mode === 'loading' && !explicitEntry.current && <div className="tour-loading-inline"><div className="loading-panel">{loadingPanel}</div></div>}
    </div>}

    <dialog ref={loadingDialog} className="loading-dialog" aria-labelledby="loading-title"
      onCancel={event => { event.preventDefault(); showFrames(true); }}>
      {mode === 'loading' && explicitEntry.current && <div className="loading-panel">{loadingPanel}</div>}
    </dialog>

    {mode === 'frames' && <div className="frame-review">
      <p className="eyebrow">3D-обзор</p>
      <h2 ref={framesHeading} tabIndex={-1}>Обзор в кадрах</h2>
      <p>Семь глав с подписями. Выберите сцену или листайте дальше.</p>
      <div className="frame-review-grid">
        <figure>
          <picture>
            <source media="(max-width: 620px)" srcSet={artwork(selected, true)} />
            <img src={artwork(selected)} alt="" width="1280" height="720" />
          </picture>
          <figcaption aria-live="polite">
            <strong>{chapters[selected].title}</strong>
            <p>{chapters[selected].body}</p>
          </figcaption>
          <div className="frame-pagination">
            <button className="circle-arrow" aria-label="Предыдущая сцена" disabled={selected === 0} onClick={() => seek(selected - 1)}>←</button>
            <span>{selected + 1} / 7</span>
            <button className="circle-arrow" aria-label="Следующая сцена" disabled={selected === 6} onClick={() => seek(selected + 1)}>→</button>
          </div>
        </figure>
        <ol className="frame-list">
          {chapters.map(({ title }, index) => <li key={title}>
            <button aria-current={selected === index ? 'step' : undefined} type="button" onClick={() => seek(index)}>
              <span>{String(index + 1).padStart(2, '0')}</span>{title}
            </button>
          </li>)}
        </ol>
      </div>
      <div className="review-actions">
        <button className="action" type="button" onClick={onCollection}>Смотреть устройства <span aria-hidden="true">→</span></button>
        {canAnimate && <button className="text-action" type="button" onClick={() => {
          explicitEntry.current = true;
          setLoading({ value: 0, label: 'Загрузка модели и света' });
          updateMode('loading');
        }}>Открыть 3D-обзор</button>}
      </div>
    </div>}
  </section>;
}
