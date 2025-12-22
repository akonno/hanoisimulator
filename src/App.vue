<!-- App.vue - hanoisimulator app -->
<template>
	<div v-cloak>
		<nav class="navbar">
			<div class="navbar-brand">
                <a class="navbar-item" href="#">
				<h1 class="title">
				{{ $t("message.hanoisimulatortitle") }}
				</h1></a>
                <a class="navbar-burger" :class="{ 'is-active': isBurgerActive }" role="button" aria-label="menu" aria-expanded="false" @click="isBurgerActive=!isBurgerActive">
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                </a>
            </div>
            <div class="navbar-menu" :class="{ 'is-active' : isBurgerActive }">
                <div class="navbar-end">
                    <a class="navbar-item" href="about.html" target="_blank" rel="noopener noreferrer"><span class="icon-text"><span class="icon"><i class="fa-solid fa-arrow-up-right-from-square"></i></span><span>About</span></span></a>
                    <a class="navbar-item" href="for-instructors.html" target="_blank" rel="noopener noreferrer"><span class="icon-text"><span class="icon"><i class="fa-solid fa-arrow-up-right-from-square"></i></span><span>For instructors</span></span></a>
                    <button class="navbar-item" @click="toggleSettingsModal"><span class="icon-text"><span class="icon"><i class="fa-solid fa-gear"></i></span><span>Settings</span></span></button>
                </div>
            </div>
		</nav>
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
			<div class="container" id="canvas" ref="containerRef" @click="canvasClicked"></div>
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
    <!-- modal -->
     <div class="modal" :class="{ 'is-active': isSettingsModalActive }">
        <div class="modal-background" @click="isSettingsModalActive = false;"></div>
        <div class="modal-content">
            <!-- Any other Bulma elements you want -->
            <div class="box">
                <h2 class="subtitle">{{ $t("message.settings") }}</h2>
                <div class="field is-grouped">
                    <label class="label"><span class="icon-text"><span class="icon"><i class="fas fa-layer-group"></i></span><span>{{ $t("message.discs") }}</span></span></label>
                    <div class="dropdown" :class="{ 'is-active' : isDiscsDropdownActive}" @click="toggleDiscsDropdown">
                        <div class="dropdown-trigger">
                            <button class="button" aria-haspopup="true" aria-controls="dropdown-menu">
                            <span>{{ numDiscs }}</span>
                            <span class="icon is-small">
                                <i class="fas fa-angle-down" aria-hidden="true"></i>
                            </span>
                            </button>
                        </div>
                        <div class="dropdown-menu" id="dropdown-menu" role="menu">
                            <div class="dropdown-content">
                                <button v-for="n in [5, 6, 7, 8, 9, 10]" class="dropdown-item" :class="{ 'is-active': numDiscs.value === n }" @click="setNumDiscs(n)">{{ n }}</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="field is-grouped">
                    <label class="label"><span class="icon-text"><span class="icon"><i class="fas fa-desktop"></i></span><span>{{ $t("message.theme") }}</span></span></label>
                    <div class="control">
                        <label class="radio">
                        <input
                            type="radio"
                            name="theme"
                            value="light"
                            v-model="selectedTheme"
                            @change="setScreenMode(selectedTheme)"
                        />
                        <span class="icon-text"><span class="icon"><i class="fas fa-sun"></i></span><span>{{ $t("message.light") }}</span></span>
                        </label>
                        <label class="radio">
                        <input
                            type="radio"
                            name="theme"
                            value="dark"
                            v-model="selectedTheme"
                            @change="setScreenMode(selectedTheme)"
                        />
                        <span class="icon-text"><span class="icon"><i class="fas fa-moon"></i></span><span>{{ $t("message.dark") }}</span></span>
                        </label>
                        <label class="radio">
                        <input
                            type="radio"
                            name="theme"
                            value="system"
                            v-model="selectedTheme"
                            @change="setScreenMode(selectedTheme)"
                        />
                        <span class="icon-text"><span class="icon"><i class="fas fa-desktop"></i></span><span>{{ $t("message.system") }}</span></span>
                        </label>
                    </div>
                </div>
                <div class="field is-grouped">
                    <label class="label"><span class="icon-text"><span class="icon"><i class="fas fa-language"></i></span><span>Language</span></span></label>
                    <div class="control">
                        <label class="radio">
                        <input
                            type="radio"
                            name="lang"
                            value="en"
                            v-model="selectedLocale"
                            @change="locale = selectedLocale"
                        />
                        English
                        </label>
                        <label class="radio">
                        <input
                            type="radio"
                            name="lang"
                            value="ja"
                            v-model="selectedLocale"
                            @change="locale = selectedLocale"
                        />
                        Japanese / 日本語
                        </label>
                    </div>
                </div>
                <button class="button is-primary" @click="isSettingsModalActive = false;">{{ $t("message.close") }}</button>
            </div>
        </div>
        <button class="modal-close is-large" aria-label="close" @click="isSettingsModalActive = false;"></button>
     </div>
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

import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();

import { parseMotionCommands, compileHanoiMotions } from './domain/hanoiParser';
let compiledResult: ReturnType<typeof compileHanoiMotions> | false = false;

import { HanoiThree } from "./three/hanoiThree";
let three: HanoiThree | null = null;

const containerRef = ref<HTMLElement | null>(null);

// setup Vue app
const playMode = ref(false);
const errorOccured = ref(false);
const errorMessage = ref("");
const currentMotionStep = ref(0);
const numTotalSteps = ref(7);
const motionCommands = ref("A,B\nA,C\nB,C\nA,B\nC,A\nC,B\nA,B");
const finished = ref(false);
const selectedLocale = ref(locale.value);
const selectedTheme = ref('system');

const isBurgerActive = ref(false);
const isSettingsModalActive = ref(false);
const isDiscsDropdownActive = ref(false);
const numDiscs = ref(7);

function toggleSettingsModal()
{
    isSettingsModalActive.value = !isSettingsModalActive.value;
}

function toggleDiscsDropdown()
{
    isDiscsDropdownActive.value = !isDiscsDropdownActive.value;
}

function setNumDiscs(n: number)
{
    numDiscs.value = n; // for updating the dropdown menu label
    const url = new URL(window.location.href);
    url.searchParams.set('numDiscs', n.toString());
    window.location.href = url.toString();
}

// 初期設定：localStorageから取得したテーマを使い、即座に`data-theme`に反映させる
const initialTheme = localStorage.getItem('theme') || 'system';
document.documentElement.setAttribute('data-theme', initialTheme); // 初期テーマを適用
const theme = ref(initialTheme);

const setScreenMode = (mode_: string) => {
    // Screen mode
    if (mode_ == 'light' || mode_ == 'dark' || mode_ == 'system') {
        document.documentElement.setAttribute('data-theme', mode_);
        theme.value = mode_;
        // Save the theme to localStorage
        localStorage.setItem('theme', mode_);
    } else {
        console.error(`error: unsupported screen mode ${mode_} is specified.`);
    }
}

// Watches
// テーマが変わるたびに`data-theme`属性を更新する
watch(theme, (newTheme: string) => {
    document.documentElement.setAttribute('data-theme', newTheme);
});

watch(
  motionCommands,
  (text: string) => {
    // 実行用compileとは別に、「行数」だけ更新する
    const r = parseMotionCommands(text); // 例: 失敗行も motions に入れる方針
    numTotalSteps.value = r.parsed.length + r.errors.length;
  },
  { immediate: true }
);

function play()
{
	if (!compiledResult) {
		compiledResult = compileHanoiMotions(motionCommands.value, numDiscs.value);
        numTotalSteps.value = compiledResult.numLines;
	}
	if (!compiledResult.ok) {
		errorOccured.value = true;
		playMode.value = false;
        errorMessage.value = `Line ${compiledResult.errors[0].line}: ${compiledResult.errors[0].message}`;
	} else {
		errorOccured.value = false;
		playMode.value = true;
        errorMessage.value = "";
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
    if (!three) return;
	// Restore all the discs to the initial positions.
	for (let i = 0; i < numDiscs.value; ++i) {
        three.setDiscPosition(i, -three.layout.pillarDistance, -0.5*three.layout.pillarHeight + three.layout.discThickness*(numDiscs.value - i - 1 + 0.5));
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
    compiledResult = false;
	errorOccured.value = false;
	currentMotionStep.value = 0;
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
    if (!three) return;
	// https://jsfiddle.net/n853mhwo/
	var a = document.createElement('a');
	// Without 'preserveDrawingBuffer' set to true, we must render now
	a.href = three.screenshot().replace("image/png", "image/octet-stream");
	a.download = 'screenshot.png';
	a.click();
}

onMounted(() => {
    // Setup renderer
    if (!containerRef.value) {
        console.error('error: containerRef is null in onMounted');
        errorMessage.value = "Internal error: container not found.";
        errorOccured.value = true;
        return;
    }
    three = new HanoiThree({ numDiscs: numDiscs.value });
    three.mount(containerRef.value);
	const width = containerRef.value.scrollWidth;
	three.resize(width, width / 16 * 9);
	
	onResize();
	window.addEventListener('resize', onResize);
	
	// Start visualization
	// This should be after initializing app, because animate() uses app.playMode.
	if (HanoiThree.isWebGLAvailable()) {
		animate();
	} else {
		errorMessage.value =  "WebGL is not available in this browser/environment.";
		errorOccured.value = true;
	}
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize);
    if (rafId !== null) {
        cancelAnimationFrame(rafId);
    }

    if (three) {
        three.dispose();
        three = null;
    }
});

// constants
const numDiscsDefault = 7;
const animNumSteps = 60;

// number of discs: can specify from URL
numDiscs.value = numDiscsDefault;
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
        numDiscs.value = parsedVars.numDiscs;
    } else {
        console.warn('warning: numDiscs in query should be >2 but is <= 1');
    }
}

// calculate visualization parameters such as the length of pillars and distance between them.

let step = 0;

let rafId: number | null = null;

function animate() {
    if (!three) return;

    rafId = requestAnimationFrame(animate)

    // Motion
    if (playMode.value) {
        const pillarDistance = three.layout.pillarDistance;
        const pillarHeight = three.layout.pillarHeight;
        const discThickness = three.layout.discThickness;
        const hoverHeight = 0.5 * three.layout.pillarHeight + 3 * three.layout.discThickness > 1.8 ? 0.5 * three.layout.pillarHeight + 3 * three.layout.discThickness : 1.8;
        const animStep = Math.floor(step / (3 * animNumSteps));
        const animStartStep = animStep * (3 * animNumSteps);
        if (!compiledResult) {
            compiledResult = compileHanoiMotions(motionCommands.value, numDiscs.value);
        }
        const finalStep = compiledResult.stopAfterMotions;
        currentMotionStep.value = animStep + 1 >= compiledResult.motions.length ? compiledResult.motions.length : animStep + 1;
        if (animStep >= finalStep) {
            playMode.value = false;
            finished.value = true;
        } else {
            finished.value = false;
            const discId = compiledResult.motions[animStep].discId;

            const startX = pillarDistance * (compiledResult.motions[animStep].fromPillar - 1);
            const startHeight = -0.5*pillarHeight + discThickness * (compiledResult.motions[animStep].fromLevel + 0.5);
            const endX = pillarDistance * (compiledResult.motions[animStep].toPillar - 1);
            const endHeight = -0.5*pillarHeight + discThickness * (compiledResult.motions[animStep].toLevel + 0.5);
            // console.log(disc, startX, startHeight, endX, endHeight);
            if (step - animStartStep < animNumSteps) {
				// move up
                const height = startHeight + (hoverHeight - startHeight) * (step - animStartStep) / animNumSteps;
                three.setDiscPosition(discId, startX, height);
            }
            else if (step - animStartStep < 2 * animNumSteps) {
				// move horizontally
                const x = startX + (endX - startX) * ((step - animStartStep) - animNumSteps) / animNumSteps;
                three.setDiscPosition(discId, x, hoverHeight);
            }
            else if (step - animStartStep < 3 * animNumSteps) {
				// move down
                const height = endHeight + (hoverHeight - endHeight) * (3 * animNumSteps - (step - animStartStep)) / animNumSteps;
                three.setDiscPosition(discId, endX, height);
            }

            ++step;
        }
    }

    three.render();
}

function onResize()
{
    if (!three) return;
    const width = document.getElementById("controllerBox")!.scrollWidth;
    const height = width / 16 * 9;
    three.resize(width, height);
}
</script>
