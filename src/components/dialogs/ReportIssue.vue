<!-- Developed by Taipei Urban Intelligence Center 2023 -->

<script setup>
import { ref } from 'vue';
import { useDialogStore } from '../../store/dialogStore';
import DialogContainer from './DialogContainer.vue';

const dialogStore = useDialogStore();

const allInputs = ref({ type: "組件基本資訊有誤", description: "", name: "" });
const issueTypes = ["組件基本資訊有誤", "組件資料有誤或未更新", "系統問題", "其他建議"];
const submitting = ref(false);
const submitted = ref(false);
const submitError = ref("");

async function handleSubmit() {
	submitting.value = true;
	submitError.value = "";
	try {
		const res = await fetch("/api/issues", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				component_id: dialogStore.issue.id,
				component_name: dialogStore.issue.name,
				type: allInputs.value.type,
				description: allInputs.value.description,
				name: allInputs.value.name,
			}),
		});
		if (!res.ok) { submitError.value = "送出失敗，請稍後再試"; return; }
		submitted.value = true;
		setTimeout(handleClose, 1500);
	} catch {
		submitError.value = "無法連線，請確認網路狀態";
	} finally {
		submitting.value = false;
	}
}
function handleClose() {
	allInputs.value = { type: "組件基本資訊有誤", description: "", name: "" };
	submitted.value = false;
	submitError.value = "";
	dialogStore.dialogs.reportIssue = false;
}
</script>

<template>
	<DialogContainer dialog="reportIssue" @on-close="handleClose">
		<div class="reportissue">
			<h2>回報問題</h2>
			<div v-if="submitted" class="reportissue-success">✓ 回報成功！感謝您的意見，我們將盡快處理。</div>
			<template v-else>
				<h3>問題種類*</h3>
				<div v-for="item in issueTypes" :key="item">
					<input class="reportissue-radio" type="radio" v-model="allInputs.type" :value="item" :id="item" />
					<label :for="item">
						<div></div>
						{{ item }}
					</label>
				</div>
				<h3>問題簡述*</h3>
				<textarea v-model="allInputs.description"></textarea>
				<h3>姓名*</h3>
				<input class="reportissue-input" type="text" v-model="allInputs.name" />
				<p v-if="submitError" class="reportissue-error">{{ submitError }}</p>
				<div class="reportissue-control">
					<button class="reportissue-control-cancel" @click="handleClose">取消</button>
					<button
						v-if="allInputs.description && allInputs.name"
						class="reportissue-control-confirm"
						:disabled="submitting"
						@click="handleSubmit"
					>{{ submitting ? '送出中…' : '送出回報' }}</button>
				</div>
			</template>
		</div>
	</DialogContainer>
</template>

<style scoped lang="scss">
.reportissue {
	width: 300px;
	display: flex;
	flex-direction: column;

	h3 {
		margin: 0.5rem 0;
		font-size: var(--font-s);
		font-weight: 400;
	}

	&-radio {
		display: none;

		&:checked+label {
			color: white;

			div {
				background-color: var(--color-highlight);
			}
		}

		&:hover+label {
			color: var(--color-highlight);

			div {
				border-color: var(--color-highlight);
			}
		}
	}

	label {
		position: relative;
		display: flex;
		align-items: center;
		font-size: var(--font-s);
		color: var(--color-complement-text);
		transition: color 0.2s;
		cursor: pointer;

		div {
			width: calc(var(--font-s) / 2);
			height: calc(var(--font-s) / 2);
			margin-right: 4px;
			padding: calc(var(--font-s) / 4);
			border-radius: 50%;
			border: 1px solid var(--color-border);
			transition: background-color 0.2s, border-color 0.2s;
		}
	}

	textarea {
		height: 125px;
		padding: 4px 6px;
		border: solid 1px var(--color-border);
		border-radius: 5px;
		background-color: transparent;
		font-size: var(--font-m);
		resize: none;

		&:focus {
			outline: none;
			border: solid 1px var(--color-highlight);
		}
	}

	&-input {
		padding: 4px 6px;
		border: solid 1px var(--color-border);
		border-radius: 5px;
		background-color: transparent;
		font-size: var(--font-m);

		&:focus {
			outline: none;
			border: solid 1px var(--color-highlight);
		}
	}

	&-success {
		padding: 1.5rem 0;
		color: #4ade80;
		font-size: var(--font-m);
		text-align: center;
	}

	&-error {
		color: #f87171;
		font-size: var(--font-s);
		margin: 0.25rem 0 0;
	}

	&-control {
		display: flex;
		justify-content: flex-end;
		margin-top: 1rem;

		&-cancel {
			margin: 0 2px;
			padding: 4px 6px;
			border-radius: 5px;
			transition: color 0.2s;

			&:hover {
				color: var(--color-highlight);
			}
		}

		&-confirm {
			margin: 0 2px;
			padding: 4px 10px;
			border-radius: 5px;
			background-color: var(--color-highlight);
			transition: opacity 0.2s;

			&:hover {
				opacity: 0.8;
			}
		}
	}

}
</style>