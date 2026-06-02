<script setup>
import { ref, onMounted } from "vue";

const props = defineProps({ token: String });

const links = ref([]);
const saving = ref(false);
const message = ref("");

async function load() {
    const res = await fetch("/api/quicklinks");
    if (res.ok) links.value = await res.json();
}

function addRow() {
    links.value.push({ label: "", url: "" });
}

function removeRow(i) {
    links.value.splice(i, 1);
}

function moveUp(i) {
    if (i === 0) return;
    [links.value[i - 1], links.value[i]] = [links.value[i], links.value[i - 1]];
}

function moveDown(i) {
    if (i === links.value.length - 1) return;
    [links.value[i + 1], links.value[i]] = [links.value[i], links.value[i + 1]];
}

async function save() {
    saving.value = true;
    message.value = "";
    try {
        const res = await fetch("/api/quicklinks", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${props.token}`,
            },
            body: JSON.stringify(links.value),
        });
        const d = await res.json();
        message.value = res.ok ? `✅ 已儲存 ${d.count} 個連結` : `❌ ${d.detail || "儲存失敗"}`;
    } catch {
        message.value = "❌ 網路錯誤";
    }
    saving.value = false;
}

onMounted(load);
</script>

<template>
    <div class="ql-wrap">
        <div class="panel-head">
            <h2>快速連結管理</h2>
            <p class="panel-desc">設定 NavBar 上方的黃色快捷按鈕，修改後立即生效（無需重新 Build）</p>
        </div>

        <div class="ql-table">
            <div class="ql-row ql-header">
                <span class="ql-order">順序</span>
                <span class="ql-label">按鈕名稱</span>
                <span class="ql-url">連結網址</span>
                <span class="ql-actions">操作</span>
            </div>

            <div v-for="(link, i) in links" :key="i" class="ql-row">
                <div class="ql-order">
                    <button class="icon-btn" @click="moveUp(i)" :disabled="i === 0" title="上移">▲</button>
                    <button class="icon-btn" @click="moveDown(i)" :disabled="i === links.length - 1" title="下移">▼</button>
                </div>
                <input class="ql-input" v-model="link.label" placeholder="按鈕名稱" />
                <input class="ql-input ql-url-input" v-model="link.url" placeholder="https://..." />
                <button class="icon-btn danger" @click="removeRow(i)" title="刪除">✕</button>
            </div>

            <div class="ql-row ql-add-row">
                <button class="tab" @click="addRow">＋ 新增按鈕</button>
            </div>
        </div>

        <div class="ql-footer">
            <span class="save-msg">{{ message }}</span>
            <button class="tab primary" :disabled="saving" @click="save">
                {{ saving ? "儲存中…" : "💾 儲存" }}
            </button>
        </div>
    </div>
</template>

<style scoped>
.ql-wrap { padding: 0 1.5rem 2rem; }

.ql-table {
    border: 1px solid #2a2c2e;
    border-radius: 8px;
    overflow: hidden;
    margin-top: 1rem;
}

.ql-row {
    display: grid;
    grid-template-columns: 70px 1fr 2fr 48px;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid #1e2022;
}
.ql-row:last-child { border-bottom: none; }

.ql-header {
    background: #14161a;
    font-size: 12px;
    color: #666;
    font-weight: 600;
    padding: 10px 12px;
}

.ql-order {
    display: flex;
    gap: 2px;
    align-items: center;
}

.ql-input {
    width: 100%;
    background: #0e1012;
    border: 1px solid #2a2c2e;
    border-radius: 5px;
    color: #ddd;
    padding: 6px 10px;
    font-size: 13px;
    outline: none;
    transition: border-color .15s;
}
.ql-input:focus { border-color: #555; }

.ql-add-row {
    grid-template-columns: 1fr;
    padding: 10px 12px;
    background: #0c0e10;
}

.icon-btn {
    width: 26px;
    height: 26px;
    background: #1a1c1e;
    border: 1px solid #2a2c2e;
    border-radius: 4px;
    color: #888;
    font-size: 11px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all .15s;
}
.icon-btn:hover:not(:disabled) { background: #2a2c2e; color: #fff; }
.icon-btn:disabled { opacity: 0.25; cursor: default; }
.icon-btn.danger:hover { background: #7f1d1d; color: #fca5a5; border-color: #991b1b; }

.ql-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 16px;
}

.save-msg { font-size: 13px; color: #aaa; }

.tab {
    padding: 6px 16px;
    border-radius: 6px;
    background: #2a2c2e;
    color: #ccc;
    font-size: 13px;
    cursor: pointer;
    border: 1px solid #3a3c3e;
    transition: all .15s;
}
.tab:hover { background: #3a3c3e; color: #fff; }
.tab.primary { background: #1d4ed8; border-color: #2563eb; color: #fff; }
.tab.primary:hover { background: #2563eb; }
.tab:disabled { opacity: 0.4; cursor: default; }
</style>
