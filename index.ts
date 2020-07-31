import facemesh from '@tensorflow-models/facemesh';
import Stats from 'stats.js';
import tf from '@tensorflow/tfjs-core';
import tfjsWasm from '@tensorflow/tfjs-backend-wasm';
import THREE from 'three';
import GLTFLoader from 'three-gltf-loader';
import dat from 'dat.gui';
import { version } from '@tensorflow/tfjs-backend-wasm/dist/version';

tfjsWasm.setWasmPath(
  `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${
  version}/dist/tfjs-backend-wasm.wasm`);

let model: facemesh.FaceMesh;
let ctx: CanvasRenderingContext2D;
let videoWidth: number, videoHeight: number;
let video: HTMLVideoElement;
let canvas: HTMLCanvasElement;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;

const stats = new Stats();
const state = {
  backend: 'wasm',
  maxFaces: 1,
  triangulateMesh: false
};

async function setupDatGui() {
  const gui = new dat.GUI();
  gui.add(state, 'backend', ['wasm', 'webgl', 'cpu'])
    .onChange(async backend => {
      await tf.setBackend(backend);
    });

  gui.add(state, 'maxFaces', 1, 20, 1).onChange(async val => {
    model = await facemesh.load({ maxFaces: val });
  });

  gui.add(state, 'triangulateMesh');
}

async function setupCamera(): Promise<HTMLVideoElement> {
  video = <HTMLVideoElement>document.getElementById('video');

  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {facingMode: 'user'}
  });
  video.srcObject = stream;

  return new Promise<HTMLVideoElement>((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

async function renderPrediction() {
  stats.begin();
  const predictions = await model.estimateFaces(video);
  ctx.drawImage(video, 0, 0, videoWidth, videoHeight, 0, 0, canvas.width, canvas.height);
  if (predictions.length > 0) {
    const pointsData = predictions.map(prediction => {
      let scaledMesh = <[number, number, number][]>prediction.scaledMesh;
      return scaledMesh.map(point => ([-point[0], -point[1], -point[2]]));
    });

    let flattenedPointsData: number[][] = [];
    for (let i = 0; i < pointsData.length; i++) {
      flattenedPointsData = flattenedPointsData.concat(pointsData[i]);
    }

    //add points here..
    scene.children[5].position.x = (flattenedPointsData[1][0] + 640 / 2) / 75;
    scene.children[5].position.y = (flattenedPointsData[1][1] + 480 / 2) / 30;
  }

  renderer.render(scene, camera);
  stats.end();
  requestAnimationFrame(renderPrediction);
};

async function initThreeJS() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera();
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 20;
  var ambientLight = new THREE.AmbientLight(0x404040, 100);
  scene.add(ambientLight);
  var light1 = new THREE.PointLight(0xc4c4c4, 10);
  light1.position.set(100, 100, 20);
  scene.add(light1);
  var light2 = new THREE.PointLight(0xc4c4c4, 10);
  light2.position.set(100, -100, 20);
  scene.add(light2);
  var light3 = new THREE.PointLight(0xc4c4c4, 10);
  light3.position.set(-100, 100, 20);
  scene.add(light3);
  var light4 = new THREE.PointLight(0xc4c4c4, 10);
  light4.position.set(-100, -100, 20);
  scene.add(light4);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  let threeJSContatiner = <HTMLDivElement>document.getElementById("threejs-container")
  threeJSContatiner.appendChild(renderer.domElement);
  let gltf = await new GLTFLoader().loadAsync("leftear.glb");
  let model = gltf.scene.children[2];
  model.scale.set(0.6, 0.6, 0.6);
  model.name = "leftear";
  scene.add(model);
}

async function main() {
  await tf.setBackend(state.backend);
  setupDatGui();

  stats.showPanel(0);  // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);

  await setupCamera();
  video.play();
  videoWidth = video.videoWidth;
  videoHeight = video.videoHeight;
  video.width = videoWidth;
  video.height = videoHeight;

  await initThreeJS();

  canvas = <HTMLCanvasElement>document.getElementById('output');
  canvas.width = videoWidth;
  canvas.height = videoHeight;
  const canvasContainer = <HTMLElement>document.getElementsByClassName('canvas-wrapper')[0];
  canvasContainer.style.width = `${videoWidth}px`; 
  canvasContainer.style.height = `${videoHeight}px`;

  ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.fillStyle = '#32EEDB';
  ctx.strokeStyle = '#32EEDB';
  ctx.lineWidth = 0.5;

  model = await facemesh.load({ maxFaces: state.maxFaces });
  renderPrediction();
};

main();