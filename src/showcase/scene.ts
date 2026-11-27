import * as T from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { vector } from './geometry';
import { createBudsLocations, createStudio } from './locations';
import { createBuds, createCable, createPhone, createWatch, phonePort, phonePosition } from './models';
import { chapters } from './chapters';

const smooth = (start: number, end: number, progress: number) => T.MathUtils.smoothstep(progress, start, end);
const lerp = T.MathUtils.lerp;
const galleryFill = new T.Color(0xffb591);
const galleryFog = new T.Color(0x491e16);
const fade = (progress: number, at: number) => 1 - smooth(0, .017, Math.abs(progress - at));
const cameraKeyframes = {
  buds: [
    [0, [4.75, 2.56, 6.30], [0, -.05, 0]],
    [.062, [2.42, 1.68, 4.73], [0, .07, 0]],
    [.115, [.68, 2.07, 4.72], [0, .40, -.33]],
    [.180, [-1.96, 2.55, 5.47], [0, .65, -.23]],
    [.255, [-2.45, 2.01, 4.15], [0, .89, -.42]],
  ],
  phone: [
    [.37, [3.34, 1.45, 3.62], [2.25, .44, 1.52]],
    [.415, [3.42, 1.20, 2.86], [phonePort.x - .13, .40, phonePort.z + .31]],
    [.459, [3.93, 1.81, 2.81], [phonePort.x, .48, phonePort.z - .05]],
    [.508, [4.43, 4.25, 3.33], [phonePosition.x, .43, phonePosition.z + .41]],
    [.564, [5.77, 3.13, 3.42], [phonePosition.x, .59, phonePosition.z]],
    [.632, [5.08, 2.69, 7.00], [phonePosition.x, .58, phonePosition.z]],
  ],
  watch: [
    [.598, [0, .83, 7.72], [0, .06, 0]],
    [.632, [0, 1.0, 5.80], [0, .06, 0]],
    [.674, [-.56, .72, 3.30], [-.17, .17, .07]],
    [.723, [-.35, .75, 2.66], [-.23, .29, .09]],
    [.774, [1.32, .25, 2.98], [.38, -.24, .10]],
    [.815, [2.44, 1.38, 6.73], [0, .09, 0]],
    [.890, [2.22, 1.18, 7.25], [0, .03, -.09]],
    [.935, [1.95, .71, 6.97], [0, 0, -.19]],
    [1, [1.06, .71, 7.54], [0, .10, -.22]],
  ],
} satisfies Record<string, Keyframe[]>;

type Coordinates = [number, number, number];
type Keyframe = [number, Coordinates, Coordinates];
type Frame = { progress: number; display: number; overrideDisplay: boolean; press: number };

export function createScene(container: HTMLElement) {
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.03;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new T.Scene();
  scene.fog = new T.FogExp2(0x292024, .037);
  const camera = new T.PerspectiveCamera(39, 1, .07, 90);

  const room = new RoomEnvironment();
  const pmrem = new T.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, .05);
  scene.environment = environment.texture;
  scene.environmentIntensity = .75;
  room.dispose();
  pmrem.dispose();

  const fill = new T.HemisphereLight(0xcde3fc, 0x723621, 1.20);
  const key = new T.DirectionalLight(0xffebdf, 2.50);
  key.position.set(-2.3, 5.7, 3.1);
  const edge = new T.DirectionalLight(0xff6b36, 2.40);
  edge.position.set(3.5, 3.4, -4.6);
  const side = new T.DirectionalLight(0xb9c9ed, 1.40);
  side.position.set(-4.5, 1.5, -1.8);
  scene.add(fill, key, edge, side);

  const buds = createBuds();
  const locations = createBudsLocations();
  const cable = createCable();
  const phone = createPhone();
  const { studio, phoneShadow } = createStudio();
  const watch = createWatch();

  const audioSet = new T.Group();
  audioSet.add(locations.terrain, locations.gallery, buds.group);
  const phoneSet = new T.Group();
  phoneSet.add(studio, cable.group, phone);
  scene.add(audioSet, phoneSet, watch.group);

  let compact = false;
  let portraitScale = 1;
  let activeDisplay = -1;
  const target = vector(0, 0, 0);
  const nextPosition = vector(0, 0, 0);
  const nextTarget = vector(0, 0, 0);
  const pathPoint = vector(0, 0, 0);
  const tangent = vector(0, 0, 0);
  const right = vector(0, 0, 0);

  function resize(width: number, height: number) {
    compact = width < 760;
    portraitScale = T.MathUtils.clamp(width / height, .45, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.35 : 1.65));
    renderer.setSize(width, height, false);
    const shiftX = compact ? 0 : -.139 * width;
    const shiftY = compact ? .185 * height : .028 * height;
    camera.setViewOffset(width, height, shiftX, shiftY, width, height);
  }

  function shot(progress: number, frames: Keyframe[], blend = 1) {
    const next = frames.findIndex(([step]) => step >= progress);
    const i = next < 0 ? frames.length - 1 : Math.max(1, next);
    const [start, position, focus] = frames[i - 1];
    const [end, endPosition, endFocus] = frames[i];
    const time = smooth(start, end, progress);
    nextPosition.set(...position).lerp(pathPoint.set(...endPosition), time);
    nextTarget.set(...focus).lerp(pathPoint.set(...endFocus), time);
    camera.position.lerp(nextPosition, blend);
    target.lerp(nextTarget, blend);
  }

  function render({ progress, display, overrideDisplay, press }: Frame) {
    const caseEnd = chapters[1].start;
    audioSet.visible = progress < caseEnd;
    const watchEntrance = .604;
    phoneSet.visible = progress >= caseEnd && progress < watchEntrance;
    watch.group.visible = progress >= watchEntrance;

    if (audioSet.visible) {
      const open = smooth(.053, .135, progress);
      const rise = smooth(.106, .229, progress);
      const gallery = smooth(.104, .185, progress);
      locations.terrain.position.y = -gallery * 5.80;
      locations.gallery.position.y = (gallery - 1) * 3.60;
      locations.terrain.visible = gallery < .97;
      locations.gallery.visible = gallery > .02;
      buds.group.position.y = open * .085;
      buds.group.rotation.y = lerp(-.11, .17, rise);
      buds.pose(open, rise, smooth(.09, caseEnd, progress));
      fill.color.set(0xd9edff).lerp(galleryFill, gallery);
      scene.fog!.color.set(0x382532).lerp(galleryFog, gallery);
      shot(progress, cameraKeyframes.buds);
    }

    if (phoneSet.visible) {
      const cameraTrack = smooth(.262, .398, progress);
      cable.path.getPointAt(cameraTrack, pathPoint);
      cable.path.getTangentAt(cameraTrack, tangent);
      right.set(-tangent.z, 0, tangent.x).normalize();
      target.copy(pathPoint);
      target.x -= .30 * (1 - cameraTrack);
      target.y += .13;
      target.z += .66 * (1 - cameraTrack);
      camera.position.copy(target).addScaledVector(right, 2.12 + cameraTrack * .65);
      camera.position.addScaledVector(tangent, -2.05 + cameraTrack * 1.2);
      camera.position.y += 1.03 + cameraTrack * .57;
      shot(progress, cameraKeyframes.phone, smooth(.348, .412, progress));
      cable.pose(smooth(.398, .456, progress));
      const swivel = smooth(.495, .558, progress);
      const viewFront = smooth(.544, .615, progress);
      phone.position.y = phonePosition.y + swivel * .48;
      phone.rotation.set(-Math.PI / 2 + swivel * 1.28, swivel * 2.35 + viewFront * 3.75, -.04 * swivel);
      cable.group.visible = progress < .494;
      phoneShadow.material.opacity = .72 - .46 * swivel;
      fill.color.set(0xbdcce1);
      scene.fog!.color.set(0x211d22);
    }

    if (watch.group.visible) {
      const close = smooth(.767, .849, progress);
      const entry = smooth(.640, .701, progress);
      const phase = progress > .948 ? 2 : progress > .889 ? 1 : 0;
      const autoPress = Math.max(fade(progress, .886), fade(progress, .945)) * close;
      const currentDisplay = overrideDisplay ? display : phase;
      if (currentDisplay !== activeDisplay) {
        watch.setDisplay(currentDisplay);
        activeDisplay = currentDisplay;
      }
      // The camera keeps pulling back as the phone's silhouette becomes the opening in the watch.
      watch.pose(close, entry, Math.max(autoPress * .72, press));
      watch.group.rotation.set(close * .14 - .06, -close * .17 + smooth(.693, .768, progress) * .16, close * -.22);
      fill.color.set(0xe7e7fd);
      scene.fog!.color.set(0x352124);
      shot(progress, cameraKeyframes.watch);
    }

    if (compact) {
      const distance = 1 + (1 - portraitScale) * (watch.group.visible && progress < .81 ? 1.18 : 1.42);
      camera.position.sub(target).multiplyScalar(distance).add(target);
    }
    camera.lookAt(target);
    renderer.render(scene, camera);
  }

  container.append(renderer.domElement);

  function dispose() {
    const textures = new Set<T.Texture>();
    const materials = new Set<T.Material>();
    scene.traverse(object => {
      if (!(object instanceof T.Mesh)) return;
      object.geometry.dispose();
      const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
      meshMaterials.forEach(material => materials.add(material));
    });
    materials.forEach(material => {
      if ('map' in material && material.map instanceof T.Texture) textures.add(material.map);
      material.dispose();
    });
    textures.forEach(texture => texture.dispose());
    environment.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }

  return { resize, render, dispose, canvas: renderer.domElement };
}

export function sceneVeil(progress: number) {
  const secondCut = 1 - smooth(0, .010, Math.abs(progress - .604));
  return Math.max(fade(progress, chapters[1].start), secondCut * .83);
}
