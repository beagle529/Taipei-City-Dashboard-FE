<script setup>
import { ref, computed, onMounted } from "vue";

const props = defineProps(["token"]);
const emit = defineEmits(["select"]);

const deleting = ref(null); // 正在刪除的 component id
const deleteError = ref("");

async function confirmDelete(c) {
    if (!confirm(`確定要刪除「${c.name}」（ID: ${c.id}）？\n\n此操作將同時移除資料檔與儀表板引用，無法復原。`)) return;
    deleting.value = c.id;
    deleteError.value = "";
    const res = await fetch(`/api/components/${c.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${props.token}` },
    });
    deleting.value = null;
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        deleteError.value = data.detail || `刪除失敗 (${res.status})`;
    } else {
        await load();
    }
}

const components = ref([]);
const loading = ref(true);
const search = ref("");
const dashboardFilter = ref("all");
const sortKey = ref("id");
const sortDir = ref("asc");

function setSort(key) {
    if (sortKey.value === key) {
        sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
    } else {
        sortKey.value = key;
        sortDir.value = "asc";
    }
}

const allDashboards = computed(() => {
    const set = new Set();
    components.value.forEach((c) => c.dashboards.forEach((d) => set.add(d)));
    return ["all", ...Array.from(set)];
});

const filtered = computed(() => {
    const list = components.value.filter((c) => {
        const matchSearch =
            !search.value ||
            c.name.includes(search.value) ||
            c.id.includes(search.value) ||
            c.source.includes(search.value);
        const matchDash =
            dashboardFilter.value === "all" ||
            c.dashboards.includes(dashboardFilter.value);
        return matchSearch && matchDash;
    });

    return [...list].sort((a, b) => {
        let av = a[sortKey.value];
        let bv = b[sortKey.value];
        if (sortKey.value === "id") { av = parseInt(av); bv = parseInt(bv); }
        else if (Array.isArray(av)) { av = av.join(","); bv = bv.join(","); }
        else { av = String(av ?? ""); bv = String(bv ?? ""); }
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir.value === "asc" ? cmp : -cmp;
    });
});

async function load() {
    loading.value = true;
    const res = await fetch("/api/components", {
        headers: { Authorization: `Bearer ${props.token}` },
    });
    const data = await res.json();
    components.value = data.data;
    loading.value = false;
}

onMounted(load);
</script>

<template>
    <div class="comp-list">
        <div class="comp-list-toolbar">
            <input v-model="search" class="search-input" placeholder="搜尋名稱 / ID / 來源..." />
            <select v-model="dashboardFilter" class="dash-select">
                <option v-for="d in allDashboards" :key="d" :value="d">
                    {{ d === "all" ? "全部儀表板" : d }}
                </option>
            </select>
        </div>

        <div v-if="loading" class="loading">載入中...</div>
        <div v-if="deleteError" class="delete-error">{{ deleteError }}</div>

        <div v-else class="comp-table-wrap">
            <table class="comp-table">
                <thead>
                    <tr>
                        <th class="sortable" @click="setSort('id')">
                            ID <span class="sort-icon">{{ sortKey === 'id' ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
                        </th>
                        <th class="sortable" @click="setSort('name')">
                            名稱 <span class="sort-icon">{{ sortKey === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
                        </th>
                        <th class="sortable" @click="setSort('source')">
                            來源 <span class="sort-icon">{{ sortKey === 'source' ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
                        </th>
                        <th class="sortable" @click="setSort('chart_types')">
                            圖表類型 <span class="sort-icon">{{ sortKey === 'chart_types' ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
                        </th>
                        <th class="sortable" @click="setSort('dashboards')">
                            所屬儀表板 <span class="sort-icon">{{ sortKey === 'dashboards' ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
                        </th>
                        <th>資料檔案</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="c in filtered" :key="c.id">
                        <td class="id-cell">{{ c.id }}</td>
                        <td>{{ c.name }}</td>
                        <td class="muted">{{ c.source }}</td>
                        <td>
                            <span v-for="t in c.chart_types" :key="t" class="tag">{{ t }}</span>
                        </td>
                        <td>
                            <span v-for="d in c.dashboards" :key="d" class="tag tag-dash">{{ d }}</span>
                        </td>
                        <td>
                            <span :class="['file-dot', c.has_chart_file ? 'green' : 'red']" title="chartData">圖</span>
                            <span v-if="c.history_data" :class="['file-dot', c.has_history_file ? 'green' : 'red']" title="historyData">歷</span>
                        </td>
                        <td class="action-cell">
                            <button class="btn-edit" @click="$emit('select', c)">管理</button>
                            <button
                                class="btn-del"
                                :disabled="deleting === c.id"
                                @click="confirmDelete(c)"
                            >{{ deleting === c.id ? '…' : '刪除' }}</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style scoped lang="scss">
.comp-list {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.comp-list-toolbar {
    display: flex;
    gap: 0.75rem;
}

.search-input,
.dash-select {
    background: #1a1c1e;
    border: 1px solid #444;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    color: #fff;
    font-size: 0.875rem;

    &:focus { outline: none; border-color: #5b8cfa; }
}

.search-input { flex: 1; }

.loading { color: #888; text-align: center; padding: 2rem; }

.comp-table-wrap {
    overflow-y: auto;
    flex: 1;
    border: 1px solid #3a3c3e;
    border-radius: 8px;
}

.comp-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;

    th {
        background: #2e3032;
        color: #aaa;
        font-weight: 500;
        padding: 0.6rem 0.75rem;
        text-align: left;
        position: sticky;
        top: 0;
        white-space: nowrap;
        user-select: none;
    }

    th.sortable {
        cursor: pointer;
        &:hover { color: #ddd; background: #383a3c; }
    }

    td {
        padding: 0.55rem 0.75rem;
        border-bottom: 1px solid #2e3032;
        color: #ddd;
        vertical-align: middle;
    }

    tr:hover td { background: #2a2c2e; }
}

.sort-icon { color: #555; font-size: 0.75rem; margin-left: 0.25rem; }

.id-cell { color: #5b8cfa; font-family: monospace; }
.muted { color: #888; }

.tag {
    display: inline-block;
    background: #3a3c3e;
    color: #ccc;
    border-radius: 4px;
    padding: 0.1rem 0.4rem;
    font-size: 0.75rem;
    margin: 1px;
}

.tag-dash { background: #2d3e5a; color: #7ab3ff; }

.file-dot {
    display: inline-block;
    width: 22px;
    height: 22px;
    line-height: 22px;
    text-align: center;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 600;
    margin-right: 3px;

    &.green { background: #1e3a2a; color: #4ade80; }
    &.red   { background: #3a1e1e; color: #f87171; }
}

.action-cell { white-space: nowrap; }

.btn-edit {
    background: #2d3e5a;
    color: #7ab3ff;
    border: none;
    border-radius: 5px;
    padding: 0.3rem 0.75rem;
    font-size: 0.8rem;
    cursor: pointer;
    transition: background 0.15s;
    margin-right: 0.4rem;

    &:hover { background: #3a4f70; }
}

.btn-del {
    background: #3a1e1e;
    color: #f87171;
    border: none;
    border-radius: 5px;
    padding: 0.3rem 0.75rem;
    font-size: 0.8rem;
    cursor: pointer;
    transition: background 0.15s;

    &:hover:not(:disabled) { background: #5a2e2e; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.delete-error {
    background: #3a1e1e;
    color: #f87171;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
}
</style>
