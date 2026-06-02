<script setup>
import { ref, onMounted } from "vue";
import AdminLogin from "../components/admin/AdminLogin.vue";
import AdminComponentList from "../components/admin/AdminComponentList.vue";
import AdminComponentCreate from "../components/admin/AdminComponentCreate.vue";
import AdminCsvUpload from "../components/admin/AdminCsvUpload.vue";
import AdminMetaEdit from "../components/admin/AdminMetaEdit.vue";
import AdminDashboardEdit from "../components/admin/AdminDashboardEdit.vue";
import AdminDashboardList from "../components/admin/AdminDashboardList.vue";
import AdminUserManage from "../components/admin/AdminUserManage.vue";
import AdminBackup from "../components/admin/AdminBackup.vue";
import AdminAuditLog from "../components/admin/AdminAuditLog.vue";
import AdminIssueLog from "../components/admin/AdminIssueLog.vue";
import AdminDataSource from "../components/admin/AdminDataSource.vue";
import AdminQuickLinks from "../components/admin/AdminQuickLinks.vue";

const token = ref(localStorage.getItem("admin_token") || "");
const isAuthed = ref(false);
const isSuper = ref(false);
const currentUser = ref("");

// panel: 'list' | 'csv' | 'meta' | 'datasource' | 'create' | 'dashboards' | 'dash-edit' | 'users' | 'backup' | 'audit'
const panel = ref("list");
const selectedComponent = ref(null);
const selectedDashboard = ref(null);
const allComponents = ref([]);

async function loadComponents() {
    const res = await fetch("/api/components", { headers: { Authorization: `Bearer ${token.value}` } });
    if (res.ok) { const d = await res.json(); allComponents.value = d.data || []; }
}

async function checkToken(t) {
    try {
        const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${t}` } });
        if (!res.ok) return false;
        const data = await res.json();
        isSuper.value = data.is_super || false;
        currentUser.value = data.username || "";
        return true;
    } catch {
        return false;
    }
}

onMounted(async () => {
    if (token.value) {
        isAuthed.value = await checkToken(token.value);
        if (!isAuthed.value) {
            localStorage.removeItem("admin_token");
            token.value = "";
        } else {
            loadComponents();
        }
    }
});

function onLoginSuccess(t, superFlag, username) {
    token.value = t;
    isAuthed.value = true;
    isSuper.value = superFlag || false;
    currentUser.value = username || "";
    loadComponents();
}

function logout() {
    localStorage.removeItem("admin_token");
    token.value = "";
    isAuthed.value = false;
    isSuper.value = false;
    currentUser.value = "";
    panel.value = "list";
    selectedComponent.value = null;
}

function openCsv(comp) {
    selectedComponent.value = comp;
    panel.value = "csv";
}

function openMeta(comp) {
    selectedComponent.value = comp;
    panel.value = "meta";
}

function openDataSource(comp) {
    selectedComponent.value = comp;
    panel.value = "datasource";
}

function backToList() {
    panel.value = "list";
    selectedComponent.value = null;
}

function onComponentCreated() {
    loadComponents();
    panel.value = "list";
}

function openDashboards() { panel.value = "dashboards"; }
function openDashEdit(dash) { selectedDashboard.value = dash; panel.value = "dash-edit"; }
function newDashboard() { selectedDashboard.value = null; panel.value = "dash-edit"; }
function backToDashboards() { panel.value = "dashboards"; selectedDashboard.value = null; }
</script>

<template>
    <!-- Login screen -->
    <AdminLogin v-if="!isAuthed" @login-success="onLoginSuccess" />

    <!-- Admin shell -->
    <div v-else class="admin-shell">
        <!-- Top bar -->
        <header class="admin-header">
            <span class="admin-logo">儀表板管理後台</span>
            <nav class="admin-nav">
                <button
                    :class="['nav-btn', ['list','csv','meta','datasource','create'].includes(panel) ? 'active' : '']"
                    @click="backToList"
                >組件管理</button>
                <button
                    :class="['nav-btn', panel === 'dashboards' || panel === 'dash-edit' ? 'active' : '']"
                    @click="openDashboards"
                >儀表板管理</button>
                <button
                    :class="['nav-btn', panel === 'issues' ? 'active' : '']"
                    @click="panel = 'issues'"
                >問題回報</button>
                <button
                    :class="['nav-btn', panel === 'backup' ? 'active' : '']"
                    @click="panel = 'backup'"
                >備份管理</button>
                <button
                    :class="['nav-btn', panel === 'audit' ? 'active' : '']"
                    @click="panel = 'audit'"
                >登入紀錄</button>
                <button
                    :class="['nav-btn', panel === 'quicklinks' ? 'active' : '']"
                    @click="panel = 'quicklinks'"
                >快速連結</button>
                <button
                    v-if="isSuper"
                    :class="['nav-btn', panel === 'users' ? 'active' : '']"
                    @click="panel = 'users'"
                >帳號管理</button>
            </nav>
            <div class="user-info">
                <span class="user-avatar">{{ currentUser.charAt(0).toUpperCase() }}</span>
                <span class="user-name">{{ currentUser }}</span>
                <span v-if="isSuper" class="user-badge">最高管理員</span>
            </div>
            <button class="btn-logout" @click="logout">登出</button>
        </header>

        <!-- Main area -->
        <main class="admin-main">
            <!-- Component list view -->
            <template v-if="panel === 'list'">
                <div class="panel-head">
                    <h2>組件列表</h2>
                    <p class="panel-desc">點擊「管理」進入 CSV 上傳或資料編輯</p>
                    <button class="tab new-btn" style="margin-left:auto" @click="panel = 'create'">＋ 新增組件</button>
                </div>
                <AdminComponentList
                    :token="token"
                    @select="(c) => openCsv(c)"
                />
            </template>

            <!-- Create component -->
            <template v-else-if="panel === 'create'">
                <div class="scroll-area">
                    <AdminComponentCreate
                        :token="token"
                        @back="backToList"
                        @created="onComponentCreated"
                    />
                </div>
            </template>

            <!-- CSV Upload view -->
            <template v-else-if="panel === 'csv'">
                <div class="panel-head">
                    <h2>資料更新</h2>
                    <div class="panel-tabs">
                        <button class="tab active">CSV 上傳</button>
                        <button class="tab" @click="openMeta(selectedComponent)">編輯資料</button>
                        <button class="tab" @click="openDataSource(selectedComponent)">定期來源</button>
                    </div>
                </div>
                <div class="scroll-area">
                    <AdminCsvUpload
                        :token="token"
                        :component="selectedComponent"
                        @back="backToList"
                        @uploaded="backToList"
                    />
                </div>
            </template>

            <!-- User management (super admin only) -->
            <template v-else-if="panel === 'users'">
                <div class="panel-head">
                    <h2>帳號管理</h2>
                    <p class="panel-desc">僅最高管理員可新增、刪除或修改其他管理員</p>
                </div>
                <div class="scroll-area">
                    <AdminUserManage :token="token" />
                </div>
            </template>

            <!-- Dashboard list -->
            <template v-else-if="panel === 'dashboards'">
                <div class="panel-head">
                    <h2>儀表板管理</h2>
                    <button class="tab new-btn" @click="newDashboard">＋ 新增儀表板</button>
                </div>
                <AdminDashboardList
                    :token="token"
                    :is-super="isSuper"
                    @edit="openDashEdit"
                    @created="openDashboards"
                />
            </template>

            <!-- Dashboard edit -->
            <template v-else-if="panel === 'dash-edit'">
                <div class="scroll-area">
                    <AdminDashboardEdit
                        :token="token"
                        :dashboard="selectedDashboard"
                        :all-components="allComponents"
                        @back="backToDashboards"
                        @saved="backToDashboards"
                    />
                </div>
            </template>

            <!-- Issue log -->
            <template v-else-if="panel === 'issues'">
                <div class="panel-head">
                    <h2>問題回報</h2>
                    <p class="panel-desc">使用者從儀表板回報的組件問題</p>
                </div>
                <div class="scroll-area">
                    <AdminIssueLog :token="token" />
                </div>
            </template>

            <!-- Backup management -->
            <template v-else-if="panel === 'backup'">
                <div class="panel-head">
                    <h2>備份管理</h2>
                    <p class="panel-desc">{{ isSuper ? '可立即備份並下載歷史備份檔案' : '查看備份紀錄' }}</p>
                </div>
                <div class="scroll-area">
                    <AdminBackup :token="token" :is-super="isSuper" />
                </div>
            </template>

            <!-- Login audit log -->
            <template v-else-if="panel === 'audit'">
                <div class="panel-head">
                    <h2>登入紀錄</h2>
                    <p class="panel-desc">所有管理員的登入嘗試紀錄</p>
                </div>
                <div class="scroll-area">
                    <AdminAuditLog :token="token" />
                </div>
            </template>

            <!-- Quick links -->
            <template v-else-if="panel === 'quicklinks'">
                <div class="scroll-area">
                    <AdminQuickLinks :token="token" />
                </div>
            </template>

            <!-- Meta edit view -->
            <template v-else-if="panel === 'meta'">
                <div class="panel-head">
                    <h2>編輯組件資料</h2>
                    <div class="panel-tabs">
                        <button class="tab" @click="openCsv(selectedComponent)">CSV 上傳</button>
                        <button class="tab active">編輯資料</button>
                        <button class="tab" @click="openDataSource(selectedComponent)">定期來源</button>
                    </div>
                </div>
                <div class="scroll-area">
                    <AdminMetaEdit
                        :token="token"
                        :component="selectedComponent"
                        @back="backToList"
                        @updated="backToList"
                    />
                </div>
            </template>

            <!-- Datasource (scheduled URL fetch) view -->
            <template v-else-if="panel === 'datasource'">
                <div class="panel-head">
                    <h2>資料更新</h2>
                    <div class="panel-tabs">
                        <button class="tab" @click="openCsv(selectedComponent)">CSV 上傳</button>
                        <button class="tab" @click="openMeta(selectedComponent)">編輯資料</button>
                        <button class="tab active">定期來源</button>
                    </div>
                </div>
                <div class="scroll-area">
                    <AdminDataSource
                        :token="token"
                        :component="selectedComponent"
                    />
                </div>
            </template>
        </main>
    </div>
</template>

<style scoped lang="scss">
.admin-shell {
    height: 100vh;
    background: #1a1c1e;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.admin-header {
    height: 56px;
    background: #282a2c;
    border-bottom: 1px solid #3a3c3e;
    display: flex;
    align-items: center;
    padding: 0 1.5rem;
    gap: 1.5rem;
    flex-shrink: 0;
}

.admin-logo {
    color: #fff;
    font-weight: 600;
    font-size: 1rem;
    white-space: nowrap;
}

.admin-nav { flex: 1; display: flex; gap: 0.5rem; }

.nav-btn {
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    font-size: 0.875rem;
    transition: background 0.15s, color 0.15s;

    &:hover { background: #3a3c3e; color: #fff; }
    &.active { background: #2d3e5a; color: #7ab3ff; }
}

.user-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-right: 0.5rem;
}

.user-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #2d3e5a;
    color: #7ab3ff;
    font-size: 0.8rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.user-name {
    color: #ccc;
    font-size: 0.85rem;
    font-family: monospace;
}

.user-badge {
    background: #3a2a60;
    color: #a78bfa;
    font-size: 0.68rem;
    padding: 0.1rem 0.45rem;
    border-radius: 4px;
    border: 1px solid #6d4fb0;
}

.btn-logout {
    background: none;
    border: 1px solid #444;
    color: #888;
    cursor: pointer;
    padding: 0.35rem 0.8rem;
    border-radius: 6px;
    font-size: 0.8rem;

    &:hover { border-color: #f87171; color: #f87171; }
}

.admin-main {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 1.5rem 2rem;
    gap: 1rem;
    overflow: hidden;
}

.scroll-area {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
}

.panel-head {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    flex-shrink: 0;

    h2 { color: #fff; font-size: 1.2rem; margin: 0; }
}

.panel-desc { color: #666; font-size: 0.875rem; margin: 0; }

.panel-tabs {
    display: flex;
    gap: 0.4rem;
    margin-left: auto;
}

.tab {
    background: none;
    border: 1px solid #3a3c3e;
    color: #888;
    cursor: pointer;
    padding: 0.3rem 0.75rem;
    border-radius: 5px;
    font-size: 0.8rem;
    transition: all 0.15s;

    &:hover { border-color: #aaa; color: #fff; }
    &.active { background: #2d3e5a; border-color: #2d3e5a; color: #7ab3ff; }
}

.new-btn {
    margin-left: auto;
    background: #5b8cfa !important;
    border-color: #5b8cfa !important;
    color: #fff !important;
    &:hover { background: #4a7be8 !important; }
}
</style>
