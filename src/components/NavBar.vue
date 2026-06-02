<!-- Developed by Taipei Urban Intelligence Center 2023 -->

<!-- Navigation will be hidden from the navbar in mobile mode and moved to the settingsbar -->

<script setup>
const { VITE_APP_TITLE } = import.meta.env;
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../store/authStore';
import { useDialogStore } from '../store/dialogStore';
import { useFullscreen } from '@vueuse/core';

import UserSettings from './dialogs/UserSettings.vue';

const route = useRoute();
const authStore = useAuthStore();
const dialogStore = useDialogStore();
const { isFullscreen, toggle } = useFullscreen();

// ── System clock ──
const now = ref(new Date());
let clockTimer = null;
const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
function pad(n) { return String(n).padStart(2, '0'); }
const clockDate = computed(() => {
    const d = now.value;
    return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())}（週${weekdays[d.getDay()]}）`;
});
const clockTime = computed(() => {
    const d = now.value;
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
});

// ── Quick links（從 public/quicklinks.json 讀取，伺服器上可直接修改）──
const quickLinks = ref([]);
onMounted(async () => {
    clockTimer = setInterval(() => { now.value = new Date(); }, 1000);
    try {
        const res = await fetch('/api/quicklinks');
        if (res.ok) quickLinks.value = await res.json();
    } catch {
        // 無法載入時靜默略過
    }
});
onUnmounted(() => { clearInterval(clockTimer); });

const linkQuery = computed(() => {
	const { query } = route;
	return `?index=${query.index}`;
});
</script>

<template>
	<div class="navbar">
		<div class="navbar-logo">
			<div class="navbar-logo-image">
				<img src="../assets/images/TUIC.svg" alt="tuic logo" />
			</div>
			<div>
				<h1>{{ VITE_APP_TITLE }}</h1>
				<h2>Beinong Market Intelligence Dashboard</h2>
			</div>
		</div>

		<!-- 快速連結黃色按鈕 -->
		<div class="navbar-quicklinks hide-if-mobile" v-if="quickLinks.length">
			<a
				v-for="link in quickLinks"
				:key="link.label"
				:href="link.url"
				target="_blank"
				rel="noopener noreferrer"
				class="navbar-quicklink-btn"
			>{{ link.label }}</a>
		</div>

		<div class="navbar-tabs hide-if-mobile">
			<router-link :to="`/dashboard${linkQuery}`">儀表板總覽</router-link>
			<router-link :to="`/mapview${linkQuery}`">地圖交叉比對</router-link>
		</div>
		<div class="navbar-clock hide-if-mobile">
			<span class="clock-date">{{ clockDate }}</span>
			<span class="clock-time">{{ clockTime }}</span>
		</div>
		<div class="navbar-user">
			<router-link to="/help"><button title="操作說明"><span>help</span></button></router-link>
			<a :href="$router.resolve('/admin').href" target="_blank" rel="noopener" class="hide-if-mobile">
				<button title="管理後台（新分頁）"><span>admin_panel_settings</span></button>
			</a>
			<button class="hide-if-mobile" @click="toggle"><span>{{ isFullscreen ? 'fullscreen_exit' : 'fullscreen'
			}}</span></button>
			<div class="navbar-user-user hide-if-mobile">
				<button>{{ authStore.user.name }}</button>
				<ul>
					<li><button @click="dialogStore.showDialog('userSettings')">用戶設定</button></li>
					<li><button @click="authStore.handleLogout">登出</button></li>
				</ul>
				<teleport to="body">
					<user-settings />
				</teleport>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
.navbar {
	height: 60px;
	width: 100vw;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1px solid var(--color-border);
	background-color: var(--color-component-background);
	user-select: none;

	&-logo {
		display: flex;

		h1 {
			font-weight: 500;
		}

		h2 {
			font-size: var(--font-s);
			font-weight: 400;
		}

		&-image {
			width: 22.94px;
			height: 45px;
			margin: 0 var(--font-m);

			img {
				height: 45px;
				filter: invert(1);
			}
		}


	}

	&-quicklinks {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 0 var(--font-s);
	}

	&-quicklink-btn {
		/* 正方形按鈕 */
		display: flex;
		align-items: center;
		justify-content: center;
		width: 54px;
		height: 54px;
		padding: 3px;
		border-radius: 5px;
		overflow: hidden;

		background-color: #d97706;
		color: #fff;
		font-size: 10px;
		font-weight: 700;
		line-height: 1.35;
		text-align: center;
		white-space: normal;
		word-break: break-all;
		text-decoration: none;
		transition: background-color 0.2s, opacity 0.2s;

		&:hover {
			background-color: #b45309;
			opacity: 0.95;
		}
	}

	&-tabs {
		display: flex;

		a {
			height: 59px;
			display: flex;
			align-items: center;
			margin-left: var(--font-s)
		}

		.router-link-active {
			border-bottom: solid 3px var(--color-highlight);
			color: var(--color-highlight);
		}
	}

	&-clock {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0 var(--font-m);
		border-left: 1px solid var(--color-border);
		border-right: 1px solid var(--color-border);

		.clock-date {
			font-size: var(--font-s);
			color: var(--color-complement-text);
			letter-spacing: 0.03em;
		}

		.clock-time {
			font-size: var(--font-m);
			font-family: monospace;
			font-weight: 600;
			color: var(--color-highlight);
			letter-spacing: 0.08em;
		}
	}

	&-user {
		display: flex;
		align-items: center;

		button {
			display: flex;
			align-items: center;
			margin-right: var(--font-m);
			padding: 2px 4px;
			border-radius: 4px;
			font-size: var(--font-m);
			transition: background-color 0.25s;
		}

		button:hover {
			background-color: var(--color-complement-text);
		}

		span {
			font-family: var(--font-icon);
			font-size: calc(var(--font-l) * var(--font-to-icon));
		}

		&-user:hover ul {
			display: block;
			opacity: 1;
		}

		&-user {
			height: 60px;
			display: flex;
			align-items: center;

			ul {
				min-width: 100px;
				display: none;
				position: absolute;
				right: 20px;
				top: 55px;
				padding: 8px;
				border-radius: 5px;
				background-color: rgb(85, 85, 85);
				opacity: 0;
				transition: opacity 0.25s;
				z-index: 10;

				li {
					padding: 8px 4px;
					border-radius: 5px;
					transition: background-color 0.25s;
					cursor: pointer;
				}

				li:hover {
					background-color: var(--color-complement-text)
				}
			}
		}
	}
}
</style>