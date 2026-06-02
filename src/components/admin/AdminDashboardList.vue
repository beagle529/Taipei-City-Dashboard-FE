<script setup>
import { ref, onMounted } from "vue";

const props = defineProps(["token", "isSuper"]);
const emit = defineEmits(["edit"]);

const dashboards = ref([]);
const loading = ref(true);
const togglingIndex = ref(null);
const deleteModal = ref(null); // { dashboard, step: 1|2, inputName: '' }
const deleteError = ref("");
const deleting = ref(false);

async function load() {
    loading.value = true;
    const res = await fetch("/api/dashboards", { headers: { Authorization: `Bearer ${props.token}` } });
    if (res.ok) { const d = await res.json(); dashboards.value = d.data || []; }
    loading.value = false;
}

async function toggleHidden(d) {
    togglingIndex.value = d.index;
    await fetch(`/api/dashboards/${d.index}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${props.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: !d.hidden }),
    });
    togglingIndex.value = null;
    await load();
}

function startDelete(d) {
    deleteModal.value = { dashboard: d, step: 1, inputName: "" };
    deleteError.value = "";
}

function confirmStep1() {
    if (deleteModal.value.inputName !== deleteModal.value.dashboard.name) {
        deleteError.value = "名稱不符，請重新輸入";
        return;
    }
    deleteModal.value.step = 2;
    deleteError.value = "";
}

async function confirmStep2() {
    deleting.value = true;
    deleteError.value = "";
    const { dashboard } = deleteModal.value;
    const res = await fetch(
        `/api/dashboards/${dashboard.index}?confirm_name=${encodeURIComponent(dashboard.name)}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${props.token}` } }
    );
    deleting.value = false;
    if (!res.ok) {
        const t = await res.text();
        let msg = `錯誤 (${res.status})`;
        try { msg = JSON.parse(t).detail || msg; } catch {}
        deleteError.value = msg;
    } else {
        deleteModal.value = null;
        await load();
    }
}

onMounted(load);
</script>

<template>
    <div class="dash-list">
        <div v-if="loading" class="loading">載入中…</div>
        <template v-else>
            <div v-for="d in dashboards" :key="d.index" :class="['dash-row', d.hidden ? 'is-hidden' : '']">
                <span class="dash-icon material-icon">{{ d.icon }}</span>
                <div class="dash-info">
                    <span class="dash-name">{{ d.name }}</span>
                    <span v-if="d.hidden" class="hidden-badge">已隱藏</span>
                    <span class="dash-meta">{{ d.components?.length || 0 }} 個組件　index: {{ d.index }}</span>
                </div>
                <div class="dash-actions">
                    <button class="btn-edit" @click="$emit('edit', d)">編輯</button>
                    <button
                        :class="['btn-toggle', d.hidden ? 'btn-show' : 'btn-hide']"
                        :disabled="togglingIndex === d.index"
                        @click="toggleHidden(d)"
                    >{{ d.hidden ? '顯示' : '隱藏' }}</button>
                    <button
                        v-if="isSuper"
                        class="btn-delete"
                        @click="startDelete(d)"
                    >永久刪除</button>
                </div>
            </div>
        </template>

        <!-- Delete confirmation modal -->
        <Teleport to="body">
            <div v-if="deleteModal" class="modal-overlay" @click.self="deleteModal = null">
                <div class="modal-box">
                    <!-- Step 1: type name -->
                    <template v-if="deleteModal.step === 1">
                        <div class="modal-title danger">⚠ 永久刪除儀表板</div>
                        <p class="modal-desc">
                            此操作<strong>無法復原</strong>。要刪除
                            <span class="dash-name-hl">「{{ deleteModal.dashboard.name }}」</span>，
                            請在下方輸入儀表板名稱以確認：
                        </p>
                        <input
                            v-model="deleteModal.inputName"
                            type="text"
                            :placeholder="deleteModal.dashboard.name"
                            class="confirm-input"
                            @keyup.enter="confirmStep1"
                        />
                        <p v-if="deleteError" class="modal-error">{{ deleteError }}</p>
                        <div class="modal-actions">
                            <button class="btn-modal-cancel" @click="deleteModal = null">取消</button>
                            <button class="btn-modal-next" @click="confirmStep1">下一步</button>
                        </div>
                    </template>

                    <!-- Step 2: final confirmation -->
                    <template v-else>
                        <div class="modal-title danger">最後確認</div>
                        <p class="modal-desc">
                            你確定要<strong>永久刪除</strong>
                            <span class="dash-name-hl">「{{ deleteModal.dashboard.name }}」</span>？<br>
                            這個儀表板及其所有設定將會被移除，此操作無法撤回。
                        </p>
                        <p v-if="deleteError" class="modal-error">{{ deleteError }}</p>
                        <div class="modal-actions">
                            <button class="btn-modal-cancel" @click="deleteModal = null">取消</button>
                            <button class="btn-modal-delete" :disabled="deleting" @click="confirmStep2">
                                {{ deleting ? "刪除中…" : "確認永久刪除" }}
                            </button>
                        </div>
                    </template>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<style scoped lang="scss">
.dash-list { display: flex; flex-direction: column; gap: 0.4rem; }
.loading { color: #666; font-size: 0.875rem; padding: 1rem 0; }

.dash-row {
    display: flex; align-items: center; gap: 1rem;
    background: #1f2123; border: 1px solid #3a3c3e;
    border-radius: 8px; padding: 0.75rem 1rem;
    transition: all 0.15s;
    &:hover { border-color: #555; }
    &.is-hidden { opacity: 0.5; border-style: dashed; }
}

.dash-icon { font-family: 'Material Icons Round'; font-size: 1.4rem; color: #7ab3ff; flex-shrink: 0; }
.dash-info { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
.dash-name { color: #ddd; font-size: 0.9rem; }
.dash-meta { color: #555; font-size: 0.75rem; font-family: monospace; }

.hidden-badge {
    background: #3a2a10; color: #f59e0b;
    border-radius: 4px; padding: 0.1rem 0.4rem; font-size: 0.7rem; align-self: flex-start;
}

.dash-actions { display: flex; gap: 0.4rem; flex-shrink: 0; }

.btn-edit, .btn-toggle, .btn-delete, .btn-hide, .btn-show {
    border: none; border-radius: 5px; padding: 0.3rem 0.7rem;
    cursor: pointer; font-size: 0.78rem; transition: background 0.15s;
    &:disabled { opacity: 0.5; cursor: not-allowed; }
}
.btn-edit  { background: #2d3e5a; color: #7ab3ff; &:hover { background: #3a5070; } }
.btn-hide  { background: #2a2c2e; color: #888;    &:hover { background: #3a3c3e; color: #fff; } }
.btn-show  { background: #1e3a2a; color: #4ade80; &:hover { background: #2a4a38; } }
.btn-delete { background: #3a1e1e; color: #f87171; &:hover { background: #5a2a2a; } }

.material-icon { font-family: 'Material Icons Round'; }
</style>

<style lang="scss">
.modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7);
    display: flex; align-items: center; justify-content: center; z-index: 9000;
}

.modal-box {
    background: #282a2c; border: 1px solid #4a4c50;
    border-radius: 12px; padding: 1.75rem 2rem;
    width: 440px; max-width: 90vw;
    display: flex; flex-direction: column; gap: 1rem;
}

.modal-title {
    font-size: 1.05rem; font-weight: 600; color: #ddd;
    &.danger { color: #f87171; }
}

.modal-desc {
    color: #aaa; font-size: 0.875rem; line-height: 1.6; margin: 0;
    strong { color: #f87171; }
}

.dash-name-hl { color: #f59e0b; font-weight: 500; }

.confirm-input {
    background: #1a1c1e; border: 1px solid #555; border-radius: 6px;
    padding: 0.55rem 0.75rem; color: #fff; font-size: 0.9rem; width: 100%; box-sizing: border-box;
    &:focus { outline: none; border-color: #f87171; }
}

.modal-error { color: #f87171; font-size: 0.8rem; margin: 0; }

.modal-actions { display: flex; justify-content: flex-end; gap: 0.6rem; }

.btn-modal-cancel, .btn-modal-next, .btn-modal-delete {
    border: none; border-radius: 6px; padding: 0.45rem 1.1rem;
    cursor: pointer; font-size: 0.875rem; transition: background 0.15s;
}
.btn-modal-cancel { background: #3a3c3e; color: #aaa; &:hover { background: #4a4c50; color: #fff; } }
.btn-modal-next   { background: #5b8cfa; color: #fff; &:hover { background: #4a7be8; } }
.btn-modal-delete {
    background: #c0392b; color: #fff;
    &:hover:not(:disabled) { background: #e74c3c; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
}
</style>
