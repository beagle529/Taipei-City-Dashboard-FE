<script setup>
import { ref, onMounted } from "vue";

const props = defineProps(["token"]);

const users = ref([]);
const loading = ref(true);
const form = ref({ username: "", password: "", display_name: "" });
const editTarget = ref(null); // { username, display_name }
const editForm = ref({ password: "", display_name: "" });
const submitting = ref(false);
const status = ref(null);
const deletingUser = ref(null);
const showAddForm = ref(false);

async function load() {
    loading.value = true;
    const res = await fetch("/api/admin-users", { headers: { Authorization: `Bearer ${props.token}` } });
    if (res.ok) { const d = await res.json(); users.value = d.data || []; }
    loading.value = false;
}

async function addUser() {
    if (!form.value.username.trim() || !form.value.password.trim()) {
        status.value = { type: "error", message: "帳號與密碼不能為空" };
        return;
    }
    submitting.value = true;
    status.value = null;
    const res = await fetch("/api/admin-users", {
        method: "POST",
        headers: { Authorization: `Bearer ${props.token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form.value),
    });
    submitting.value = false;
    if (!res.ok) {
        const t = await res.text();
        let msg = `錯誤 (${res.status})`;
        try { msg = JSON.parse(t).detail || msg; } catch {}
        status.value = { type: "error", message: msg };
    } else {
        status.value = { type: "success", message: (await res.json()).message };
        form.value = { username: "", password: "", display_name: "" };
        showAddForm.value = false;
        await load();
    }
}

function startEdit(user) {
    editTarget.value = user;
    editForm.value = { password: "", display_name: user.display_name };
    status.value = null;
}

async function saveEdit() {
    const body = {};
    if (editForm.value.password) body.password = editForm.value.password;
    if (editForm.value.display_name !== editTarget.value.display_name)
        body.display_name = editForm.value.display_name;
    if (!Object.keys(body).length) { editTarget.value = null; return; }

    submitting.value = true;
    status.value = null;
    const res = await fetch(`/api/admin-users/${editTarget.value.username}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${props.token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    submitting.value = false;
    if (!res.ok) {
        const t = await res.text();
        let msg = `錯誤 (${res.status})`;
        try { msg = JSON.parse(t).detail || msg; } catch {}
        status.value = { type: "error", message: msg };
    } else {
        status.value = { type: "success", message: (await res.json()).message };
        editTarget.value = null;
        await load();
    }
}

async function deleteUser(username, displayName) {
    if (!confirm(`確定要刪除管理員「${displayName}」（${username}）？`)) return;
    deletingUser.value = username;
    status.value = null;
    const res = await fetch(`/api/admin-users/${username}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${props.token}` },
    });
    deletingUser.value = null;
    if (!res.ok) {
        const t = await res.text();
        let msg = `錯誤 (${res.status})`;
        try { msg = JSON.parse(t).detail || msg; } catch {}
        status.value = { type: "error", message: msg };
    } else {
        status.value = { type: "success", message: (await res.json()).message };
        await load();
    }
}

onMounted(load);
</script>

<template>
    <div class="user-manage">
        <div class="um-header">
            <h4>管理員名單</h4>
            <button class="btn-add" @click="showAddForm = !showAddForm">
                {{ showAddForm ? "取消" : "＋ 新增管理員" }}
            </button>
        </div>

        <!-- Add form -->
        <div v-if="showAddForm" class="add-form">
            <div class="form-row">
                <label>帳號</label>
                <input v-model="form.username" type="text" placeholder="登入帳號" autocomplete="off" />
            </div>
            <div class="form-row">
                <label>密碼</label>
                <input v-model="form.password" type="password" placeholder="至少 6 個字元" autocomplete="new-password" />
            </div>
            <div class="form-row">
                <label>顯示名稱</label>
                <input v-model="form.display_name" type="text" placeholder="（選填）" />
            </div>
            <button class="btn-confirm" :disabled="submitting" @click="addUser">
                {{ submitting ? "新增中…" : "確認新增" }}
            </button>
        </div>

        <div v-if="status" :class="['status-msg', status.type]">{{ status.message }}</div>

        <!-- User list -->
        <div v-if="loading" class="loading">載入中…</div>
        <div v-else class="user-list">
            <div v-for="u in users" :key="u.username" class="user-row">
                <template v-if="editTarget?.username === u.username">
                    <!-- Inline edit -->
                    <div class="edit-inline">
                        <div class="edit-row">
                            <span class="edit-label">顯示名稱</span>
                            <input v-model="editForm.display_name" type="text" />
                        </div>
                        <div class="edit-row">
                            <span class="edit-label">新密碼</span>
                            <input v-model="editForm.password" type="password" placeholder="不填則不更改" autocomplete="new-password" />
                        </div>
                        <div class="edit-actions">
                            <button class="btn-save-sm" :disabled="submitting" @click="saveEdit">
                                {{ submitting ? "儲存中…" : "儲存" }}
                            </button>
                            <button class="btn-cancel-sm" @click="editTarget = null">取消</button>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div class="user-info">
                        <span v-if="u.is_super" class="badge-super">ADMIN</span>
                        <span class="user-display">{{ u.display_name }}</span>
                        <span class="user-username">@{{ u.username }}</span>
                        <span v-if="u.created_at" class="user-date">{{ u.created_at }}</span>
                    </div>
                    <div class="user-actions" v-if="!u.is_super">
                        <button class="btn-edit-sm" @click="startEdit(u)">編輯</button>
                        <button
                            class="btn-del-sm"
                            :disabled="deletingUser === u.username"
                            @click="deleteUser(u.username, u.display_name)"
                        >刪除</button>
                    </div>
                    <div class="user-actions" v-else>
                        <span class="no-action">不可刪除</span>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.user-manage { display: flex; flex-direction: column; gap: 0.9rem; }

.um-header {
    display: flex; align-items: center; justify-content: space-between;
    h4 { color: #ddd; margin: 0; font-size: 0.9rem; }
}

.btn-add {
    background: #2d3e5a; color: #7ab3ff; border: none;
    border-radius: 5px; padding: 0.3rem 0.75rem; cursor: pointer; font-size: 0.8rem;
    &:hover { background: #3a5070; }
}

.add-form {
    background: #1a1c1e; border: 1px solid #3a3c3e;
    border-radius: 8px; padding: 0.9rem 1rem;
    display: flex; flex-direction: column; gap: 0.6rem;
}

.form-row {
    display: flex; flex-direction: column; gap: 0.25rem;
    label { color: #888; font-size: 0.78rem; }
    input {
        background: #282a2c; border: 1px solid #3a3c3e; border-radius: 5px;
        padding: 0.4rem 0.6rem; color: #fff; font-size: 0.85rem;
        &:focus { outline: none; border-color: #5b8cfa; }
    }
}

.btn-confirm {
    align-self: flex-start;
    background: #5b8cfa; color: #fff; border: none; border-radius: 5px;
    padding: 0.4rem 1.1rem; cursor: pointer; font-size: 0.8rem;
    &:hover:not(:disabled) { background: #4a7be8; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.loading { color: #666; font-size: 0.875rem; }

.user-list { display: flex; flex-direction: column; gap: 0.3rem; }

.user-row {
    background: #1f2123; border: 1px solid #3a3c3e;
    border-radius: 7px; padding: 0.55rem 0.9rem;
    display: flex; align-items: center; gap: 0.75rem;
}

.user-info { flex: 1; display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }

.badge-super {
    background: #3a2a10; color: #f59e0b;
    border-radius: 4px; padding: 0.1rem 0.45rem;
    font-size: 0.68rem; font-weight: 600; letter-spacing: 0.05em;
}

.user-display { color: #ccc; font-size: 0.875rem; }
.user-username { color: #555; font-size: 0.78rem; font-family: monospace; }
.user-date { color: #444; font-size: 0.72rem; margin-left: auto; }

.user-actions { display: flex; gap: 0.3rem; flex-shrink: 0; }
.no-action { color: #444; font-size: 0.72rem; }

.btn-edit-sm, .btn-del-sm, .btn-save-sm, .btn-cancel-sm {
    border: none; border-radius: 4px; padding: 0.2rem 0.6rem;
    cursor: pointer; font-size: 0.75rem; transition: background 0.12s;
}
.btn-edit-sm { background: #2a3a50; color: #7ab3ff; &:hover { background: #3a4a60; } }
.btn-del-sm {
    background: #3a1e1e; color: #f87171;
    &:hover:not(:disabled) { background: #5a2a2a; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
}
.btn-save-sm { background: #5b8cfa; color: #fff; &:hover:not(:disabled) { background: #4a7be8; } &:disabled { opacity: 0.5; } }
.btn-cancel-sm { background: #333; color: #aaa; &:hover { background: #444; color: #fff; } }

.edit-inline { flex: 1; display: flex; flex-direction: column; gap: 0.4rem; }
.edit-row { display: flex; align-items: center; gap: 0.6rem; }
.edit-label { color: #666; font-size: 0.75rem; min-width: 60px; }
.edit-row input {
    flex: 1; background: #1a1c1e; border: 1px solid #3a3c3e; border-radius: 4px;
    padding: 0.3rem 0.5rem; color: #fff; font-size: 0.82rem;
    &:focus { outline: none; border-color: #5b8cfa; }
}
.edit-actions { display: flex; gap: 0.4rem; }

.status-msg {
    border-radius: 6px; padding: 0.5rem 0.75rem; font-size: 0.8rem;
    &.success { background: #1e3a2a; color: #4ade80; }
    &.error { background: #3a1e1e; color: #f87171; }
}
</style>
