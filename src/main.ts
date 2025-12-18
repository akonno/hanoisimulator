// 3D animation of the towers of Hanoi
// Copyright (C) 2024-205 KONNO Akihisa <konno@researchers.jp>

import { createApp } from 'vue';
import App from './App.vue';
import { createI18n } from 'vue-i18n';

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

const i18n = createI18n({
    locale: navigator.language.split('-')[0],
    fallbackLocale: 'en',
    messages,
});

// Import Bulma and Font Awesome here to apply globally
import 'bulma/css/bulma.css';
import '@fortawesome/fontawesome-free/css/all.css';

// setup Vue app
const app = createApp(App);
app.use(i18n);
app.mount("#app");
