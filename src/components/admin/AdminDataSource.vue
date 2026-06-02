<script setup>
import { ref, onMounted } from "vue";

const props = defineProps({
    token: String,
    component: Object,
});

const url = ref("");
const schedule = ref("daily");
const enabled = ref(true);
const saving = ref(false);
const fetching = ref(false);
const deleting = ref(false);
const msg = ref("");
const msgType = ref("ok");   // "ok" | "error"
const hasConfig = ref(false);
const lastFetched = ref(null);
const lastStatus = ref(null);
const lastMessage = ref(null);

const scheduleOptions = [
    { value: "none",   label: "手動觸發（不排程）" },
    { value: "hourly", label: "每小時（整點後 5 分）" },
    { value: "daily",  label: "每日 06:30" },
    { value: "weekly", label: "每週一 06:30" },
];

function headers() {
    return { Authorization: `Bearer ${props.token}`, "Content-Type": "application/json" };
}

async function loadConfig() {
    const res = await fetch(`/api/datasource/${props.component.id}`, { headers: headers() });
    if (res.ok) {
        const d = await res.json();
        if (d.url) {
            hasConfig.value = true;
            url.value = d.url;
            schedule.value = d.schedule ?? "daily";
            enabled.value = d.enabled ?? true;
            lastFetched.value = d.last_fetched;
            lastStatus.value = d.last_status;
            lastMessage.value = d.last_message;
        }
    }
}

async function save() {
    if (!url.value.trim()) { showMsg("請輸入來源 URL", "error"); return; }
    saving.value = true;
    msg.value = "";
    try {
        const res = await fetch(`/api/datasource/${props.component.id}`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ url: url.value.trim(), schedule: schedule.value, enabled: enabled.value }),
        });
        const d = await res.json();
        if (res.ok) {
            hasConfig.value = true;
            showMsg("設定已儲存", "ok");
        } else {
            showMsg(d.detail || "儲存失敗", "error");
        }
    } finally {
        saving.value = false;
    }
}

async function fetchNow() {
    fetching.value = true;
    msg.value = "";
    try {
        const res = await fetch(`/api/datasource/${props.component.id}/fetch-now`, {
            method: "POST",
            headers: headers(),
        });
        const d = await res.json();
        if (res.ok) {
            lastFetched.value = d.fetched_at;
            lastStatus.value = "ok";
            lastMessage.value = d.message;
            showMsg(`抓取成功（${d.fetched_at}）`, "ok");
        } else {
            lastStatus.value = "error";
            lastMessage.value = d.detail;
            showMsg(d.detail || "抓取失敗", "error");
        }
    } finally {
        fetching.value = false;
    }
}

async function deleteConfig() {
    if (!confirm("確認刪除此組件的定期來源設定？")) return;
    deleting.value = true;
    try {
        const res = await fetch(`/api/datasource/${props.component.id}`, {
            method: "DELETE",
            headers: headers(),
        });
        if (res.ok) {
            hasConfig.value = false;
            url.value = "";
            schedule.value = "daily";
            enabled.value = true;
            lastFetched.value = null;
            lastStatus.value = null;
            lastMessage.value = null;
            showMsg("設定已刪除", "ok");
        }
    } finally {
        deleting.value = false;
    }
}

function showMsg(text, type) {
    msg.value = text;
    msgType.value = type;
    setTimeout(() => { if (msg.value === text) msg.value = ""; }, 4000);
}

onMounted(loadConfig);
</script>

<template>
    <div class="ds-wrap">
        <!-- Header description -->
        <div class="ds-intro">
            <p class="ds-intro-title">定期來源設定</p>
            <p class="ds-intro-desc">
                設定一個外部資料 URL，後台排程器將依照頻率自動抓取並更新此組件的圖表資料（支援 CSV 及 JSON 格式）。
                每次抓取前會自動備份舊資料至 <code>chartData/_backups/</code>。
            </p>
        </div>

        <!-- Form -->
        <div class="ds-form">
            <div class="ds-field">
                <label class="ds-label">資料來源 URL <span class="req">*</span></label>
                <input
                    v-model="url"
                    class="ds-input"
                    type="url"
                    placeholder="https://example.com/data.csv"
                />
                <p class="ds-hint">支援 HTTP / HTTPS；格式自動偵測（CSV 或 JSON）</p>
            </div>

            <div class="ds-field ds-field--row">
                <div class="ds-field-half">
                    <label class="ds-label">更新頻率</label>
                    <select v-model="schedule" class="ds-select">
                        <option v-for="o in scheduleOptions" :key="o.value" :value="o.value">
                            {{ o.label }}
                        </option>
                    </select>
                </div>
                <div class="ds-field-half ds-field-toggle">
                    <label class="ds-label">啟用排程</label>
                    <label class="toggle-switch">
                        <input type="checkbox" v-model="enabled" />
                        <span class="toggle-slider"></span>
                    </label>
                    <span :class="['toggle-label', enabled ? 'on' : 'off']">
                        {{ enabled ? "啟用" : "停用" }}
                    </span>
                </div>
            </div>

            <!-- Action buttons -->
            <div class="ds-actions">
                <button class="btn-save" :disabled="saving" @click="save">
                    {{ saving ? "儲存中..." : "儲存設定" }}
                </button>
                <button
                    class="btn-fetch"
                    :disabled="fetching || !url"
                    @click="fetchNow"
                    title="立即向 URL 抓取資料並更新"
                >
                    <span :class="['fetch-icon', fetching ? 'spinning' : '']">↻</span>
                    {{ fetching ? "抓取中..." : "立即抓取" }}
                </button>
                <button
                    v-if="hasConfig"
                    class="btn-delete"
                    :disabled="deleting"
                    @click="deleteConfig"
                >
                    刪除設定
                </button>
            </div>

            <!-- Message -->
            <p v-if="msg" :class="['ds-msg', msgType]">{{ msg }}</p>
        </div>

        <!-- Last fetch status -->
        <div v-if="hasConfig" class="ds-status">
            <p class="ds-status-title">上次抓取紀錄</p>
            <div class="ds-status-row">
                <span class="ds-status-label">時間</span>
                <span class="ds-status-val">{{ lastFetched ?? "（尚未抓取）" }}</span>
            </div>
            <div class="ds-status-row">
                <span class="ds-status-label">狀態</span>
                <span :class="['badge', lastStatus === 'ok' ? 'badge-ok' : lastStatus === 'error' ? 'badge-err' : 'badge-none']">
                    {{ lastStatus === 'ok' ? '成功' : lastStatus === 'error' ? '失敗' : '—' }}
                </span>
            </div>
            <div v-if="lastMessage" class="ds-status-row">
                <span class="ds-status-label">訊息</span>
                <span class="ds-status-val">{{ lastMessage }}</span>
            </div>
        </div>

        <!-- Info box: schedule details -->
        <div class="ds-info-box">
            <p class="ds-info-title">排程時間說明</p>
            <table class="ds-info-table">
                <tr><td>每小時</td><td>每小時第 5 分（00:05、01:05、02:05…）</td></tr>
                <tr><td>每日</td><td>每天 06:30（台北時間）</td></tr>
                <tr><td>每週</td><td>每週一 06:30（台北時間）</td></tr>
                <tr><td>手動觸發</td><td>不設排程，僅可點「立即抓取」手動更新</td></tr>
            </table>
            <p class="ds-info-note">※ 排程設定變更後，下次重啟後台服務時生效。點「立即抓取」不受此限，隨時可執行。</p>
        </div>
    </div>
</template>

<style scoped lang="scss">
.ds-wrap {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 680px;
}

/* ── Intro ── */
.ds-intro {
    background: #1a2535;
    border: 1px solid #2d3e5a;
    border-radius: 8px;
    padding: 0.85rem 1rem;
}
.ds-intro-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: #7ab3ff;
    margin: 0 0 0.3rem;
}
.ds-intro-desc {
    font-size: 0.78rem;
    color: #7a8fa8;
    margin: 0;
    line-height: 1.6;

    code {
        background: #152035;
        color: #93c5fd;
        padding: 0.1rem 0.3rem;
        border-radius: 3px;
        font-size: 0.72rem;
    }
}

/* ── Form ── */
.ds-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background: #1f2226;
    border: 1px solid #3a3c3e;
    border-radius: 8px;
    padding: 1.25rem;
}

.ds-field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;

    &--row {
        flex-direction: row;
        gap: 1rem;
        align-items: flex-end;
    }
}

.ds-field-half {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.ds-field-toggle {
    flex-direction: row;
    align-items: center;
    gap: 0.6rem;
    padding-bottom: 0.1rem;
}

.ds-label {
    font-size: 0.78rem;
    color: #888;
    .req { color: #f87171; }
}

.ds-input, .ds-select {
    background: #141618;
    border: 1px solid #3a3c3e;
    color: #ddd;
    border-radius: 5px;
    padding: 0.45rem 0.6rem;
    font-size: 0.85rem;
    outline: none;
    transition: border-color 0.15s;

    &:focus { border-color: #5b8cfa; }
}

.ds-select option { background: #1f2226; }

.ds-hint {
    font-size: 0.7rem;
    color: #555;
    margin: 0;
}

/* ── Toggle switch ── */
.toggle-switch {
    position: relative;
    display: inline-block;
    width: 36px;
    height: 20px;
    flex-shrink: 0;

    input { display: none; }

    &:has(input:checked) .toggle-slider { background: #3b5bdb; }
    &:has(input:checked) .toggle-slider::before { transform: translateX(16px); }
}

.toggle-slider {
    position: absolute;
    inset: 0;
    border-radius: 20px;
    background: #3a3c3e;
    transition: background 0.2s;
    cursor: pointer;

    &::before {
        content: "";
        position: absolute;
        width: 14px;
        height: 14px;
        left: 3px;
        top: 3px;
        border-radius: 50%;
        background: #fff;
        transition: transform 0.2s;
    }
}

.toggle-label {
    font-size: 0.78rem;
    &.on { color: #7ab3ff; }
    &.off { color: #555; }
}

/* ── Actions ── */
.ds-actions {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
}

.btn-save {
    padding: 0.45rem 1.1rem;
    background: #3b5bdb;
    color: #fff;
    border: none;
    border-radius: 5px;
    font-size: 0.82rem;
    cursor: pointer;
    transition: background 0.15s;

    &:hover:not(:disabled) { background: #4c6ef5; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.btn-fetch {
    padding: 0.45rem 1rem;
    background: #2d3e5a;
    color: #7ab3ff;
    border: none;
    border-radius: 5px;
    font-size: 0.82rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    transition: background 0.15s;

    &:hover:not(:disabled) { background: #3a4f70; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.fetch-icon {
    display: inline-block;
    font-size: 0.9rem;
    &.spinning { animation: spin 1s linear infinite; }
}

@keyframes spin { to { transform: rotate(360deg); } }

.btn-delete {
    padding: 0.45rem 0.9rem;
    background: none;
    border: 1px solid #4a2020;
    color: #f87171;
    border-radius: 5px;
    font-size: 0.82rem;
    cursor: pointer;
    margin-left: auto;
    transition: background 0.15s;

    &:hover:not(:disabled) { background: #2a1010; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.ds-msg {
    font-size: 0.8rem;
    padding: 0.45rem 0.75rem;
    border-radius: 5px;
    margin: 0;

    &.ok    { background: #0f2b1a; color: #4ade80; border: 1px solid #166534; }
    &.error { background: #2a1010; color: #f87171; border: 1px solid #7f1d1d; }
}

/* ── Status panel ── */
.ds-status {
    background: #161a20;
    border: 1px solid #252a35;
    border-radius: 8px;
    padding: 0.85rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.ds-status-title {
    font-size: 0.78rem;
    color: #5b7a9e;
    font-weight: 500;
    margin: 0 0 0.2rem;
}

.ds-status-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.ds-status-label {
    font-size: 0.72rem;
    color: #555;
    width: 2.5rem;
    flex-shrink: 0;
}

.ds-status-val {
    font-size: 0.78rem;
    color: #8a9bb5;
    font-family: monospace;
}

.badge {
    font-size: 0.7rem;
    padding: 0.1rem 0.45rem;
    border-radius: 4px;
    font-weight: 600;

    &-ok   { background: #0f2b1a; color: #4ade80; border: 1px solid #166534; }
    &-err  { background: #2a1010; color: #f87171; border: 1px solid #7f1d1d; }
    &-none { background: #222; color: #555; border: 1px solid #333; }
}

/* ── Info box ── */
.ds-info-box {
    background: #161a20;
    border: 1px solid #252a35;
    border-radius: 8px;
    padding: 0.85rem 1rem;
}

.ds-info-title {
    font-size: 0.75rem;
    color: #5b7a9e;
    font-weight: 500;
    margin: 0 0 0.5rem;
}

.ds-info-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.73rem;
    margin-bottom: 0.5rem;

    td {
        padding: 0.2rem 0.5rem;
        color: #6b7280;
        vertical-align: top;

        &:first-child {
            color: #5b7a9e;
            font-weight: 500;
            white-space: nowrap;
            padding-left: 0;
            width: 5rem;
        }
    }

    tr:not(:last-child) td { border-bottom: 1px solid #1c2030; }
}

.ds-info-note {
    font-size: 0.68rem;
    color: #3d5070;
    margin: 0;
}
</style>
