<!-- App.vue - hanoisimulator app -->
<template>
	<div v-cloak>
		<section class="hero">
			<div class="hero-body">
				<div class="select is-small is-pulled-right">
					<select id="selectLocale" v-model="selectedLocale" @change="switchLocale">
						<option disabled value="">Language</option>
						<option value="en">English</option>
						<option value="ja">Japanese / 日本語</option>
					</select>
				</div>
				<h1 class="title">
				{{ $t("message.hanoisimulatortitle") }}
				</h1>
				<p class="subtitle">
					{{ $t("message.hanoisimulatordesc") }}
				</p>
			</div>
		</section>
		<section class="section">
			<div class="field is-grouped">
				<div class="control">
					<button v-bind:disabled="currentMotionStep==0" class="button is-primary" @click="restore"><i class="fas fa-step-backward"></i>{{ $t("message.reset") }}</button>
				</div>
				<div class="control" v-if="!errorOccured && !playMode">
					<button v-bind:disabled="finished" class="button is-primary" @click="play"><i class="fas fa-play"></i>{{ $t("message.play") }}</button>
				</div>
				<div class="control" v-if="!errorOccured && playMode">
					<button class="button is-primary" @click="pause"><i class="fas fa-pause"></i>{{ $t("message.pause") }}</button>
				</div>
				<div class="control" v-if="errorOccured && !playMode">
					<button v-bind:disabled="finished" class="button is-danger" @click="moveIfError"><i class="fas fa-play"></i>{{ $t("message.moveIfError") }}</button>
				</div>
				<div class="control" v-if="errorOccured && playMode">
					<button class="button is-danger" @click="pause"><i class="fas fa-pause"></i>{{ $t("message.pause") }}</button>
				</div>
				<div class="control">
					<button v-bind:disabled="playMode" class="button is-primary" @click="takeScreenShot"><i class="fas fa-camera"></i>{{ $t("message.screenshot") }}</button>
				</div>
				<div class="control">
					{{ $t("message.step") }} {{ currentMotionStep }} / {{ numTotalSteps }}
				</div>
			</div>
			<div class="container" id="canvas" @click="canvasClicked"></div>
		</section>
		<section class="section">
		<div class="container">
			<div class="box" id="controllerBox">
				<h2 class="subtitle">
				{{ $t("message.controller") }}
				</h2>
				<div class="columns">
					<div class="column">
						<label class="label">{{ $t("message.motioncommands") }}</label>
						<div class="control has-icons-right">
							<textarea class="textarea" id="motionCommands" v-model="motionCommands" @input="commandChanged"></textarea>
						</div>		
					</div>
					<div class="column">
						<div class="control">
							{{ $t("message.step") }} {{ currentMotionStep }} / {{ numTotalSteps }}
						</div>
						<div class="field is-grouped">
							<div class="control">
								<button v-bind:disabled="currentMotionStep==0" class="button is-primary" @click="restore"><i class="fas fa-step-backward"></i>{{ $t("message.reset") }}</button>
							</div>
							<div class="control" v-if="!errorOccured && !playMode">
								<button v-bind:disabled="finished" class="button is-primary" @click="play"><i class="fas fa-play"></i>{{ $t("message.play") }}</button>
							</div>
							<div class="control" v-if="!errorOccured && playMode">
								<button class="button is-primary" @click="pause"><i class="fas fa-pause"></i>{{ $t("message.pause") }}</button>
							</div>
							<div class="control" v-if="errorOccured && !playMode">
								<button v-bind:disabled="finished" class="button is-danger" @click="moveIfError"><i class="fas fa-play"></i>{{ $t("message.moveIfError") }}</button>
							</div>
							<div class="control" v-if="errorOccured && playMode">
								<button class="button is-danger" @click="pause"><i class="fas fa-pause"></i>{{ $t("message.pause") }}</button>
							</div>
							<div class="control">
								<button v-bind:disabled="playMode" class="button is-primary" @click="takeScreenShot"><i class="fas fa-camera"></i>{{ $t("message.screenshot") }}</button>
							</div>
						</div>		
						<div class="notification is-danger" v-if="errorOccured">{{ errorMessage }}</div>
					</div>
				</div>
			</div>
		</div>
		</section>
	</div>
	<section class="section">
		<ul>
		<li><a href="./about.html">About / How to use</a></li>
		<li><a href="./for-instructors.html">For instructors</a></li>
		<li>Source: <a href="https://github.com/akonno/hanoisimulator" target="_blank" rel="noopener noreferrer">Hanoi Simulator</a> on <a href="https://github.com/" target="_blank" rel="noopener noreferrer">GitHub</a></li>
		<li>Textures for the floor, discs and pillars by <a href="https://ambientcg.com/" target="_blank" rel="noopener noreferrer">Lennart Demes at ambientCG</a></li>
		</ul>
	</section>
	<footer class="footer">
		<div class="content has-text-centered">
			<p>
			<a href="https://github.com/akonno/hanoisimulator" target="_blank" rel="noopener noreferrer"><strong>Hanoi Simulator</strong></a> by KONNO Akihisa
			</p>
		</div>
	</footer>
</template>

<style scoped>
	body { margin: 0; }
	[v-cloak] {
		display: none;
	}
</style>

<script setup lang="ts">
// 3D animation of the towers of Hanoi
// Copyright (C) 2024-2025 KONNO Akihisa <konno@researchers.jp>

/*
MIT License

Copyright (c) 2024-2025 KONNO Akihisa <konno@researchers.jp>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import * as THREE from 'three';
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

// Vue I18n
const messages = {
    en: {
        message: {
            hanoisimulatortitle: 'The Tower of Hanoi Simulator',
            hanoisimulatordesc: 'Here is the Hanoi Tower Simulator (Web version). Instructions are at the bottom of the page.',
            controller: 'Controller',
            motioncommands: 'Motion commands',
            reset: 'Reset',
            play: 'Run simulation',
            pause: 'Pause',
            moveIfError: 'Move until error',
            step: 'Step',
            screenshot: 'Take screenshot'
        },
    },
    ja: {
        message: {
            hanoisimulatortitle: 'ハノイの塔シミュレータ',
            hanoisimulatordesc: 'ハノイの塔シミュレータ（Web版）です．使い方は画面の下部にあります．',
            controller: 'シミュレータ制御',
            motioncommands: '動作指示',
            reset: '最初に戻る',
            play: '実行',
            pause: '一時停止',
            moveIfError: 'エラーの場所まで実行',
            step: 'ステップ',
            screenshot: '画像を保存'
        },
    }
};

const { locale } = useI18n();

// setup Vue app
const playMode = ref(false);
const compiled = ref(false);
const errorOccured = ref(false);
const errorMessage = ref("");
const currentMotionStep = ref(0);
const numTotalSteps = ref(0);
const finished = ref(false);
const motionCommands = ref("A,B\nA,C\nB,C\nA,B\nC,A\nC,B\nA,B");
const selectedLocale = ref('');

function play()
{
	if (!compiled.value) {
		compiled.value = compile(motionCommands.value);
	}
	if (!compiled.value) {
		errorOccured.value = true;
		playMode.value = false;
	} else {
		errorOccured.value = false;
		playMode.value = true;
		// console.time('Execution Time');
	}
}

function pause()
{
	playMode.value = false;
}

function restore()
{
	playMode.value = false;
	// Restore all the discs to the initial positions.
	for (let i = 0; i < numDiscs; ++i) {
		discs[i].position.x = -pillarDistance;
		discs[i].position.y = -0.5*pillarHeight + discThickness*(numDiscs - i - 1 + 0.5);
	}
	step = 0;
	currentMotionStep.value = 0;
	finished.value = false;
}

function moveIfError()
{
	if (errorOccured.value == false) {
		// Called with no error; program bug?
		console.error('error: moveIfError called with errorOccured == false');
		return;
	}
	playMode.value = true;
}

function commandChanged()
{
	restore();
	compiled.value = errorOccured.value = false;
	currentMotionStep.value = numTotalSteps.value = 0;
	finished.value = false;
}

function canvasClicked()
{
	if (playMode.value === true) {
		// pause
		playMode.value = false;
	} else if (errorOccured.value == false) {
		play();
	} else if (!finished.value) {
		// error occured but can run.
		playMode.value = true;
	}
}

function takeScreenShot()
{
	// https://jsfiddle.net/n853mhwo/
	var a = document.createElement('a');
	// Without 'preserveDrawingBuffer' set to true, we must render now
	renderer.render(scene, camera);
	a.href = renderer.domElement.toDataURL().replace("image/png", "image/octet-stream");
	a.download = 'screenshot.png';
	a.click();
}

function switchLocale()
{
	locale.value = selectedLocale.value;
	console.log('locale is changed to ', locale.value);
}

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

onMounted(() => {
	const canvas = document.getElementById("canvas")!;
	const width = canvas.scrollWidth;
	renderer.setSize(width, width / 16 * 9);
	canvas.appendChild(renderer.domElement);
	
	onResize();
	window.addEventListener('resize', onResize);
	
	// Start visualization
	// This should be after initializing app, because animate() uses app.playMode.
	if (isWebGLAvailable()) {
		animate();
	} else {
		errorMessage.value =  "WebGL is not available in this browser/environment.";
		errorOccured.value = true;
	}
});

// The tower of Hanoi visualization/animation
// scene, camera and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75, 16./9.,
    0.1, 1000
);
const renderer = new THREE.WebGLRenderer({antialias: true});

// constants
const numDiscsDefault = 7;
const pillarDiameter = 0.2;
const discThickness = 0.2;
const animNumSteps = 60;

// number of discs: can specify from URL
let numDiscs = numDiscsDefault;
let uri = window.location.href.split('?');
if(uri.length == 2) {
    let vars = uri[1].split('&');
    let parsedVars = { 'numDiscs' : numDiscsDefault };
    let tmp = '';
    vars.forEach(function(v) {
        const tmp = v.split('=');
        if(tmp.length == 2) {
            if (tmp[0] === 'numDiscs') {
                parsedVars[tmp[0]] = parseInt(tmp[1]);
            } else {
                console.warn('warning: irregal query parameter', tmp[0], 'is specified (ignored).');
            }

        }
    });
    // console.log(parsedVars);
    if (1 < parsedVars.numDiscs) {
        numDiscs = parsedVars.numDiscs;
    } else {
        console.warn('warning: numDiscs in query should be >2 but is <= 1');
    }
}

// calculate visualization parameters such as the length of pillars and distance between them.
const pillarHeight = (numDiscs + 2) * discThickness >= 3.0 ? (numDiscs + 2) * discThickness : 3.0;
const largestDiscRadius = 0.4 + 0.1 * (numDiscs - 1);
const pillarDistance = 2 * largestDiscRadius + 0.2 > 3.2 ? 2 * largestDiscRadius + 0.2 : 3.2;
const hoverHeight = 0.5 * pillarHeight + 3 * discThickness > 1.8 ? 0.5 * pillarHeight + 3 * discThickness : 1.8;
const cameraZ = 0.35 * numDiscs > 6 ? 0.35 * numDiscs : 6;

// Light
const light1 = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(light1);
const light2 = new THREE.DirectionalLight(0xffffff, 1);
light2.position.x = 10;
light2.position.y = 4;
light2.position.z = 10;
scene.add(light2);

// Texture handling
function loadTexture(
  url: string,
  onLoad: (tex: THREE.Texture) => void,
  onError?: (err: unknown) => void
) {
  const loader = new THREE.TextureLoader();
  loader.load(
    url,
    (tex) => onLoad(tex),
    undefined,
    (err) => {
      console.warn(`[texture] failed to load: ${url}`, err);
      onError?.(err);
    }
  );
}


// Ground
const groundGeometry = new THREE.BoxGeometry(5000, 0.1, 2200);
const groundMaterial = new THREE.MeshLambertMaterial({color: 0xc2c2c2});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.position.y = -0.5*pillarHeight - 0.05;
scene.add(ground);

loadTexture(
  `${import.meta.env.BASE_URL}/textures/PavingStones128/PavingStones128_1K-JPG_Color.jpg`,
  (tex) => {
	tex.wrapS = THREE.RepeatWrapping;
	tex.wrapT = THREE.RepeatWrapping;
	tex.repeat.set(2500, 1100);
	groundMaterial.map = tex;
	groundMaterial.color = new THREE.Color(0xffffff);
	groundMaterial.needsUpdate = true;
  }
);

// Sky
const skyGeometry = new THREE.BoxGeometry(5000, 0.1, 2200);
const skyMaterial = new THREE.MeshBasicMaterial({color: 0xaecbe8});
const sky = new THREE.Mesh(skyGeometry, skyMaterial);
sky.position.y = 15.0;
sky.rotation.x = -0.016;
scene.add(sky);

loadTexture(
  `${import.meta.env.BASE_URL}/textures/skytile1.png`,
  (tex) => {
	tex.wrapS = THREE.RepeatWrapping;
	tex.wrapT = THREE.RepeatWrapping;
	tex.repeat.set(20, 8);
	skyMaterial.map = tex;
	skyMaterial.color = new THREE.Color(0xffffff);
	skyMaterial.needsUpdate = true;
  }
);

// Far walls
// const wallGeometry = new THREE.BoxGeometry(2200, 2200, 0.1);
// const wallMaterial = new THREE.MeshBasicMaterial({map: skyTexture});
// const wall = new THREE.Mesh(wallGeometry, wallMaterial);
// wall.position.y = - 1100 + 15
// wall.position.z = -200;
// scene.add(wall);

// Pillars
const pillarGeometry = new THREE.CylinderGeometry(0.5*pillarDiameter, 0.5*pillarDiameter, pillarHeight, 16);
const pillarMaterial = new THREE.MeshLambertMaterial({color: 0x41342e});
const pillar = [];
for (let i = -1; i <= 1; ++i) {
    const p = new THREE.Mesh(pillarGeometry, pillarMaterial);
    p.position.x += pillarDistance*i;
    scene.add(p);    
    pillar.push(p);
}

loadTexture(
  `${import.meta.env.BASE_URL}/textures/Wood051/Wood051_1K-JPG_Color.jpg`,
  (tex) => {
	tex.wrapS = THREE.RepeatWrapping;
	tex.wrapT = THREE.RepeatWrapping;
	tex.repeat.set(2, 1);
	pillarMaterial.map = tex;
	pillarMaterial.color = new THREE.Color(0xcfcfcf);
	pillarMaterial.needsUpdate = true;
  }
);

// discs
const discColors = [
    0xe69f00, 0x56b4e9, 0x009e73, 0xf0e442, 0x0072b2, 0xd55e00, 0xcc79a7
];

const discs = [];
for (let i = 0; i < numDiscs; ++i) {
    const radius = 0.4 + 0.1 * i;
    const geometry = new THREE.CylinderGeometry(radius, radius, 0.2, 32);
    const material = new THREE.MeshLambertMaterial({color: discColors[i % 7]});
    const d = new THREE.Mesh(geometry, material);
    d.position.x = -pillarDistance;
    d.position.y = -0.5*pillarHeight + discThickness*(numDiscs - i - 1 + 0.5);
    scene.add(d);
    discs.push(d);
}

loadTexture(
  `${import.meta.env.BASE_URL}/textures/Travertine009/Travertine009_1K-JPG_Color.jpg`,
  (tex) => {
	tex.wrapS = THREE.RepeatWrapping;
	tex.wrapT = THREE.RepeatWrapping;
	tex.repeat.set(2, 2);

	discs.forEach((d) => {
		(d.material as THREE.MeshLambertMaterial).map = tex;
		(d.material as THREE.MeshLambertMaterial).needsUpdate = true;
	}
	);
});

// Camera position
// normal
camera.position.z = cameraZ;
camera.position.y = 1;
// close view
// camera.position.z = 4;
// camera.position.y = 3;
// camera.rotation.x = -0.5;

let step = 0;
let compiledMotions = [];
let errorLine = -1;

function compile(commands) {
    // Parse commands and simulate disc motions
    compiledMotions = [];
    errorLine = -1;
    // First parse commands.
    const motionLines = commands.split("\n");
    const re = new RegExp("([ABC123])[, ]([ABC123])");
    const motions = [];
    let lineno = 1;
    let errorOccured = false;
    motionLines.forEach((line) => {
        if (line === '') {
            // empty line
            return; // continue
        }
        const m = line.match(re);
        if (m) {
            motions.push([m[1], m[2]]);
            // console.log(m[1], " -> ", m[2]);
        } else {
            if (!errorOccured) {
                errorMessage.value = 'error: cannot parse line ' + lineno;
                errorLine = lineno - 1;
            }
            console.error(errorMessage.value);
            errorOccured = true;
        }
        ++lineno;
    });
    numTotalSteps.value = motionLines.length;

    // Simulate disc motions.
    let towers = [ [], [], [] ];
    for (let i = 0; i < numDiscs; ++i) {
        towers[0].push(numDiscs - i - 1);
    }

    lineno = 1;
    motions.forEach((m) => {
        let p1 = 0, p2 = 0;
        if (m[0] === "1" || m[0] === "A") {
            p1 = 0;
        } else if (m[0] === "2" || m[0] === "B") {
            p1 = 1;
        } else if (m[0] === "3" || m[0] === "C") {
            p1 = 2;
        }
        if (m[1] === "1" || m[1] === "A") {
            p2 = 0;
        } else if (m[1] === "2" || m[1] === "B") {
            p2 = 1;
        } else if (m[1] === "3" || m[1] === "C") {
            p2 = 2;
        }

        if (towers[p1].length === 0) {
            if (!errorOccured) {
                errorMessage.value = 'error: tower ' + ['A', 'B', 'C'][p1] + ' is empty at line ' + lineno;
                errorLine = lineno - 1;
            }
            console.error(errorMessage.value);
            errorOccured = true;
            return;
        }
        const discId = towers[p1].pop();
        const p2top = towers[p2][towers[p2].length - 1];
        compiledMotions.push([discId, p1, p2, towers[p1].length + 1, towers[p2].length]);
        if (p1 == p2) {
            if (!errorOccured) {
                errorMessage.value = 'error: the disc is not moved on tower ' + ['A', 'B', 'C'][p1] + ' at line ' + lineno;
                errorLine = lineno;
            }
            console.error(errorMessage.value);
            errorOccured = true;
            return;
        } else if (towers[p2].length > 0 && p2top < discId) {
            if (!errorOccured) {
                errorMessage.value = 'error: the size of disc at the top of tower ' + ['A', 'B', 'C'][p2] + ' is ' + (p2top+1) + ', smaller than ' + (discId+1) + ' at line ' + lineno;
                errorLine = lineno;
            }
            console.error(errorMessage.value);
            errorOccured = true;
            return;
        }
        towers[p2].push(discId);

        ++lineno;
    });

    // console.log(compiledMotions);
    return !errorOccured;
}

function animate() {
    requestAnimationFrame(animate)

    // Motion
    if (playMode.value) {
        const animStep = Math.floor(step / (3 * animNumSteps));
        const animStartStep = animStep * (3 * animNumSteps);
        const finalStep = errorLine >= 0 ? errorLine : compiledMotions.length;
        currentMotionStep.value = animStep + 1 >= compiledMotions.length ? compiledMotions.length : animStep + 1;
        if (animStep >= finalStep) {
            playMode.value = false;
            finished.value = true;
            // console.timeEnd('Execution Time');
        } else {
            finished.value = false;
            const disc = discs[compiledMotions[animStep][0]];
            const startX = pillarDistance * (compiledMotions[animStep][1] - 1);
            const startHeight = -0.5*pillarHeight + discThickness * (compiledMotions[animStep][3] + 0.5);
            const endX = pillarDistance * (compiledMotions[animStep][2] - 1);
            const endHeight = -0.5*pillarHeight + discThickness * (compiledMotions[animStep][4] + 0.5);
            // console.log(disc, startX, startHeight, endX, endHeight);
            if (step - animStartStep < animNumSteps) {
				// move up
                const height = startHeight + (hoverHeight - startHeight) * (step - animStartStep) / animNumSteps;
                disc.position.x = startX;
                disc.position.y = height;
            }
            else if (step - animStartStep < 2 * animNumSteps) {
				// move horizontally
                const x = startX + (endX - startX) * ((step - animStartStep) - animNumSteps) / animNumSteps;
                disc.position.x = x;
                disc.position.y = hoverHeight;
            }
            else if (step - animStartStep < 3 * animNumSteps) {
				// move down
                const height = endHeight + (hoverHeight - endHeight) * (3 * animNumSteps - (step - animStartStep)) / animNumSteps;
                disc.position.x = endX;
                disc.position.y = height;
            }

            ++step;
        }
    }

    renderer.render(scene, camera);
}

function onResize()
{
    const width = document.getElementById("controllerBox")!.scrollWidth;
    const height = width / 16 * 9;

    // レンダラーのサイズを調整する
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);

  // カメラのアスペクト比を正す
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}
</script>
