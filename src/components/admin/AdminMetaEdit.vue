<script setup>
import { ref, watch } from "vue";

const props = defineProps(["token", "component"]);
const emit = defineEmits(["updated", "back"]);

const form = ref({});
const saving = ref(false);
const loading = ref(false);
const status = ref(null);

watch(
    () => props.component,
    async (c) => {
        status.value = null;
        loading.value = true;
        // Fetch full component detail (list endpoint omits long_desc etc.)
        const res = await fetch(`/api/components/${c.id}`, {
            headers: { Authorization: `Bearer ${props.token}` },
        });
        loading.value = false;
        const full = res.ok ? await res.json() : {};
        form.value = {
            name: full.name ?? c.name ?? "",
            source: full.source ?? c.source ?? "",
            short_desc: full.short_desc ?? c.short_desc ?? "",
            long_desc: full.long_desc ?? "",
            use_case: full.use_case ?? "",
        };
    },
    { immediate: true }
);

async function save() {
    saving.value = true;
    status.value = null;
    const res = await fetch(`/api/components/${props.component.id}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${props.token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(form.value),
    });
    saving.value = false;
    if (!res.ok) {
        const text = await res.text();
        let msg = `伺服器錯誤 (${res.status})`;
        try { msg = JSON.parse(text).detail || msg; } catch {}
        status.value = { type: "error", message: msg };
    } else {
        status.value = { type: "success", message: "已儲存" };
        emit("updated");
    }
}
</script>

<template>
    <div class="meta-edit">
        <div class="meta-header">
            <button class="btn-back" @click="$emit('back')">← 返回列表</button>
            <div>
                <h3>編輯組件資料 — {{ component.name }}</h3>
                <span class="comp-id">ID: {{ component.id }}</span>
            </div>
        </div>

        <div v-if="loading" class="loading-hint">載入中...</div>

        <div v-else class="form">
            <div class="form-group">
                <label>名稱</label>
                <input v-model="form.name" type="text" />
            </div>
            <div class="form-group">
                <label>資料來源</label>
                <input v-model="form.source" type="text" />
            </div>
            <div class="form-group">
                <label>簡短說明（short_desc）</label>
                <input v-model="form.short_desc" type="text" />
            </div>
            <div class="form-group">
                <label>組件說明（long_desc）</label>
                <textarea v-model="form.long_desc" rows="4" />
            </div>
            <div class="form-group">
                <label>使用情境（use_case）</label>
                <textarea v-model="form.use_case" rows="3" />
            </div>
            <div v-if="status" :class="['status-msg', status.type]">{{ status.message }}</div>
            <button class="btn-save" :disabled="saving" @click="save">
                {{ saving ? "儲存中..." : "儲存" }}
            </button>
        </div>
    </div>
</template>

<style scoped lang="scss">
.meta-edit { display: flex; flex-direction: column; gap: 1.25rem; padding-right: 0.25rem; padding-bottom: 1rem; }

.meta-header {
    display: flex;
    align-items: center;
    gap: 1rem;

    h3 { color: #fff; margin: 0; font-size: 1.1rem; }
}

.comp-id { color: #5b8cfa; font-size: 0.8rem; font-family: monospace; }

.btn-back {
    background: none;
    border: 1px solid #444;
    color: #aaa;
    border-radius: 6px;
    padding: 0.4rem 0.8rem;
    cursor: pointer;
    font-size: 0.875rem;
    white-space: nowrap;

    &:hover { border-color: #aaa; color: #fff; }
}

.form {
    background: #1f2123;
    border: 1px solid #3a3c3e;
    border-radius: 8px;
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 560px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    label { color: #aaa; font-size: 0.875rem; }

    input, textarea {
        background: #1a1c1e;
        border: 1px solid #444;
        border-radius: 6px;
        padding: 0.55rem 0.75rem;
        color: #fff;
        font-size: 0.9rem;
        font-family: inherit;
        resize: vertical;

        &:focus { outline: none; border-color: #5b8cfa; }
    }
}

.loading-hint { color: #666; font-size: 0.875rem; padding: 1rem 0; }

.status-msg {
    border-radius: 6px;
    padding: 0.6rem 0.75rem;
    font-size: 0.875rem;

    &.success { background: #1e3a2a; color: #4ade80; }
    &.error   { background: #3a1e1e; color: #f87171; }
}

.btn-save {
    align-self: flex-start;
    background: #5b8cfa;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1.5rem;
    cursor: pointer;
    font-size: 0.875rem;

    &:hover:not(:disabled) { background: #4a7be8; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
}
</style>
