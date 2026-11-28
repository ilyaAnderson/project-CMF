import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createBuds, createNeckband } from './audio';
import { createPhone, phoneCenter } from './phone';
import { createWatch } from './watch';
import { atmosphere } from './materials';
import { createCoast, createStudio, studioEnvironment } from './locations';
import { part, vector } from './geometry';

const smooth = (start: number, end: number, progress: number) => T.MathUtils.smoothstep(progress, start, end);
const mix = T.MathUtils.lerp;
type Point = [number, number, number];
type Shot = [number, Point, Point];

function cameraTrack(shots: Shot[]) {
  const positions = new T.CatmullRomCurve3(shots.map(([, from]) => vector(...from)));
  const targets = new T.CatmullRomCurve3(shots.map(([, , at]) => vector(...at)));
  return (progress: number, camera: T.Vector3, focus: T.Vector3) => {
    const next = shots.findIndex(([mark]) => progress <= mark);
    const end = next === -1 ? shots.length - 1 : Math.max(1, next);
    const a = shots[end - 1][0];
    const b = shots[end][0];
    const t = (end - 1 + T.MathUtils.clamp((progress - a) / (b - a), 0, 1)) / (shots.length - 1);
    positions.getPoint(t, camera);
    targets.getPoint(t, focus);
  };
}

const coastTrack = cameraTrack([
  [0, [1.46, .79, 9.65], [0, -.01, 0]],
  [.035, [.93, .77, 7.24], [0, 0, 0]],
  [.060, [.58, .53, 7.40], [0, .04, 0]],
  [.132, [.31, .45, 6.73], [0, .035, 0]],
  [.162, [-.48, .82, 2.64], [-.56, .59, .06]],
  [.188, [.24, 3.82, 4.40], [0, .20, -.12]],
  [.215, [.58, 3.93, 4.33], [0, .29, -.08]],
  [.25, [1.27, 2.84, 5.07], [0, .79, 0]],
  [.27, [1.63, 2.72, 5.01], [0, 1.14, 0]],
]);
const driverTrack = cameraTrack([
  [.27, [.46, .76, 4.83], [-.01, .18, 0]],
  [.31, [.42, .65, 4.15], [-.12, .16, 0]],
  [.36, [.24, .54, 4.27], [-.19, .20, 0]],
  [.403, [.18, .40, 4.01], [-.40, .16, 0]],
]);
const travelTrack = cameraTrack([
  [.407, [-1.87, .89, 3.7], [-.60, .14, 0]],
  [.441, [-.77, 1.63, 4.43], [.37, .06, 0]],
  [.47, [.14, 1.82, 4.59], [1.03, .03, 0]],
  [.505, [11.86, 1.48, 3.78], [12.71, .02, 0]],
  [.53, [21.46, 1.75, 3.67], [22.13, .19, -.03]],
  [.557, [22.38, 1.91, 5.50], [23.18, .25, 0]],
  [.580, [24.88, 2.45, 6.88], [26.48, .54, 0]],
  [.610, [28.67, 2.5, 6.81], [27.80, .58, 0]],
  [.644, [28.67, 1.81, 6.28], [27.80, 1.58, 0]],
  [.673, [28.12, 1.81, 6.20], [27.80, 1.57, 0]],
  [.704, [28.04, 1.62, 5.88], [27.80, 1.57, 0]],
  [.732, [28.30, 2.98, 2.58], [28.32, 2.81, .07]],
  [.751, [28.30, 3.01, 2.57], [28.32, 2.81, .07]],
  [.782, [27.80, 1.65, 7.87], [27.80, 1.55, 0]],
  [.805, [27.8, 1.58, 9.74], [27.8, 1.54, 8.95]],
]);
const watchTrack = cameraTrack([
  [.805, [0, .04, .22], [0, -.05, -.98]],
  [.823, [0, -.06, .32], [0, -.06, -1.24]],
  [.846, [.33, -.11, .34], [-.20, -.14, -1.06]],
  [.875, [.19, -.55, .29], [-.53, -.03, -.98]],
  [.897, [.53, -.53, .26], [.51, -.44, -.77]],
  [.910, [.25, .02, .86], [0, .06, .26]],
  [.924, [1.43, .24, 2.98], [.08, .03, .13]],
  [.950, [4.60, 1.10, 6.57], [.05, .02, -.15]],
  [.970, [4.5, .92, 6.57], [.07, .02, -.14]],
  [1, [4.71, .93, 6.66], [.06, .015, -.2]],
]);

const watchCenter = vector(phoneCenter.x, 1.54, 9.52);
const target = () => vector(0, 0, 0);
const chaptersStart = [.41, .78] as const;

export async function createScene(
  container: HTMLElement,
  signal: AbortSignal,
  progress: (value: number, label: string) => void,
) {
  const renderer = new T.WebGLRenderer({ alpha: false, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.13;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  let model: T.Group;
  try {
    const url = './material/cmf/buds-case.glb';
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Buds model: HTTP ${response.status}`);
    const total = Number(response.headers.get('content-length'));
    const reader = response.body?.getReader();
    let buffer: ArrayBuffer;
    if (reader && total > 0) {
      const chunks: Uint8Array[] = [];
      let loaded = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.byteLength;
        progress(Math.round(55 * Math.min(1, loaded / total)), 'Модель Buds Pro 2');
      }
      const bytes = new Uint8Array(loaded);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      buffer = bytes.buffer;
    } else {
      if (reader) reader.releaseLock();
      buffer = await response.arrayBuffer();
    }
    progress(59, 'Материалы и окружение');
    model = (await new GLTFLoader().parseAsync(buffer, './material/cmf/')).scene;
  } catch (error) {
    renderer.dispose();
    throw error;
  }

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(39, 1, .018, 125);
  const sky = atmosphere();
  const environment = studioEnvironment(renderer);
  scene.environment = environment.texture;
  const key = new T.DirectionalLight(0xffeee3, 2.5);
  const rim = new T.DirectionalLight(0xff8857, 2.08);
  const fill = new T.HemisphereLight(0xe7f1ff, 0x433029, 1.3);
  key.position.set(-3.4, 5.8, 4.5);
  rim.position.set(4.2, 3.2, -5.5);
  scene.add(fill, key, rim, sky.sky);

  const buds = createBuds(model);
  const coast = createCoast();
  const studio = createStudio();
  scene.add(buds.caseRig, buds.explode, coast.coast, studio.studio);

  let neckband: ReturnType<typeof createNeckband> | undefined;
  let phone: ReturnType<typeof createPhone> | undefined;
  let watch: ReturnType<typeof createWatch> | undefined;
  const bluetooth = new T.Group();
  for (const radius of [1.16, 1.38]) {
    const ring = part(bluetooth, new T.TorusGeometry(radius, .007, 8, 90), new T.MeshBasicMaterial({
      color: 0xc5ddff, transparent: true, opacity: 0, depthWrite: false, toneMapped: false,
    }));
    ring.rotation.x = -Math.PI / 2;
    ring.scale.x = 1.9;
  }
  scene.add(bluetooth);
  let warm: T.PointLight | undefined;
  let cool: T.PointLight | undefined;
  let width = 1;
  let height = 1;
  let compact = false;
  let hasDisposed = false;
  let nextStage = 0;
  let watchMode = -1;
  let lastPose = 0;
  let lastX = 0;
  let lastY = 0;
  let lastAnchor: string | undefined;
  let redraw = 0;

  const focus = target();
  const cameraOffset = target();
  const pointerRotation = new T.Euler();
  const projected = target();

  function loadPhoneAndNeckband() {
    if (phone || hasDisposed) return;
    neckband = createNeckband();
    phone = createPhone();
    neckband.position.y = -.70;
    scene.add(neckband, phone.root);
    new T.TextureLoader().load('./material/showcase/phone-back.webp', texture => {
      if (hasDisposed || !phone) { texture.dispose(); return; }
      texture.colorSpace = T.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      phone.setBackTexture(texture);
      cancelAnimationFrame(redraw);
      redraw = requestAnimationFrame(() => { if (!hasDisposed) render(lastPose, lastX, lastY, lastAnchor); });
    }, undefined, () => {});
  }

  function loadWatch() {
    if (watch || hasDisposed) return;
    watch = createWatch();
    watch.group.position.copy(watchCenter);
    warm = new T.PointLight(0xffad4f, 2.35, 2.5, 2);
    warm.position.set(0, .37, .11);
    cool = new T.PointLight(0xa7c6e2, .43, 1.8, 2);
    cool.position.set(-.84, -.91, .14);
    watch.group.add(warm, cool);
    scene.add(watch.group);
  }

  function resize(w: number, h: number) {
    width = w;
    height = h;
    compact = w <= 620;
    const limit = Math.sqrt(3_400_000 / (w * h));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, limit, 2));
    renderer.setSize(w, h, false);
  }

  function pose(p: number, px: number, py: number) {
    const coastVisible = p < .11;
    const caseVisible = p < .278;
    const driversVisible = p >= .270 && p < .411;
    const chamber = smooth(.795, .825, p) * (1 - smooth(.898, .916, p));
    const blend = smooth(.095, .121, p);
    coast.coast.visible = coastVisible;
    coast.water.uniforms.travel.value = p;
    studio.studio.visible = p >= .11 && p < .805;
    studio.reflector.visible = p >= .121 && p < .789;
    studio.caseShadow.visible = caseVisible || driversVisible;
    studio.neckShadow.visible = p >= .409 && p < .605;
    studio.phoneShadow.visible = p >= .565 && p < .78;
    sky.uniforms.zenith.value.setHex(coastVisible ? 0x14222c : 0x111516);
    sky.uniforms.horizon.value.setHex(coastVisible ? 0x627788 : 0x2a3033);
    sky.uniforms.glow.value.setHex(coastVisible ? 0xd88b63 : 0x655855);
    sky.uniforms.strength.value = coastVisible ? .60 : .15;
    key.color.setHex(coastVisible ? 0xe1edff : 0xffefe3);
    key.intensity = mix(2.1, 1.97, blend) * (1 - .68 * chamber);
    rim.color.setHex(p > .58 && p < .80 ? 0xb6cee7 : p > .909 ? 0xd8e7ef : 0xff8f56);
    rim.intensity = (p > .61 && p < .80 ? 1.24 : 2.28) * (1 - .61 * chamber);
    fill.intensity = .86 * (1 - .65 * chamber);
    scene.environmentIntensity = mix(.61, .81, blend) * (1 - .80 * chamber);
    renderer.toneMappingExposure = coastVisible ? 1.04 : 1.03;

    buds.caseRig.visible = caseVisible;
    buds.explode.visible = driversVisible;
    if (caseVisible || driversVisible) {
      const openingPhase = smooth(.175, .223, p);
      const opening = p < .20 ? .39 * smooth(.177, .20, p) : mix(.39, 1, smooth(.20, .23, p));
      const flight = smooth(.219, .268, p);
      const separation = smooth(.291, .389, p);
      const pitch = mix(1.46, .32, openingPhase);
      buds.caseRig.rotation.set(pitch, -.12 + flight * .25, -.035 + px * .034);
      buds.caseRig.position.set(0, mix(-.055, -.56, openingPhase) - smooth(.264, .278, p) * 3.0, 0);
      buds.explode.position.set(.18 + smooth(.393, .412, p) * -3.9, .24, .02);
      buds.explode.rotation.set(-py * .034, px * .034, -.12);
      buds.pose(opening, flight, separation, smooth(.148, .183, p) * 1.65);
    }

    if (neckband && phone) {
      neckband.visible = p >= .407 && p < .604;
      phone.root.visible = p >= .567 && p < .804;
      if (phone.root.visible) {
        const lift = smooth(.611, .645, p);
        const spin = Math.PI * smooth(.647, .69, p);
        const slide = 5.0 * (1 - smooth(.571, .605, p));
        phone.pose(slide, lift, spin, smooth(.715, .761, p));
      }
    }
    bluetooth.visible = p > .595 && p < .632;
    if (bluetooth.visible) {
      bluetooth.position.set(phoneCenter.x, .30, 0);
      const phase = smooth(.594, .612, p) * (1 - smooth(.615, .632, p));
      bluetooth.scale.setScalar(.94 + phase * .08);
      bluetooth.children.forEach((obj, index) => {
        const ring = obj as T.Mesh<T.TorusGeometry, T.MeshBasicMaterial>;
        ring.material.opacity = phase * (index === 0 ? .63 : .28);
      });
    }
    if (watch) {
      watch.group.visible = p >= .793;
      warm!.position.z = -.86;
      warm!.intensity = 1.85 * chamber;
      cool!.intensity = .49 * chamber;
      if (watch.group.visible) {
        const close = smooth(.898, .908, p);
        watch.group.rotation.z = .10 * smooth(.924, .954, p);
        watch.pose(close, smooth(.781, .822, p), 0);
        const mode = p >= .972 ? 2 : p >= .957 ? 1 : 0;
        const amount = mode === 1 ? smooth(.957, .969, p) : mode === 2 ? smooth(.972, .982, p) : 1;
        const quantized = Math.round(amount * 24);
        const screen = mode * 25 + quantized;
        if (watchMode !== screen) {
          watch.setDisplay(mode, quantized / 24);
          watchMode = screen;
        }
      }
    }

    if (p < .274) coastTrack(p, camera.position, focus);
    else if (p < .411) driverTrack(p, camera.position, focus);
    else if (p < .805) travelTrack(p, camera.position, focus);
    else {
      watchTrack(p, camera.position, focus);
      camera.position.add(watchCenter);
      focus.add(watchCenter);
    }

    const mobileScale = compact ? (chamber > .04 ? 1 : p >= .713 && p <= .76 ? 1.14
      : p >= .278 && p <= .403 ? 1.58 : p < .61 ? 1.32 : p > .935 ? 1.24 : 1.11) : 1;
    const responsiveDistance = !compact && width / height < 1.35 ? 1.12 : 1;
    cameraOffset.copy(camera.position).sub(focus).multiplyScalar(mobileScale * responsiveDistance);
    if (p >= .13 && p < .41) {
      pointerRotation.set(py * .034, px * .034, 0);
      cameraOffset.applyEuler(pointerRotation);
      focus.x -= px * .07;
      focus.y += py * .05;
    }
    camera.position.copy(focus).add(cameraOffset);
    camera.fov = 37 + 23 * chamber + (compact && p < .61 ? 3 : 0);
    const frameX = p < .118 ? 0 : p < .785 ? -.135 : p > .92 ? -.12 : 0;
    const centerMacro = 1 - .66 * (smooth(.147, .160, p) * (1 - smooth(.166, .187, p)));
    const shiftY = compact ? height * (p < .60 ? .073 : .034) : 0;
    camera.setViewOffset(width, height, compact ? 0 : width * frameX * centerMacro, shiftY, width, height);
    camera.lookAt(focus);
    camera.updateMatrixWorld();
    sky.sky.position.copy(camera.position);
  }

  function render(p: number, pointerX: number, pointerY: number, anchor?: string): [number, number] | null {
    lastPose = p;
    lastX = pointerX;
    lastY = pointerY;
    lastAnchor = anchor;
    if (p >= chaptersStart[0] - .01) loadPhoneAndNeckband();
    if (p >= chaptersStart[1] - .026) loadWatch();
    pose(p, pointerX, pointerY);
    renderer.render(scene, camera);
    if (!anchor) return null;
    const markers = buds.anchors as Record<string, T.Object3D>;
    const object = markers[anchor] ?? phone?.anchors[anchor];
    if (!object) return null;
    object.getWorldPosition(projected).project(camera);
    if (Math.abs(projected.x) > 1.02 || Math.abs(projected.y) > 1.02 || projected.z > 1) return null;
    return [(projected.x + 1) * width / 2, (1 - projected.y) * height / 2];
  }

  async function prepare() {
    progress(77, 'Подготовка света');
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    if (signal.aborted || hasDisposed) return;
    pose(0, 0, 0);
    await renderer.compileAsync(scene, camera);
    if (signal.aborted || hasDisposed) return;
    progress(94, 'Первый кадр');
    render(0, 0, 0);
    const loadRest = () => {
      if (signal.aborted || hasDisposed) return;
      loadPhoneAndNeckband();
      nextStage = window.setTimeout(loadWatch, 220);
    };
    nextStage = window.setTimeout(loadRest, 280);
  }

  function dispose() {
    if (hasDisposed) return;
    hasDisposed = true;
    window.clearTimeout(nextStage);
    cancelAnimationFrame(redraw);
    const materials = new Set<T.Material>();
    const geometries = new Set<T.BufferGeometry>();
    const textures = new Set<T.Texture>();
    scene.traverse(object => {
      if (!(object instanceof T.Mesh) && !(object instanceof T.Line)) return;
      geometries.add(object.geometry);
      const list = Array.isArray(object.material) ? object.material : [object.material];
      list.forEach(material => materials.add(material));
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => {
      for (const value of Object.values(material)) if (value instanceof T.Texture) textures.add(value);
      if (material !== studio.reflector.material) material.dispose();
    });
    textures.forEach(texture => texture.dispose());
    studio.reflector.dispose();
    environment.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }

  container.append(renderer.domElement);
  return { resize, render, prepare, dispose, canvas: renderer.domElement };
}
