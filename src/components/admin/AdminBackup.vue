<script setup>
import { ref, onMounted } from "vue";

const props = defineProps(["token", "isSuper"]);
const backups = ref([]);
const loading = ref(true);
const creating = ref(false);
const status = ref(null);

async function load() {
    loading.value = true;
    const res = await fetch("/api/backup", { headers: { Authorization: `Bearer ${props.token}` } });
    if (res.ok) { const d = await res.json(); backups.value = d.data || []; }
    loading.value = false;
}

async function createBackup() {
    creating.value = true;
    status.value = null;
    const res = await fetch("/api/backup", {
        method: "POST",
        headers: { Authorization: `Bearer ${props.token}` },
    });
    creating.value = false;
    if (!res.ok) {
        const t = await res.text();
        let msg = `錯誤 (${res.status})`;
        try { msg = JSON.parse(t).detail || msg; } catch {}
        status.value = { type: "error", message: msg };
    } else {
        const d = await res.json();
        status.value = { type: "success", message: d.message };
        await load();
    }
}

function downloadUrl(filename) {
    return `/api/backup/download/${filename}`;
}

onMounted(load);
</script>

<template>
    <div class="backup-panel">
        <div class="bp-header">
            <div>
                <h4>資料備份</h4>
                <p>備份包含 chartData/、historyData/、all_components.json、all_dashboards.json、all_contributors.json、market_price_history.json、quicklinks.json</p>
                <p class="backup-location">📁 備份固定位置：<code>backend/data/backups/</code>（每個 zip 內含 RESTORE_INFO.json 還原說明）</p>
            </div>
            <button v-if="isSuper" class="btn-backup" :disabled="creating" @click="createBackup">
                {{ creating ? "備份中…" : "立即備份" }}
            </button>
        </div>

        <div v-if="status" :class="['status-msg', status.type]">{{ status.message }}</div>

        <div v-if="loading" class="loading">載入中…</div>
        <div v-else-if="!backups.length" class="empty">尚無備份紀錄</div>
        <div v-else class="backup-list">
            <div class="bl-header">
                <span>時間</span>
                <span>版本</span>
                <span>大小</span>
                <span>建立者</span>
                <span>內容</span>
                <span>操作</span>
            </div>
            <div v-for="b in backups" :key="b.id" :class="['bl-row', b.exists ? '' : 'missing']">
                <span class="bl-ts">{{ b.timestamp }}</span>
                <span class="bl-ver">{{ b.version || '—' }}</span>
                <span class="bl-size">{{ b.size_kb }} KB</span>
                <span class="bl-by">{{ b.created_by || '—' }}</span>
                <span class="bl-files">
                    <span v-for="f in b.files" :key="f" class="file-chip">{{ f }}</span>
                </span>
                <span class="bl-action">
                    <a
                        v-if="b.exists && isSuper"
                        :href="downloadUrl(b.filename)"
                        class="btn-dl"
                        :download="b.filename"
                    >下載</a>
                    <span v-else-if="!b.exists" class="missing-label">檔案已遺失</span>
                </span>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.backup-panel { display: flex; flex-direction: column; gap: 1rem; }

.bp-header {
    display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
    h4 { color: #ddd; margin: 0 0 0.25rem; font-size: 0.9rem; }
    p { color: #666; font-size: 0.78rem; margin: 0 0 0.15rem; }
    .backup-location { color: #4a7be8; font-size: 0.75rem; margin-top: 0.2rem;
        code { background: #1e2530; padding: 0.1rem 0.35rem; border-radius: 3px; font-size: 0.72rem; }
    }
}

.btn-backup {
    background: #5b8cfa; color: #fff; border: none; border-radius: 6px;
    padding: 0.45rem 1.1rem; cursor: pointer; font-size: 0.875rem; white-space: nowrap;
    flex-shrink: 0;
    &:hover:not(:disabled) { background: #4a7be8; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.loading, .empty { color: #555; font-size: 0.875rem; padding: 0.5rem 0; }

.backup-list {
    border: 1px solid #3a3c3e; border-radius: 8px; overflow: hidden;
}

.bl-header, .bl-row {
    display: grid;
    grid-template-columns: 155px 70px 65px 80px 1fr 80px;
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    gap: 0.75rem;
    align-items: center;
}

.bl-header {
    background: #282a2c; color: #666;
    border-bottom: 1px solid #3a3c3e;
}

.bl-row {
    border-bottom: 1px solid #2a2c2e; color: #aaa;
    &:last-child { border-bottom: none; }
    &.missing { opacity: 0.4; }
}

.bl-ts  { color: #ccc; font-family: monospace; font-size: 0.78rem; }
.bl-ver { color: #f59e0b; font-family: monospace; font-size: 0.75rem; font-weight: 600; }
.bl-size { color: #888; }
.bl-by  { color: #5b8cfa; font-family: monospace; font-size: 0.75rem; }

.bl-files { display: flex; flex-wrap: wrap; gap: 0.25rem; }
.file-chip {
    background: #2a2c2e; border-radius: 3px;
    padding: 0.05rem 0.4rem; font-size: 0.7rem; color: #888;
}

.btn-dl {
    background: #1e3a2a; color: #4ade80; border-radius: 4px;
    padding: 0.2rem 0.6rem; font-size: 0.75rem; text-decoration: none;
    &:hover { background: #2a4a38; }
}

.missing-label { color: #f59e0b; font-size: 0.72rem; }

.status-msg {
    border-radius: 6px; padding: 0.6rem 0.75rem; font-size: 0.8rem;
    &.success { background: #1e3a2a; color: #4ade80; }
    &.error { background: #3a1e1e; color: #f87171; }
}
</style>
