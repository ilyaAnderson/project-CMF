import * as T from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { vector } from './geometry';
import { createBudsLocations, createStudio } from './locations';
import { createBuds, createNeckband, portX, portY } from './audio';
import { createPhone, phoneCenter } from './phone';
import { createWatch } from './watch';
import { atmosphere } from './materials';
import { chapters } from './chapters';

const smooth = (start: number, end: number, progress: number) => T.MathUtils.smoothstep(progress, start, end);
const lerp = T.MathUtils.lerp;
const pulse = (progress: number, at: number, span: number) => 1 - smooth(0, span, Math.abs(progress - at));
const watchEntry = .631;
const watchAnchor = vector(phoneCenter.x, 1.17, 10.40);
const watchOrientation = new T.Quaternion().setFromAxisAngle(vector(0, 1, 0), Math.PI);
const pullback = vector(phoneCenter.x, 1.20, 7.25);
const watchFront = .880;
const wiredStart = chapters[1].start;

type Coordinates = [number, number, number];
type Shot = [number, Coordinates, Coordinates];
type Frame = { progress: number; display: number; overrideDisplay: boolean; press: number };

const beds = {
  stone: [0x080f14, 0x596a78, 0xd07050, .42],
  paper: [0xe3e3de, 0xf2efeb, 0xffffff, 0],
  gallery: [0x111216, 0x62616a, 0xf3b398, .15],
  cable: [0x17181b, 0x49484d, 0xcd8f79, .27],
  board: [0x090d0c, 0x212d26, 0x9b703e, .02],
} as const;

const shots = {
  buds: [
    [0, [5.74, 1.21, 7.86], [0, -.04, 0]],
    [.038, [3.64, 1.09, 5.41], [0, -.01, .06]],
    [.076, [1.38, 2.82, 4.86], [-.15, .16, -.19]],
    [.107, [-.78, 2.32, 4.48], [0, .73, -.13]],
    [.133, [-1.46, 1.99, 4.70], [0, 1.42, -.13]],
    [.156, [.26, 1.55, 4.70], [0, 1.51, .03]],
    [.183, [.80, 1.62, 3.26], [.95, 1.41, .17]],
    [.208, [1.95, 2.08, 4.72], [.29, 1.04, .03]],
    [.235, [4.03, 4.18, 7.40], [.39, .28, .02]],
    [.263, [2.08, 2.28, 6.80], [.07, .20, 0]],
    [wiredStart, [.78, 1.46, 6.14], [.10, .07, 0]],
  ],
  cable: [
    [wiredStart, [-2.17, .73, 3.27], [-.50, .12, 0]],
    [.312, [1.03, .85, 4.22], [2.05, .13, 0]],
    [.359, [9.89, 1.37, 3.71], [10.57, .01, 0]],
    [.399, [18.43, .39, 3.20], [19.07, .10, 0]],
    [.433, [23.01, .62, 2.86], [23.52, .17, .04]],
    [.457, [25.67, 1.31, 2.48], [portX - .35, portY, 0]],
    [.487, [25.91, 1.30, 2.63], [portX + .31, portY + .04, 0]],
    [.522, [27.15, 2.50, 4.85], [phoneCenter.x - .84, .97, 0]],
    [.554, [29.60, 2.08, 5.70], [phoneCenter.x, 1.06, 0]],
    [.585, [30.49, 1.59, 5.87], [phoneCenter.x, 1.07, 0]],
    [watchEntry, pullback.toArray(), [phoneCenter.x, 1.07, 0]],
  ],
  watch: [
    [watchEntry, [0, .03, 3.15], [0, -.10, 10.40]],
    [.652, [.10, -.47, .95], [.04, -.31, 5.72]],
    [.679, [.96, -1.17, .322], [.26, -.48, -.045]],
    [.700, [.93, -1.11, .342], [.53, -.51, -.099]],
    [.725, [.24, -.90, .279], [.30, -.35, -.104]],
    [.750, [.00, -.65, .360], [-.48, -.05, -.110]],
    [.778, [-1.06, -.33, .322], [-.31, .20, -.131]],
    [.805, [-.52, .95, .288], [.39, .64, -.122]],
    [.830, [.87, 1.00, .328], [.39, .51, -.085]],
    [.849, [.87, .98, .72], [.26, .39, -.030]],
    [watchFront, [1.21, .29, 5.38], [0, .11, -.13]],
    [.914, [.00, .05, 6.66], [0, .04, -.04]],
    [.949, [.44, .03, 6.66], [0, .035, -.04]],
    [1, [0, .015, 6.72], [0, .03, -.04]],
  ],
} satisfies Record<string, Shot[]>;

function shotPath(shots: Shot[]) {
  const positions = shots.map(([, position]) => vector(...position));
  const targets = shots.map(([, , focus]) => vector(...focus));
  const track = new T.CatmullRomCurve3(positions, false, 'centripetal');
  const gaze = new T.CatmullRomCurve3(targets, false, 'centripetal');
  return (progress: number, camera: T.Vector3, target: T.Vector3) => {
    const next = shots.findIndex(([t]) => progress <= t);
    const i = next < 0 ? shots.length - 1 : Math.max(1, next);
    const start = shots[i - 1][0], end = shots[i][0];
    const parameter = (i - 1 + T.MathUtils.clamp((progress - start) / (end - start), 0, 1)) / (shots.length - 1);
    track.getPoint(parameter, camera);
    gaze.getPoint(parameter, target);
  };
}

export async function loadShowcaseTextures() {
  const loader = new T.TextureLoader();
  try {
    const back = await loader.loadAsync('./material/showcase/phone-back.webp');
    back.colorSpace = T.SRGBColorSpace;
    back.anisotropy = 8;
    return back;
  } catch {
    return undefined;
  }
}

export function createScene(container: HTMLElement, phoneTexture?: T.Texture) {
  const renderer = new T.WebGLRenderer({ alpha: false, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.01;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new T.Scene();
  const fog = new T.FogExp2(0x26272a, .043);
  scene.fog = fog;
  const camera = new T.PerspectiveCamera(39, 1, .018, 115);
  const room = new RoomEnvironment();
  const pmrem = new T.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, .045);
  scene.environment = environment.texture;
  scene.environmentIntensity = .85;
  room.dispose();
  pmrem.dispose();
  const sky = atmosphere();
  scene.add(sky.sky);

  const fill = new T.HemisphereLight(0xe2e6ed, 0x595051, 1.04);
  const key = new T.DirectionalLight(0xfff1e3, 2.72);
  key.position.set(-2.7, 4.8, 3.61);
  const edge = new T.DirectionalLight(0xf3a481, 2.45);
  edge.position.set(3.65, 3.7, -4.65);
  const side = new T.DirectionalLight(0xbbd6ec, 1.65);
  side.position.set(-3.78, .58, -2.38);
  scene.add(fill, key, edge, side);

  const buds = createBuds();
  const locations = createBudsLocations();
  const collar = createNeckband();
  const phone = createPhone(phoneTexture);
  const { studio, phoneShadow } = createStudio();
  const watch = createWatch();

  const audioSet = new T.Group();
  audioSet.add(locations.terrain, locations.gallery, buds.group);
  const phoneSet = new T.Group();
  phoneSet.add(studio, collar.group, phone.root);
  watch.group.position.copy(watchAnchor);
  watch.group.quaternion.copy(watchOrientation);
  const insideA = new T.PointLight(0xf2ba75, .49, 1.8, 2);
  const insideB = new T.PointLight(0xc9d9e5, .64, 2.4, 2);
  insideA.position.set(-.46, -.98, .224);
  insideB.position.set(.97, .83, .17);
  watch.group.add(insideA, insideB);
  scene.add(audioSet, phoneSet, watch.group);

  const moveBuds = shotPath(shots.buds);
  const moveNeckband = shotPath(shots.cable);
  const moveWatch = shotPath(shots.watch);
  const target = vector(0, 0, 0);
  const lit = new T.Color();
  let width = 1, height = 1, compact = false, activeDisplay = -1;
  let preparing = true;

  function resize(w: number, h: number) {
    width = w;
    height = h;
    compact = w < 760;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.35 : 1.7));
    renderer.setSize(w, h, false);
  }

  function backdrop(from: readonly number[], to: readonly number[] = from, blend = 0) {
    sky.uniforms.zenith.value.setHex(from[0]).lerp(lit.setHex(to[0]), blend);
    sky.uniforms.horizon.value.setHex(from[1]).lerp(lit.setHex(to[1]), blend);
    sky.uniforms.glow.value.setHex(from[2]).lerp(lit.setHex(to[2]), blend);
    sky.uniforms.strength.value = lerp(from[3], to[3], blend);
    fog.color.copy(sky.uniforms.zenith.value).lerp(sky.uniforms.horizon.value, .25);
  }

  function pose({ progress: p, display, overrideDisplay, press }: Frame) {
    audioSet.visible = p < wiredStart;
    phoneSet.visible = p >= wiredStart && p < .676;
    watch.group.visible = p >= .611;
    const chamber = smooth(.656, .704, p) * (1 - smooth(.833, .874, p));
    insideA.intensity = .98 * chamber;
    insideB.intensity = .88 * chamber;
    renderer.toneMappingExposure = 1.02;
    fog.density = lerp(.042, .10, chamber);
    key.intensity = 2.55 - chamber * 1.17;
    edge.intensity = 2.15 - chamber * 1.11;
    side.intensity = 1.78;
    fill.color.set(0xe0e8ee);
    let frameX = -.13;
    let frameY = compact ? .155 : .013;

    if (audioSet.visible) {
      const classify = smooth(.122, .155, p);
      const stage = smooth(.196, .227, p);
      const flight = smooth(.092, .137, p) * (1 - smooth(.212, .259, p));
      const opening = smooth(.062, .108, p) * (1 - smooth(.260, .279, p));
      const macro = classify * (1 - stage);
      locations.terrain.visible = classify < .97;
      locations.terrain.position.y = -classify * 9;
      locations.terrain.rotation.z = classify * .39;
      locations.gallery.visible = stage > .036;
      locations.gallery.position.y = (stage - 1) * 3.0;
      backdrop(beds.stone, beds.paper, classify);
      if (stage > 0) backdrop(beds.paper, beds.gallery, stage);
      fill.color.set(0xc0d7e8).lerp(lit.set(0xf7f1e9), classify);
      key.intensity = 2.35 + macro * .71;
      edge.intensity = 1.92 + stage * .65;
      buds.group.position.y = -.018 + flight * .126;
      buds.group.rotation.y = lerp(-.32, .28, smooth(.020, .124, p)) - stage * .52;
      buds.pose(opening, flight, macro, smooth(.142, .211, p));
      moveBuds(p, camera.position, target);
      frameX = lerp(-.132, -.008, macro);
    }

    if (phoneSet.visible) {
      collar.pose(smooth(.458, .483, p));
      collar.group.visible = p < .509;
      const lift = smooth(.507, .550, p);
      phone.pose(lift, Math.PI * lerp(.44, 1.60, smooth(.500, .609, p)), smooth(.541, .615, p));
      phoneShadow.material.opacity = .67 - lift * .28;
      if (p < watchEntry) {
        backdrop(beds.cable);
        moveNeckband(p, camera.position, target);
        frameX = lerp(-.115, -.042, smooth(.306, .334, p) * (1 - smooth(.398, .442, p)));
        frameX *= 1 - smooth(.596, watchEntry, p);
        frameY *= 1 - smooth(.596, watchEntry, p);
      }
    }

    if (watch.group.visible) {
      const close = smooth(.855, .899, p);
      const joined = smooth(.611, .659, p);
      const phase = p > .969 ? 2 : p > .940 ? 1 : 0;
      const autoPress = Math.max(pulse(p, .938, .012), pulse(p, .967, .010));
      const currentDisplay = overrideDisplay ? display : phase;
      if (currentDisplay !== activeDisplay) {
        watch.setDisplay(currentDisplay);
        activeDisplay = currentDisplay;
      }
      watch.pose(close, joined, Math.max(autoPress * .78, press));
      if (p >= watchEntry) {
        moveWatch(p, camera.position, target);
        camera.position.applyQuaternion(watchOrientation).add(watchAnchor);
        target.applyQuaternion(watchOrientation).add(watchAnchor);
        backdrop(beds.cable, beds.board, smooth(watchEntry, .698, p));
        if (p > .845) backdrop(beds.board, beds.gallery, smooth(.845, .909, p));
        frameX = 0;
        frameY = compact ? .172 * smooth(.856, .901, p) : .0;
      }
    }

    if (compact) {
      const portrait = 1 - T.MathUtils.clamp(width / height, .45, 1);
      const groupPortrait = smooth(.115, .143, p) * (1 - smooth(.156, .184, p));
      const distance = 1 + portrait * (p >= .609 && p < .870 ? 0 : 1.17 + groupPortrait * 1.13);
      camera.position.sub(target).multiplyScalar(distance).add(target);
    }
    camera.fov = 39 + chamber * (compact ? 24 : 19);
    camera.setViewOffset(width, height, compact ? 0 : width * frameX, height * frameY, width, height);
    camera.lookAt(target);
    sky.sky.position.copy(camera.position);
  }

  function render(frame: Frame) {
    pose(frame);
    renderer.render(scene, camera);
  }

  async function prepare(milestone: (message: string) => void) {
    const presets: [number, string][] = [
      [.104, 'Свет и материалы'], [.354, 'Наушники'], [.555, 'Телефон'], [.748, 'Плата и дисплей'],
    ];
    for (const [progress, label] of presets) {
      if (!preparing) return;
      milestone(label);
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      if (!preparing) return;
      pose({ progress, display: 0, overrideDisplay: true, press: 0 });
      await renderer.compileAsync(scene, camera);
      if (preparing) renderer.render(scene, camera);
    }
  }

  container.append(renderer.domElement);

  function dispose() {
    preparing = false;
    const textures = new Set<T.Texture>();
    const materials = new Set<T.Material>();
    const geometries = new Set<T.BufferGeometry>();
    scene.traverse(object => {
      if (!(object instanceof T.Mesh)) return;
      geometries.add(object.geometry);
      const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
      meshMaterials.forEach(material => materials.add(material));
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => {
      for (const key of ['map', 'roughnessMap', 'bumpMap']) {
        const texture = (material as unknown as Record<string, unknown>)[key];
        if (texture instanceof T.Texture) textures.add(texture);
      }
      material.dispose();
    });
    textures.forEach(texture => texture.dispose());
    environment.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }

  return { resize, render, prepare, dispose, canvas: renderer.domElement };
}

export function sceneVeil(progress: number) {
  return pulse(progress, wiredStart, .009);
}
