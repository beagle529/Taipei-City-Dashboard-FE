<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps(["token", "dashboard", "allComponents"]);
const emit = defineEmits(["back", "saved"]);

const form = ref({ name: "", icon: "", components: [] });
const saving = ref(false);
const status = ref(null);
const search = ref("");
const isNew = computed(() => !props.dashboard?.index);

const ICONS = [
    "dashboard","bar_chart","pie_chart","show_chart","analytics","monitoring",
    "factory","agriculture","store","business","corporate_fare","warehouse",
    "people","groups","person","manage_accounts","admin_panel_settings",
    "security","health_and_safety","local_hospital","science","biotech",
    "eco","forest","water","energy_savings_leaf","solar_power",
    "directions_car","train","pedal_bike","local_shipping","flight",
    "construction","build","engineering","architecture","real_estate_agent",
    "favorite","star","bookmark","flag","notifications","campaign",
    "public","map","location_city","terrain","explore",
    "school","menu_book","library_books","calculate","psychology",
    "mic","forum","chat","mail","phone","video_call",
    "bug_report","code","terminal","database","cloud","storage",
    "crib","handshake","diversity_3","volunteer_activism","home",
];

watch(() => props.dashboard, (d) => {
    status.value = null;
    search.value = "";
    if (d) {
        form.value = {
            name: d.name || "",
            icon: d.icon || "dashboard",
            components: [...(d.components || [])],
        };
    } else {
        form.value = { name: "", icon: "dashboard", components: [] };
    }
}, { immediate: true });

const filteredComponents = computed(() => {
    const q = search.value.toLowerCase();
    if (!q) return props.allComponents || [];
    return (props.allComponents || []).filter(c =>
        c.name.toLowerCase().includes(q) || String(c.id).includes(q)
    );
});

function toggleComponent(id) {
    const sid = String(id);
    const idx = form.value.components.indexOf(sid);
    if (idx === -1) form.value.components.push(sid);
    else form.value.components.splice(idx, 1);
}

function removeComponent(id) {
    form.value.components = form.value.components.filter(c => c !== String(id));
}

function moveUp(i) {
    if (i === 0) return;
    const arr = form.value.components;
    [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
}
function moveDown(i) {
    const arr = form.value.components;
    if (i === arr.length - 1) return;
    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
}

function compName(id) {
    const c = (props.allComponents || []).find(c => String(c.id) === String(id));
    return c ? c.name : `ID ${id}`;
}

async function save() {
    if (!form.value.name.trim()) {
        status.value = { type: "error", message: "儀表板名稱不能為空" };
        return;
    }
    saving.value = true;
    status.value = null;

    const method = isNew.value ? "POST" : "PATCH";
    const url = isNew.value
        ? "/api/dashboards"
        : `/api/dashboards/${props.dashboard.index}`;

    const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${props.token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form.value),
    });
    saving.value = false;
    if (!res.ok) {
        const text = await res.text();
        let msg = `伺服器錯誤 (${res.status})`;
        try { msg = JSON.parse(text).detail || msg; } catch {}
        status.value = { type: "error", message: msg };
    } else {
        status.value = { type: "success", message: isNew.value ? "已新增儀表板" : "已儲存" };
        emit("saved");
    }
}
</script>

<template>
    <div class="dash-edit">
        <div class="edit-header">
            <button class="btn-back" @click="$emit('back')">← 返回</button>
            <h3>{{ isNew ? "新增儀表板" : `編輯：${dashboard.name}` }}</h3>
        </div>

        <!-- Basic info -->
        <div class="section-card">
            <h4>基本資訊</h4>
            <div class="form-row">
                <label>名稱</label>
                <input v-model="form.name" type="text" placeholder="儀表板名稱" />
            </div>
            <div class="form-row">
                <label>圖示</label>
                <div class="icon-picker">
                    <div class="icon-preview">
                        <span class="material-icon">{{ form.icon }}</span>
                        <span class="icon-name">{{ form.icon }}</span>
                    </div>
                    <div class="icon-grid">
                        <button
                            v-for="ic in ICONS" :key="ic"
                            :class="['icon-btn', form.icon === ic ? 'active' : '']"
                            :title="ic"
                            @click="form.icon = ic"
                        ><span class="material-icon">{{ ic }}</span></button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Components -->
        <div class="section-card">
            <h4>組件列表 <span class="count-badge">{{ form.components.length }} 個</span></h4>

            <!-- Selected components with reorder -->
            <div v-if="form.components.length" class="selected-list">
                <div v-for="(cid, i) in form.components" :key="cid" class="selected-item">
                    <span class="sel-order">{{ i + 1 }}</span>
                    <span class="sel-name">{{ compName(cid) }}</span>
                    <span class="sel-id">{{ cid }}</span>
                    <div class="sel-actions">
                        <button @click="moveUp(i)" :disabled="i === 0" title="上移">↑</button>
                        <button @click="moveDown(i)" :disabled="i === form.components.length - 1" title="下移">↓</button>
                        <button class="btn-remove" @click="removeComponent(cid)" title="移除">✕</button>
                    </div>
                </div>
            </div>
            <p v-else class="empty-hint">尚未加入任何組件</p>

            <!-- Add components -->
            <div class="add-section">
                <div class="add-header">
                    <span>加入組件</span>
                    <input v-model="search" type="text" placeholder="搜尋組件名稱或 ID…" class="search-input" />
                </div>
                <div class="comp-grid">
                    <button
                        v-for="c in filteredComponents" :key="c.id"
                        :class="['comp-btn', form.components.includes(String(c.id)) ? 'selected' : '']"
                        @click="toggleComponent(c.id)"
                    >
                        <span class="cb-check">{{ form.components.includes(String(c.id)) ? '✓' : '+' }}</span>
                        <span class="cb-id">{{ c.id }}</span>
                        <span class="cb-name">{{ c.name }}</span>
                    </button>
                </div>
            </div>
        </div>

        <div v-if="status" :class="['status-msg', status.type]">{{ status.message }}</div>
        <button class="btn-save" :disabled="saving" @click="save">
            {{ saving ? "儲存中…" : (isNew ? "建立儀表板" : "儲存變更") }}
        </button>
    </div>
</template>

<style scoped lang="scss">
.dash-edit {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding-bottom: 1.5rem;
}

.edit-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    h3 { color: #fff; margin: 0; font-size: 1.05rem; }
}

.btn-back {
    background: none; border: 1px solid #444; color: #aaa;
    border-radius: 6px; padding: 0.4rem 0.8rem; cursor: pointer; font-size: 0.875rem;
    white-space: nowrap;
    &:hover { border-color: #aaa; color: #fff; }
}

.section-card {
    background: #1f2123;
    border: 1px solid #3a3c3e;
    border-radius: 8px;
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;

    h4 { color: #ddd; margin: 0; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; }
}

.count-badge {
    background: #2d3e5a; color: #7ab3ff;
    border-radius: 10px; padding: 0.1rem 0.5rem; font-size: 0.72rem; font-weight: 400;
}

.form-row {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    label { color: #888; font-size: 0.8rem; }
    input {
        background: #1a1c1e; border: 1px solid #444; border-radius: 6px;
        padding: 0.5rem 0.75rem; color: #fff; font-size: 0.9rem;
        &:focus { outline: none; border-color: #5b8cfa; }
    }
}

.icon-picker { display: flex; flex-direction: column; gap: 0.6rem; }

.icon-preview {
    display: flex; align-items: center; gap: 0.6rem;
    background: #1a1c1e; border-radius: 6px; padding: 0.5rem 0.75rem;
    .material-icon { font-family: 'Material Icons Round'; font-size: 1.4rem; color: #7ab3ff; }
    .icon-name { color: #888; font-size: 0.78rem; font-family: monospace; }
}

.icon-grid {
    display: flex; flex-wrap: wrap; gap: 0.3rem;
    max-height: 160px; overflow-y: auto;
    padding: 0.25rem;
}

.icon-btn {
    background: #1a1c1e; border: 1px solid #3a3c3e;
    border-radius: 5px; padding: 0.3rem; cursor: pointer;
    transition: all 0.15s;
    .material-icon { font-family: 'Material Icons Round'; font-size: 1.2rem; color: #888; }
    &:hover { border-color: #5b8cfa; .material-icon { color: #7ab3ff; } }
    &.active { border-color: #5b8cfa; background: #1e2a40; .material-icon { color: #7ab3ff; } }
}

.selected-list {
    display: flex; flex-direction: column; gap: 0.3rem;
    max-height: 200px; overflow-y: auto;
}

.selected-item {
    display: flex; align-items: center; gap: 0.5rem;
    background: #282a2c; border-radius: 5px; padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
}

.sel-order { color: #555; min-width: 1.2rem; text-align: right; font-size: 0.72rem; }
.sel-name { flex: 1; color: #ccc; }
.sel-id { color: #5b8cfa; font-family: monospace; font-size: 0.72rem; }

.sel-actions {
    display: flex; gap: 0.2rem;
    button {
        background: #333; border: none; border-radius: 3px;
        color: #888; cursor: pointer; padding: 0.1rem 0.35rem; font-size: 0.75rem;
        &:hover:not(:disabled) { background: #444; color: #fff; }
        &:disabled { opacity: 0.3; cursor: not-allowed; }
    }
    .btn-remove:hover { background: #5a1e1e !important; color: #f87171 !important; }
}

.empty-hint { color: #555; font-size: 0.8rem; margin: 0; }

.add-section {
    border-top: 1px solid #3a3c3e;
    padding-top: 0.9rem;
    display: flex; flex-direction: column; gap: 0.6rem;
}

.add-header {
    display: flex; align-items: center; gap: 0.75rem;
    span { color: #888; font-size: 0.8rem; white-space: nowrap; }
}

.search-input {
    flex: 1; background: #1a1c1e; border: 1px solid #3a3c3e; border-radius: 5px;
    padding: 0.35rem 0.65rem; color: #ccc; font-size: 0.8rem;
    &:focus { outline: none; border-color: #5b8cfa; }
}

.comp-grid {
    display: flex; flex-direction: column; gap: 0.2rem;
    max-height: 240px; overflow-y: auto;
}

.comp-btn {
    display: flex; align-items: center; gap: 0.5rem;
    background: #1a1c1e; border: 1px solid #2a2c2e;
    border-radius: 5px; padding: 0.35rem 0.6rem; cursor: pointer;
    text-align: left; transition: all 0.12s;

    &:hover { border-color: #5b8cfa; background: #1e2232; }
    &.selected { border-color: #2d4a2d; background: #1a2a1a; }
}

.cb-check { font-size: 0.75rem; width: 1rem; color: #555; flex-shrink: 0; }
.comp-btn.selected .cb-check { color: #4ade80; }
.cb-id { color: #5b8cfa; font-family: monospace; font-size: 0.72rem; min-width: 2.5rem; }
.cb-name { color: #ccc; font-size: 0.8rem; }

.status-msg {
    border-radius: 6px; padding: 0.6rem 0.75rem; font-size: 0.875rem;
    &.success { background: #1e3a2a; color: #4ade80; }
    &.error { background: #3a1e1e; color: #f87171; }
}

.btn-save {
    align-self: flex-start;
    background: #5b8cfa; color: #fff; border: none; border-radius: 6px;
    padding: 0.5rem 1.5rem; cursor: pointer; font-size: 0.875rem;
    &:hover:not(:disabled) { background: #4a7be8; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.material-icon { font-family: 'Material Icons Round'; }
</style>
