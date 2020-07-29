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
// TODO(annxingyuan): read version from tfjsWasm directly once
// https://github.com/tensorflow/tfjs/pull/2819 is merged.
import {version} from '@tensorflow/tfjs-backend-wasm/dist/version';

import {TRIANGULATION} from './triangulation';

tfjsWasm.setWasmPath(
    `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${
        version}/dist/tfjs-backend-wasm.wasm`);

function isMobile() {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isAndroid || isiOS;
}

function drawPath(ctx, points, closePath) {
  const region = new Path2D();
  region.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    region.lineTo(point[0], point[1]);
  }

  if (closePath) {
    region.closePath();
  }
  ctx.stroke(region);
}

let model, ctx, videoWidth, videoHeight, video, canvas,
    scatterGLHasInitialized = false, scatterGL;

const VIDEO_SIZE = 500;
const mobile = isMobile();
// Don't render the point cloud on mobile in order to maximize performance and
// to avoid crowding limited screen space.
const renderPointcloud = mobile === false;
const stats = new Stats();
const state = {
  backend: 'wasm',
  maxFaces: 1,
  triangulateMesh: true
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
    model = await facemesh.load({maxFaces: val});
  });

  gui.add(state, 'triangulateMesh');

  if (renderPointcloud) {
    gui.add(state, 'renderPointcloud').onChange(render => {
      document.querySelector('#scatter-gl-container').style.display =
          render ? 'inline-block' : 'none';
    });
  }
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
    if (renderPointcloud && state.renderPointcloud && scatterGL != null) {
      const pointsData = predictions.map(prediction => {
        let scaledMesh = prediction.scaledMesh;
        return scaledMesh.map(point => ([-point[0], -point[1], -point[2]]));
      });

      let flattenedPointsData = [];
      for (let i = 0; i < pointsData.length; i++) {
        flattenedPointsData = flattenedPointsData.concat(pointsData[i]);
      }
      
      for (let i=0;i<3;i++){
         if(i==0){console.log("centre x: "+flattenedPointsData[5][0]);console.log("left ear x: "+flattenedPointsData[161][0]);console.log("lefteye outer x: "+flattenedPointsData[246][0]);console.log("lefteye inner x: "+flattenedPointsData[189][0]);console.log("right ear x: "+flattenedPointsData[388][0]);console.log("righteye outer x: "+flattenedPointsData[466][0]);console.log("righteye inner x: "+flattenedPointsData[414][0]);}
         else if(i==1){console.log("centre y: "+flattenedPointsData[5][1]);console.log("left ear y: "+flattenedPointsData[161][1]);console.log("lefteye outer y: "+flattenedPointsData[246][1]);console.log("lefteye inner y: "+flattenedPointsData[189][1]);console.log("right ear y: "+flattenedPointsData[388][1]);console.log("righteye outer y: "+flattenedPointsData[466][1]);console.log("righteye inner y: "+flattenedPointsData[414][1]);}
         else{console.log("centre z: "+flattenedPointsData[5][2]);console.log("left ear z: "+flattenedPointsData[161][2]);console.log("lefteye outer z: "+flattenedPointsData[246][2]);console.log("lefteye inner z: "+flattenedPointsData[189][2]);console.log("right ear z: "+flattenedPointsData[388][2]);console.log("righteye outer z: "+flattenedPointsData[466][2]);console.log("righteye inner z: "+flattenedPointsData[414][2]);}
	
      }

//add points here..
var ab=[];
ab.push(flattenedPointsData[143]); //0 eye
ab.push(flattenedPointsData[113]); //1 eye
ab.push(flattenedPointsData[225]); //2 eye
ab.push(flattenedPointsData[224]);//3 eye
ab.push(flattenedPointsData[223]);//4 eye
ab.push(flattenedPointsData[222]);//5 eye
ab.push(flattenedPointsData[221]);//6 eye
ab.push(flattenedPointsData[193]);//7 eye
ab.push(flattenedPointsData[6]); //8 center
ab.push(flattenedPointsData[122]);//9 eye
ab.push(flattenedPointsData[188]);//10 eye
ab.push(flattenedPointsData[121]);//11 eye
ab.push(flattenedPointsData[120]);//12 eye
ab.push(flattenedPointsData[119]);//13 eye
ab.push(flattenedPointsData[118]);//14 eye
ab.push(flattenedPointsData[117]);//15 eye
ab.push(flattenedPointsData[137]);//16 earlobe
ab.push(flattenedPointsData[177]);//17 earlobe
ab.push(flattenedPointsData[366]);//18 earlobe
ab.push(flattenedPointsData[401]);//19 earlobe
ab.push(flattenedPointsData[152]);//neck

ctx.beginPath();
ctx.moveTo(-1*ab[0][0],-1*ab[0][1]);
ctx.bezierCurveTo(-1*ab[1][0],-1*ab[1][1],-1*ab[2][0],-1*ab[2][1],-1*ab[3][0],-1*ab[3][1],-1*ab[4][0],-1*ab[4][1],-1*ab[5][0],-1*ab[5][1],-1*ab[6][0],-1*ab[6][1],-1*ab[7][0],-1*ab[7][1],-1*ab[8][0],-1*ab[8][1],-1*ab[9][0],-1*ab[9][1],-1*ab[10][0],-1*ab[10][1],-1*ab[11][0],-1*ab[11][1],-1*ab[12][0],-1*ab[12][1],-1*ab[13][0],-1*ab[13][1],-1*ab[14][0],-1*ab[14][1],-1*ab[15][0],-1*ab[15][1]);
ctx.lineTo(-1*ab[15][0],-1*ab[15][1]);
ctx.lineTo(-1*ab[12][0],-1*ab[12][1]);
ctx.lineTo(-1*ab[11][0],-1*ab[11][1]);
ctx.lineTo(-1*ab[10][0],-1*ab[10][1]);
ctx.lineTo(-1*ab[9][0],-1*ab[9][1]);
ctx.lineTo(-1*ab[8][0],-1*ab[8][1]);
ctx.lineTo(-1*ab[7][0],-1*ab[7][1]);
ctx.lineTo(-1*ab[6][0],-1*ab[6][1]);
ctx.lineTo(-1*ab[5][0],-1*ab[5][1]);
ctx.lineTo(-1*ab[4][0],-1*ab[4][1]);
ctx.lineTo(-1*ab[3][0],-1*ab[3][1]);
ctx.lineTo(-1*ab[2][0],-1*ab[2][1]);
ctx.lineTo(-1*ab[1][0],-1*ab[1][1]);
ctx.closePath();
ctx.fill();
ctx.stroke();

//var radius1=(1*(ab[16][1]-ab[17][1]))/2;
//console.log(radius1);
//ctx.beginPath();
//ctx.arc(-1*ab[16][0],-1*ab[16][1],-1*ab[17][0],-1*ab[17][1],radius1);
//ctx.fill();
//ctx.stroke();



//ear-offset
ctx.beginPath();
ctx.moveTo(-1*ab[16][0]-10,-1*ab[16][1]-10);
ctx.lineTo(-1*ab[17][0]-10,-1*ab[17][1]-10);
ctx.stroke();

//ear-offset
ctx.beginPath();
ctx.linewidth=10;
ctx.moveTo(-1*ab[18][0]+10,-1*ab[18][1]+10);
ctx.lineTo(-1*ab[19][0]+10,-1*ab[19][1]+10);
ctx.stroke();

ctx.beginPath();
ctx.moveTo(-1*ab[20][0],-1*ab[20][1]);
ctx.lineTo(-1*ab[20][0],-1*ab[20][1]+40);
ctx.stroke();

//triangle code:

ctx.beginPath();
ctx.moveTo(-1*(ab[18][0]+ab[19][0]-20)/2,-1*(ab[18][1]+ab[19][1]-20)/2);
ctx.lineTo(-1*(ab[16][0]+ab[17][0]+20)/2,-1*(ab[16][1]+ab[17][1]+20)/2);
ctx.lineTo(-1*ab[20][0],-1*ab[20][1]+40);
ctx.closePath();
ctx.stroke();

console.log("upper: left earlobe: "+ab[16][0]+","+ab[16][1]);
console.log("lower: left earlobe: "+ab[17][0]+","+ab[17][1]);
console.log("upper: right earlobe: "+ab[18][0]+","+ab[18][1]);
console.log("lower: right earlobe: "+ab[19][0]+","+ab[19][1]);

var xy=[];
xy.push(flattenedPointsData[372]);
xy.push(flattenedPointsData[342]);
xy.push(flattenedPointsData[445]);
xy.push(flattenedPointsData[444]);
xy.push(flattenedPointsData[443]);
xy.push(flattenedPointsData[442]);
xy.push(flattenedPointsData[441]);
xy.push(flattenedPointsData[417]);
xy.push(flattenedPointsData[6]);
xy.push(flattenedPointsData[351]);
xy.push(flattenedPointsData[412]);
xy.push(flattenedPointsData[350]);
xy.push(flattenedPointsData[349]);
xy.push(flattenedPointsData[348]);
xy.push(flattenedPointsData[347]);
xy.push(flattenedPointsData[346]);

ctx.beginPath();
ctx.moveTo(-1*xy[0][0],-1*xy[0][1]);
ctx.bezierCurveTo(-1*xy[1][0],-1*xy[1][1],-1*xy[2][0],-1*xy[2][1],-1*xy[3][0],-1*xy[3][1],-1*xy[4][0],-1*xy[4][1],-1*xy[5][0],-1*xy[5][1],-1*xy[6][0],-1*xy[6][1],-1*xy[7][0],-1*xy[7][1],-1*xy[8][0],-1*xy[8][1],-1*xy[9][0],-1*xy[9][1],-1*xy[10][0],-1*xy[10][1],-1*xy[11][0],-1*xy[11][1],-1*xy[12][0],-1*xy[12][1],-1*xy[13][0],-1*xy[13][1],-1*xy[14][0],-1*xy[14][1],-1*xy[15][0],-1*xy[15][1]);
ctx.lineTo(-1*xy[15][0],-1*xy[15][1]);
ctx.lineTo(-1*xy[12][0],-1*xy[12][1]);
ctx.lineTo(-1*xy[11][0],-1*xy[11][1]);
ctx.lineTo(-1*xy[10][0],-1*xy[10][1]);
ctx.lineTo(-1*xy[9][0],-1*xy[9][1]);
ctx.lineTo(-1*xy[8][0],-1*xy[8][1]);
ctx.lineTo(-1*xy[7][0],-1*xy[7][1]);
ctx.lineTo(-1*xy[6][0],-1*xy[6][1]);
ctx.lineTo(-1*xy[5][0],-1*xy[5][1]);
ctx.lineTo(-1*xy[4][0],-1*xy[4][1]);
ctx.lineTo(-1*xy[3][0],-1*xy[3][1]);
ctx.lineTo(-1*xy[2][0],-1*xy[2][1]);
ctx.lineTo(-1*xy[1][0],-1*xy[1][1]);
ctx.closePath();
ctx.fill();
ctx.stroke();

const loader = new THREE.BufferGeometryLoader()
loader.load('D:\tcs innovation\Glass Crayon\glasses.json',function(geometry, materials){});

      const dataset = new ScatterGL.Dataset(flattenedPointsData);

      if (!scatterGLHasInitialized) {
        scatterGL.render(dataset);
      } else {
        scatterGL.updateDataset(dataset);
      }
      scatterGLHasInitialized = true;
    }
  }

  stats.end();
  requestAnimationFrame(renderPrediction);
};

async function main() {
  await tf.setBackend(state.backend);
  setupDatGui();

  stats.showPanel(0);  // 0: fps, 1: ms, 2: mb, 3+: custom
  document.getElementById('main').appendChild(stats.dom);

  await setupCamera();
  video.play();
  videoWidth = video.videoWidth;
  videoHeight = video.videoHeight;
  video.width = videoWidth;
  video.height = videoHeight;

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
  



  model = await facemesh.load({maxFaces: state.maxFaces});
  renderPrediction();

  if (renderPointcloud) {
    document.querySelector('#scatter-gl-container').style =
        `width: ${VIDEO_SIZE}px; height: ${VIDEO_SIZE}px;`;

    scatterGL = new ScatterGL(
        document.querySelector('#scatter-gl-container'),
        {'rotateOnStart': false, 'selectEnabled': false});
  }
};

main();
