<!-- Developed by Taipei Urban Intelligence Center 2023 -->

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useContentStore } from '../store/contentStore';
import { useDialogStore } from '../store/dialogStore';
import { useMapStore } from '../store/mapStore';
import router from '../router/index';

import AddDashboard from './dialogs/AddDashboard.vue';
import SideBarTab from './utilities/SideBarTab.vue';

const contentStore = useContentStore();
const dialogStore = useDialogStore();
const mapStore = useMapStore();

// The expanded state is also stored in localstorage to retain the setting after refresh
const isExpanded = ref(true);
const searchQuery = ref('');

function toggleExpand() {
	isExpanded.value = isExpanded.value ? false : true;
	localStorage.setItem('isExpanded', isExpanded.value);
	if (!isExpanded.value) {
		mapStore.resizeMap();
	}
}

onMounted(() => {
	const storedExpandedState = localStorage.getItem('isExpanded');
	if (storedExpandedState === "false") {
		isExpanded.value = false;
	} else {
		isExpanded.value = true;
	}
});

// 全文搜尋：name + short_desc + long_desc + use_case + source + tags
const searchResults = computed(() => {
	const q = searchQuery.value.trim().toLowerCase();
	if (!q) return [];

	const validDashboards = contentStore.dashboards.filter(
		(d) => d.index !== 'map-layers' && d.index !== 'favorites'
	);

	const results = [];
	for (const [id, comp] of Object.entries(contentStore.components)) {
		const text = [
			comp.name,
			comp.short_desc,
			comp.long_desc,
			comp.use_case,
			comp.source,
			...(Array.isArray(comp.tags) ? comp.tags : []),
		].filter(Boolean).join(' ').toLowerCase();

		if (!text.includes(q)) continue;

		const dashboard = validDashboards.find((d) => d.components.includes(id));
		if (!dashboard) continue;

		results.push({
			id,
			name: comp.name,
			dashboardIndex: dashboard.index,
			dashboardName: dashboard.name,
			nameMatch: comp.name.toLowerCase().includes(q),
		});
	}

	// 名稱符合排前面
	results.sort((a, b) => (b.nameMatch ? 1 : 0) - (a.nameMatch ? 1 : 0));
	return results;
});

function goToComponent(dashboardIndex, componentId) {
	contentStore.highlightComponentId = String(componentId);
	router.replace({ query: { index: dashboardIndex } });
	searchQuery.value = '';
}
</script>

<template>
	<div :class="{ sidebar: true, 'sidebar-collapse': !isExpanded, 'hide-if-mobile': true }">
		<div class="sidebar-sub-add">
			<h2>{{ isExpanded ? `儀表板列表` : `列表` }}</h2>
			<button v-if="isExpanded"
				@click="dialogStore.showDialog('addDashboard')"><span>add_circle_outline</span>新增</button>
			<AddDashboard />
		</div>

		<!-- 搜尋框 -->
		<div v-if="isExpanded" class="sidebar-search">
			<span class="sidebar-search-icon">search</span>
			<input
				v-model="searchQuery"
				class="sidebar-search-input"
				placeholder="搜尋組件…"
				type="text"
			/>
			<button v-if="searchQuery" class="sidebar-search-clear" @click="searchQuery = ''">
				<span>close</span>
			</button>
		</div>

		<!-- 搜尋結果 -->
		<template v-if="isExpanded && searchQuery.trim()">
			<div v-if="searchResults.length === 0" class="sidebar-search-empty">找不到相符組件</div>
			<div
				v-for="r in searchResults"
				:key="r.id"
				class="sidebar-search-item"
				@click="goToComponent(r.dashboardIndex, r.id)"
			>
				<span class="ssi-name"><span class="ssi-id">{{ r.id }}</span> {{ r.name }}</span>
				<span class="ssi-dash">{{ r.dashboardName }}</span>
			</div>
		</template>

		<!-- 正常儀表板列表 -->
		<template v-if="!searchQuery.trim()">
			<SideBarTab
				v-for="item in contentStore.dashboards.filter((item) => item.index !== 'map-layers' && item.index !== 'favorites')"
				:icon="item.icon" :title="item.name" :index="item.index" :key="item.index" :expanded="isExpanded" />
		</template>

		<h2>{{ isExpanded ? `基本地圖圖層` : `圖層` }}</h2>
		<SideBarTab icon="public" title="圖資資訊" :expanded="isExpanded" index="map-layers" />
		<button class="sidebar-collapse-button" @click="toggleExpand"><span>{{ isExpanded ? "keyboard_double_arrow_left" :
			"keyboard_double_arrow_right"
		}}</span></button>
		<h2>{{ isExpanded ? `我的最愛` : `最愛` }}</h2>
		<SideBarTab icon="favorite" title="收藏組件" :expanded="isExpanded" index="favorites" />
	</div>
</template>

<style scoped lang="scss">
.sidebar {
	width: 170px;
	min-width: 170px;
	height: calc(100vh - 80px);
	height: calc(var(--vh) * 100 - 80px);
	max-height: calc(100vh - 80px);
	max-height: calc(var(--vh) * 100 - 80px);
	position: relative;
	padding: 0 10px 0 var(--font-m);
	margin-top: 20px;
	border-right: 1px solid var(--color-border);
	transition: min-width 0.2s ease-out;
	overflow-x: hidden;
	overflow-y: scroll;
	user-select: none;

	h2 {
		color: var(--color-complement-text);
		font-weight: 400;
	}

	&-sub {
		margin-bottom: var(--font-s);

		&-add {
			width: 100%;
			display: flex;

			button {
				display: flex;
				align-items: center;
				margin-left: 0.5rem;
				padding: 2px 6px;
				border-radius: 5px;
				background-color: var(--color-highlight);
				color: var(--color-normal-text);

				span {
					margin-right: 4px;
					font-family: var(--font-icon);
				}
			}
		}
	}

	&-search {
		display: flex;
		align-items: center;
		gap: 4px;
		margin: 6px 0 8px;
		padding: 4px 8px;
		background-color: var(--color-component-background);
		border: 1px solid var(--color-border);
		border-radius: 6px;

		&-icon {
			font-family: var(--font-icon);
			font-size: 15px;
			color: var(--color-complement-text);
			flex-shrink: 0;
		}

		&-input {
			flex: 1;
			background: transparent;
			border: none;
			outline: none;
			color: var(--color-normal-text);
			font-size: 0.78rem;
			min-width: 0;

			&::placeholder {
				color: var(--color-complement-text);
			}
		}

		&-clear {
			display: flex;
			align-items: center;
			padding: 0;
			background: transparent;
			flex-shrink: 0;

			span {
				font-family: var(--font-icon);
				font-size: 14px;
				color: var(--color-complement-text);
			}

			&:hover span {
				color: var(--color-normal-text);
			}
		}
	}

	&-search-empty {
		font-size: 0.75rem;
		color: var(--color-complement-text);
		padding: 6px 4px;
	}

	&-search-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 6px 8px;
		border-radius: 6px;
		cursor: pointer;
		transition: background-color 0.15s;

		&:hover {
			background-color: var(--color-component-background);
		}

		.ssi-name {
			font-size: 0.8rem;
			color: var(--color-normal-text);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.ssi-dash {
			font-size: 0.68rem;
			color: var(--color-complement-text);
		}

		.ssi-id {
			font-size: 0.65rem;
			color: #666;
			font-family: monospace;
			margin-right: 2px;
		}
	}

	&-collapse {
		width: 45px;
		min-width: 45px;

		h2 {
			margin-left: 5px;
		}

		&-button {
			height: fit-content;
			position: absolute;
			bottom: 10px;
			right: 10px;
			padding: 5px;
			border-radius: 5px;
			transition: background-color 0.2s;

			&:hover {
				background-color: var(--color-component-background);
			}

			span {
				font-family: var(--font-icon);
				font-size: var(--font-l);
			}


		}
	}
}
</style>