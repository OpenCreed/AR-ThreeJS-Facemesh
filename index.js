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

function isMobile() {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isAndroid || isiOS;
}

let model, ctx, videoWidth, videoHeight, video, canvas, scene, camera, renderer;

const VIDEO_SIZE = 500;
const mobile = isMobile();
// Don't render the point cloud on mobile in order to maximize performance and
// to avoid crowding limited screen space.
const renderPointcloud = mobile === false;
const stats = new Stats();
const state = {
  backend: 'wasm',
  maxFaces: 1,
  triangulateMesh: false
};

if (renderPointcloud) {
  state.renderPointcloud = true;
}

function setupDatGui() {
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
    'video': {
      facingMode: 'user',
      // Only setting the video to a specified size in order to accommodate a
      // point cloud, so on mobile devices accept the default size.
      width: mobile ? undefined : VIDEO_SIZE,
      height: mobile ? undefined : VIDEO_SIZE
    },
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
  ctx.drawImage(
    video, 0, 0, videoWidth, videoHeight, 0, 0, canvas.width, canvas.height);
  if (predictions.length > 0) {
    predictions.forEach(prediction => {
      const keypoints = prediction.scaledMesh;
    });
    if (renderPointcloud && state.renderPointcloud) {
      const pointsData = predictions.map(prediction => {
        let scaledMesh = prediction.scaledMesh;
        return scaledMesh.map(point => ([-point[0], -point[1], -point[2]]));
      });

      let flattenedPointsData = [];
      for (let i = 0; i < pointsData.length; i++) {
        flattenedPointsData = flattenedPointsData.concat(pointsData[i]);
      }
/*
       for (let i = 0; i < 3; i++) {
        if (i == 0) { console.log("centre x: " + flattenedPointsData[5][0]); console.log("left ear x: " + flattenedPointsData[161][0]); console.log("lefteye outer x: " + flattenedPointsData[246][0]); console.log("lefteye inner x: " + flattenedPointsData[189][0]); console.log("right ear x: " + flattenedPointsData[388][0]); console.log("righteye outer x: " + flattenedPointsData[466][0]); console.log("righteye inner x: " + flattenedPointsData[414][0]); }
        else if (i == 1) { console.log("centre y: " + flattenedPointsData[5][1]); console.log("left ear y: " + flattenedPointsData[161][1]); console.log("lefteye outer y: " + flattenedPointsData[246][1]); console.log("lefteye inner y: " + flattenedPointsData[189][1]); console.log("right ear y: " + flattenedPointsData[388][1]); console.log("righteye outer y: " + flattenedPointsData[466][1]); console.log("righteye inner y: " + flattenedPointsData[414][1]); }
        else { console.log("centre z: " + flattenedPointsData[5][2]); console.log("left ear z: " + flattenedPointsData[161][2]); console.log("lefteye outer z: " + flattenedPointsData[246][2]); console.log("lefteye inner z: " + flattenedPointsData[189][2]); console.log("right ear z: " + flattenedPointsData[388][2]); console.log("righteye outer z: " + flattenedPointsData[466][2]); console.log("righteye inner z: " + flattenedPointsData[414][2]); }
      }
*/
      //add points here..
      //console.log("Nose tip: ", flattenedPointsData[1][1] + 480/2)
      scene.children[6].position.x = (flattenedPointsData[1][0] + 640/2)/75;
      scene.children[6].position.y = (flattenedPointsData[1][1] + 480/2)/30;
      //scene.children[6].position.y = flattenedPointsData[161][1];
      //scene.children[6].position.z = flattenedPointsData[168][2]/10 - 20;
    }
  }

  stats.end();
  renderer.render(scene, camera);
  requestAnimationFrame(renderPrediction);

};

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

  initThreeJS();

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

function initThreeJS() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera();
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 20;
  var hlight = new THREE.AmbientLight(0x404040, 100);
  scene.add(hlight);
  var directionalLight = new THREE.DirectionalLight(0xffffff, 100);
  directionalLight.position.set(0, 0, 1);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  var light1 = new THREE.PointLight(0xc4c4c4, 10);
  light1.position.set(0, 300, 500);
  scene.add(light1);
  var light2 = new THREE.PointLight(0xc4c4c4, 10);
  light2.position.set(500, 100, 0);
  scene.add(light2);
  var light3 = new THREE.PointLight(0xc4c4c4, 10);
  light3.position.set(0, 100, -500);
  scene.add(light3);
  var light4 = new THREE.PointLight(0xc4c4c4, 10);
  light4.position.set(-500, 300, 500);
  scene.add(light4);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("threejs-container").appendChild(renderer.domElement);
  let loader = new GLTFLoader();
  loader.load("leftear.glb", gltf => {
    let model = gltf.scene.children[2];
    model.scale.set(0.6,0.6,0.6);
    model.name = "leftear";
    scene.add(model);
    console.log(scene.children[6])
  })
}

main();