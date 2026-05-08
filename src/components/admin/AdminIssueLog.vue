<script setup>
import { ref, computed, onMounted } from "vue";

const props = defineProps(["token"]);
const issues = ref([]);
const loading = ref(false);
const filterType = ref("all");
const filterResolved = ref("all");

const issueTypes = ["組件基本資訊有誤", "組件資料有誤或未更新", "系統問題", "其他建議"];

async function load() {
    loading.value = true;
    const res = await fetch("/api/issues", {
        headers: { Authorization: `Bearer ${props.token}` },
    });
    if (res.ok) { const d = await res.json(); issues.value = d.data || []; }
    loading.value = false;
}

async function toggleResolved(index, current) {
    await fetch(`/api/issues/${index}?resolved=${!current}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${props.token}` },
    });
    await load();
}

const filtered = computed(() => {
    return issues.value.filter((item) => {
        if (filterType.value !== "all" && item.type !== filterType.value) return false;
        if (filterResolved.value === "open" && item.resolved) return false;
        if (filterResolved.value === "resolved" && !item.resolved) return false;
        return true;
    });
});

const openCount = computed(() => issues.value.filter(i => !i.resolved).length);

onMounted(load);
</script>

<template>
    <div class="issue-panel">
        <div class="issue-header">
            <div class="filter-row">
                <span class="open-badge">{{ openCount }} 件待處理</span>
                <select v-model="filterResolved" class="filter-select">
                    <option value="all">全部</option>
                    <option value="open">待處理</option>
                    <option value="resolved">已處理</option>
                </select>
                <select v-model="filterType" class="filter-select">
                    <option value="all">所有類型</option>
                    <option v-for="t in issueTypes" :key="t" :value="t">{{ t }}</option>
                </select>
            </div>
        </div>

        <div v-if="loading" class="empty">載入中…</div>
        <div v-else-if="!filtered.length" class="empty">無符合的回報紀錄</div>
        <div v-else class="issue-list">
            <div class="il-header">
                <span>時間</span>
                <span>組件</span>
                <span>類型</span>
                <span>問題說明</span>
                <span>回報人</span>
                <span>狀態</span>
            </div>
            <div
                v-for="(item, i) in filtered"
                :key="i"
                :class="['il-row', item.resolved ? 'resolved' : '']"
            >
                <span class="il-ts">{{ item.timestamp }}</span>
                <span class="il-comp">
                    <span class="comp-name">{{ item.component_name }}</span>
                    <span class="comp-id">ID {{ item.component_id }}</span>
                </span>
                <span class="il-type">{{ item.type }}</span>
                <span class="il-desc">{{ item.description }}</span>
                <span class="il-name">{{ item.name }}</span>
                <span class="il-action">
                    <button
                        :class="['btn-status', item.resolved ? 'btn-reopen' : 'btn-resolve']"
                        @click="toggleResolved(issues.indexOf(item), item.resolved)"
                    >{{ item.resolved ? '重新開啟' : '標記已處理' }}</button>
                </span>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.issue-panel { display: flex; flex-direction: column; gap: 1rem; }

.issue-header { display: flex; justify-content: flex-end; }

.filter-row { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }

.open-badge {
    background: #3a2a10; color: #f59e0b; border-radius: 5px;
    padding: 0.2rem 0.6rem; font-size: 0.78rem;
}

.filter-select {
    background: #2a2c2e; border: 1px solid #3a3c3e; color: #aaa;
    border-radius: 5px; padding: 0.25rem 0.5rem; font-size: 0.78rem; cursor: pointer;
    &:focus { outline: none; border-color: #5b8cfa; }
}

.empty { color: #555; font-size: 0.875rem; }

.issue-list { border: 1px solid #3a3c3e; border-radius: 8px; overflow: hidden; }

.il-header, .il-row {
    display: grid;
    grid-template-columns: 140px 160px 130px 1fr 90px 110px;
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    gap: 0.75rem;
    align-items: start;
}

.il-header { background: #282a2c; color: #666; border-bottom: 1px solid #3a3c3e; }

.il-row {
    border-bottom: 1px solid #2a2c2e; color: #aaa;
    &:last-child { border-bottom: none; }
    &.resolved { opacity: 0.45; }
}

.il-ts { color: #ccc; font-family: monospace; font-size: 0.75rem; }

.il-comp {
    display: flex; flex-direction: column; gap: 0.15rem;
    .comp-name { color: #7ab3ff; font-size: 0.8rem; }
    .comp-id { color: #555; font-size: 0.7rem; font-family: monospace; }
}

.il-type { color: #f59e0b; font-size: 0.75rem; }
.il-desc { color: #ccc; font-size: 0.78rem; line-height: 1.5; white-space: pre-wrap; word-break: break-all; }
.il-name { color: #888; font-size: 0.78rem; }

.btn-status {
    border: none; border-radius: 4px; padding: 0.2rem 0.55rem;
    font-size: 0.72rem; cursor: pointer; white-space: nowrap;
    &.btn-resolve { background: #1e3a2a; color: #4ade80; &:hover { background: #2a4a38; } }
    &.btn-reopen  { background: #2a2c2e; color: #888;    &:hover { background: #3a3c3e; color: #ccc; } }
}
</style>
