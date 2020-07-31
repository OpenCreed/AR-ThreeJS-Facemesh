/**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import * as facemesh from '@tensorflow-models/facemesh';
import Stats from 'stats.js';
import * as tf from '@tensorflow/tfjs-core';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';
import dat from 'dat-gui';
// TODO(annxingyuan): read version from tfjsWasm directly once
// https://github.com/tensorflow/tfjs/pull/2819 is merged.
import { version } from '@tensorflow/tfjs-backend-wasm/dist/version';

tfjsWasm.setWasmPath(
  `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${
  version}/dist/tfjs-backend-wasm.wasm`);

let model, ctx, videoWidth, videoHeight, video, canvas, scene, camera, renderer;

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

async function setupCamera() {
  video = document.getElementById('video');

  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {facingMode: 'user'}
  });
  video.srcObject = stream;

  return new Promise((resolve) => {
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
      let scaledMesh = prediction.scaledMesh;
      return scaledMesh.map(point => ([-point[0], -point[1], -point[2]]));
    });

    let flattenedPointsData = [];
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
  document.getElementById("threejs-container").appendChild(renderer.domElement);
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

  canvas = document.getElementById('output');
  canvas.width = videoWidth;
  canvas.height = videoHeight;
  const canvasContainer = document.querySelector('.canvas-wrapper');
  canvasContainer.style = `width: ${videoWidth}px; height: ${videoHeight}px`;

  ctx = canvas.getContext('2d');
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.fillStyle = '#32EEDB';
  ctx.strokeStyle = '#32EEDB';
  ctx.lineWidth = 0.5;

  model = await facemesh.load({ maxFaces: state.maxFaces });
  renderPrediction();
};

main();