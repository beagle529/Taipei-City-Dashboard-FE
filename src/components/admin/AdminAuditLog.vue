<script setup>
import { ref, onMounted, computed } from "vue";

const props = defineProps(["token"]);
const logs = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = 50;
const loading = ref(false);
const filterSuccess = ref("all"); // 'all' | 'success' | 'fail'

async function load() {
    loading.value = true;
    const res = await fetch(`/api/audit/logins?page=${page.value}&page_size=${pageSize}`, {
        headers: { Authorization: `Bearer ${props.token}` },
    });
    if (res.ok) {
        const d = await res.json();
        logs.value = d.data || [];
        total.value = d.total || 0;
    }
    loading.value = false;
}

const filtered = computed(() => {
    if (filterSuccess.value === "all") return logs.value;
    const want = filterSuccess.value === "success";
    return logs.value.filter(l => l.success === want);
});

const totalPages = computed(() => Math.ceil(total.value / pageSize));

function prevPage() { if (page.value > 1) { page.value--; load(); } }
function nextPage() { if (page.value < totalPages.value) { page.value++; load(); } }

onMounted(load);
</script>

<template>
    <div class="audit-panel">
        <div class="audit-header">
            <h4>登入紀錄</h4>
            <div class="filter-row">
                <button :class="['filter-btn', filterSuccess === 'all' ? 'active' : '']" @click="filterSuccess = 'all'">全部</button>
                <button :class="['filter-btn success', filterSuccess === 'success' ? 'active' : '']" @click="filterSuccess = 'success'">成功</button>
                <button :class="['filter-btn fail', filterSuccess === 'fail' ? 'active' : '']" @click="filterSuccess = 'fail'">失敗</button>
                <span class="total-count">共 {{ total }} 筆</span>
            </div>
        </div>

        <div v-if="loading" class="loading">載入中…</div>
        <div v-else-if="!filtered.length" class="empty">無紀錄</div>
        <div v-else class="log-table">
            <div class="lt-header">
                <span>時間</span>
                <span>帳號</span>
                <span>IP</span>
                <span>結果</span>
            </div>
            <div v-for="(l, i) in filtered" :key="i" :class="['lt-row', l.success ? 'ok' : 'fail']">
                <span class="lt-ts">{{ l.timestamp }}</span>
                <span class="lt-user">{{ l.username }}</span>
                <span class="lt-ip">{{ l.ip || '—' }}</span>
                <span :class="['lt-result', l.success ? 'ok' : 'fail']">
                    {{ l.success ? '✓ 成功' : '✗ 失敗' }}
                </span>
            </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
            <button @click="prevPage" :disabled="page === 1">‹ 上一頁</button>
            <span>第 {{ page }} / {{ totalPages }} 頁</span>
            <button @click="nextPage" :disabled="page === totalPages">下一頁 ›</button>
        </div>
    </div>
</template>

<style scoped lang="scss">
.audit-panel { display: flex; flex-direction: column; gap: 1rem; }

.audit-header {
    display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
    h4 { color: #ddd; margin: 0; font-size: 0.9rem; }
}

.filter-row { display: flex; align-items: center; gap: 0.4rem; }

.filter-btn {
    background: #2a2c2e; border: 1px solid #3a3c3e; color: #888;
    border-radius: 5px; padding: 0.25rem 0.65rem; cursor: pointer; font-size: 0.78rem;
    &:hover { border-color: #666; color: #ccc; }
    &.active { background: #2d3e5a; border-color: #5b8cfa; color: #7ab3ff; }
    &.success.active { background: #1e3a2a; border-color: #4ade80; color: #4ade80; }
    &.fail.active { background: #3a1e1e; border-color: #f87171; color: #f87171; }
}

.total-count { color: #555; font-size: 0.78rem; margin-left: 0.5rem; }

.loading, .empty { color: #555; font-size: 0.875rem; }

.log-table { border: 1px solid #3a3c3e; border-radius: 8px; overflow: hidden; }

.lt-header, .lt-row {
    display: grid;
    grid-template-columns: 160px 120px 130px 80px;
    padding: 0.45rem 0.75rem;
    font-size: 0.8rem; gap: 0.75rem; align-items: center;
}

.lt-header { background: #282a2c; color: #666; border-bottom: 1px solid #3a3c3e; }

.lt-row {
    border-bottom: 1px solid #2a2c2e; color: #aaa;
    &:last-child { border-bottom: none; }
    &.fail { background: rgba(248,113,113,0.04); }
}

.lt-ts { color: #ccc; font-family: monospace; font-size: 0.78rem; }
.lt-user { color: #7ab3ff; font-family: monospace; }
.lt-ip { color: #666; font-size: 0.75rem; font-family: monospace; }

.lt-result {
    font-size: 0.78rem; font-weight: 500;
    &.ok { color: #4ade80; }
    &.fail { color: #f87171; }
}

.pagination {
    display: flex; align-items: center; justify-content: center; gap: 1rem;
    color: #666; font-size: 0.8rem;
    button {
        background: #2a2c2e; border: 1px solid #3a3c3e; color: #888;
        border-radius: 5px; padding: 0.25rem 0.65rem; cursor: pointer; font-size: 0.78rem;
        &:hover:not(:disabled) { border-color: #666; color: #ccc; }
        &:disabled { opacity: 0.4; cursor: not-allowed; }
    }
}
</style>
