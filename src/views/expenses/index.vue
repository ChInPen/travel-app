<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, handleError } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import { gasGet, gasPost } from '@/utils/ugas'

const router = useRouter()

const members = ['金笨', '小謝', 'Book']
const expenses = ref<expensesType[]>([])
const isLoading = ref(false)
const showAddModal = ref(false)

onMounted(async () => {
	getData()
	window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
	window.removeEventListener('keydown', handleKeydown)
})
async function getData() {
	try {
		isLoading.value = true
		const result = await gasGet('花費')
		if (result === false) return
		expenses.value = result.items.map((el: expensesType, idx: number) => ({
			...el,
			平分: Array.isArray(el.平分)
				? el.平分.map((name) => String(name).trim()).filter(Boolean)
				: typeof el.平分 === 'string'
					? el.平分
						.replace(/[、，]/g, ',')
						.split(',')
						.map((name: string) => name.trim())
						.filter(Boolean)
					: []
		}))
	} catch {
	} finally {
		isLoading.value = false
	}
}
function createExpenseId(): string {
	const timestamp = Date.now();
	const randomCode = Math.random().toString(36).slice(2, 6);
	return `exp_${timestamp}_${randomCode}`;
}
interface expensesType {
	id: string
	原因: string
	金額: number
	付款人: string
	幣別: string
	平分: string[] | string
	補充說明: string
}

const title = ref('')
const amount = ref('')
const currency = ref('JPY')
const payer = ref(members[0])
const splitters = ref([...members])
const note = ref('')

const totalAmount = computed(() => {
	return expenses.value.reduce((sum, item) => sum + Number(item.金額 || 0), 0)
})

function openAddModal() {
	showAddModal.value = true
}

function closeAddModal() {
	showAddModal.value = false
}

function handleKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape' && showAddModal.value) {
		closeAddModal()
	}
}

async function addExpense() {
	const numericAmount = Number(amount.value)
	if (!title.value.trim() || !numericAmount || numericAmount <= 0) {
		Swal.fire({
			icon: 'warning',
			title: '請填寫完整的項目名稱與金額'
		})
		return
	}

	const selectedSplitters: string[] =
		splitters.value.length > 0
			? splitters.value.filter((name): name is string => Boolean(name && name.trim()))
			: payer.value
				? [payer.value]
				: []
	const plyload = {
		//用時間戳+隨機碼
		id: createExpenseId(),
		原因: title.value.trim(),
		金額: numericAmount,
		付款人: payer.value ?? members[0] ?? '',
		幣別: currency.value ?? 'JPY',
		平分: selectedSplitters,
		補充說明: note.value.trim()
	}
	expenses.value.unshift(plyload)
	try {
		closeAddModal()
		isLoading.value = true
		const res = await gasPost('花費', 'add', plyload)
		Swal.fire({
			icon: 'success',
			title: '儲存成功!'
		})
	} catch (error) {
		console.error("新增失敗", error)
		getData()
	} finally {
		isLoading.value = false
	}
	title.value = ''
	amount.value = ''
	currency.value = 'JPY'
	payer.value = members[0]
	splitters.value = [...members]
	note.value = ''
}

function goItinerary() {
	router.push('/itinerary')
}

function hasDel(item: expensesType) {
	Swal.fire({
		icon: 'question',
		title: '確定要刪除?',
		text: item.原因,
		showDenyButton: true,
		confirmButtonText: '是',
		denyButtonText: '否'
	}).then(async (res) => {
		if (res.isConfirmed) {
			expenses.value = expenses.value.filter((el) => el.id !== item.id)
			try {
				isLoading.value = true
				await gasPost('花費', 'delete', item)
				Swal.fire({
					icon: "success",
					title: "刪除成功!"
				})
			} catch (error) {
				console.error("刪除失敗", error)
				getData()
			} finally {
				isLoading.value = false
			}
		}
	})
}


</script>

<template>
	<div class="min-vh-100 bg-light pb-5">
		<header class="sticky-top bg-white border-bottom px-3 py-3">
			<div class="d-flex align-items-center justify-content-between mb-2">
				<div>
					<h1 class="h5 fw-bold mb-0">旅遊記帳</h1>
					<div class="d-flex gap-2">
						<small class="text-secondary">累積支出：NT${{ totalAmount.toLocaleString() }}</small>
						<small class="text-secondary">累積支出：JPY¥{{ totalAmount.toLocaleString() }}</small>
					</div>
				</div>
				<button type="button" class="btn btn-sm btn-outline-primary rounded-pill px-3" @click="goItinerary"
					:disabled="isLoading">
					看行程表
				</button>
			</div>
			<div v-if="!isLoading" class="d-flex gap-2 overflow-auto pb-1">
				<button type="button" class="btn btn-sm rounded-pill flex-shrink-0 px-3 btn-primary"
					@click="openAddModal">
					新增一筆花費
				</button>
			</div>
		</header>

		<main class="px-3 pt-3 d-flex flex-column gap-3">
			<section class="d-flex flex-column gap-2">
				<div v-if="!isLoading" v-for="item in expenses" :key="item.id"
					class="card border-0 shadow-sm rounded-4">
					<div class="card-body p-3">
						<div class="d-flex align-items-start justify-content-between gap-2">
							<div>
								<h3 class="h6 fw-bold mb-1">{{ item.原因 }}</h3>
								<div class="small text-secondary">
									{{ item.付款人 }} 先付 ・ 分攤：{{ Array.isArray(item.平分) ? item.平分.join('、') : '' }}
								</div>
								<div v-if="item.補充說明" class="small text-muted mt-1">
									{{ item.補充說明 }}
								</div>
							</div>
							<div class="d-flex flex-column align-items-end gap-2">
								<div class="del" @click="hasDel(item)">X</div>
								<div class="fw-bold text-primary text-nowrap">
									{{ item.幣別 }} {{ Number(item.金額).toLocaleString() }}
								</div>
							</div>
						</div>
					</div>
				</div>
				<div v-else>
					<div class="d-flex justify-content-center gap-2">
						<div class="spinner-border" role="status">
							<span class="visually-hidden">Loading...</span>
						</div>
						<h2>資料讀取中，請稍後</h2>
					</div>
				</div>
			</section>
		</main>

		<!-- 新增花費彈窗 -->
		<div v-if="showAddModal" class="modal-backdrop-custom d-flex align-items-center justify-content-center p-3"
			@click.self="closeAddModal">
			<div class="card border-0 shadow rounded-4 w-100 modal-card-custom">
				<div class="card-body p-3 p-sm-4">
					<div class="d-flex align-items-center justify-content-between mb-3">
						<h2 class="h6 fw-bold mb-0">新增一筆花費</h2>
						<button type="button" class="btn-close" aria-label="關閉" @click="closeAddModal"></button>
					</div>

					<form class="d-flex flex-column gap-3" @submit.prevent="addExpense">
						<div>
							<label class="form-label small mb-1">項目名稱</label>
							<input v-model="title" type="text" class="form-control" placeholder="例如：午餐、門票、計程車" />
						</div>

						<div class="row g-2">
							<div class="col-6">
								<label class="form-label small mb-1">金額</label>
								<input v-model="amount" type="number" inputmode="numeric" class="form-control"
									placeholder="0" />
							</div>
							<div class="col-6">
								<label class="form-label small mb-1">幣別</label>
								<select v-model="currency" class="form-select">
									<option value="JPY">日幣</option>
									<option value="TWD">台幣</option>
								</select>
							</div>
						</div>

						<div>
							<label class="form-label small mb-1">付款人</label>
							<select v-model="payer" class="form-select">
								<option v-for="person in members" :key="person" :value="person">
									{{ person }}
								</option>
							</select>
						</div>

						<div>
							<label class="form-label small mb-1">分攤對象</label>
							<div class="d-flex flex-wrap gap-2">
								<label v-for="person in members" :key="person" class="btn btn-sm rounded-pill"
									:class="splitters.includes(person) ? 'btn-primary' : 'btn-outline-secondary'">
									<input v-model="splitters" type="checkbox" :value="person" class="d-none" />
									{{ person }}
								</label>
							</div>
						</div>

						<div>
							<label class="form-label small mb-1">備註（選填）</label>
							<input v-model="note" type="text" class="form-control" placeholder="補充說明" />
						</div>

						<div class="d-flex gap-2 mt-1">
							<button type="button" class="btn btn-outline-secondary w-50 rounded-3"
								@click="closeAddModal">
								取消
							</button>
							<button type="submit" class="btn btn-primary w-50 rounded-3">
								儲存這筆花費
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.del {
	cursor: pointer;
}

.modal-backdrop-custom {
	position: fixed;
	inset: 0;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 1050;
}

.modal-card-custom {
	max-width: 460px;
	max-height: 90vh;
	overflow-y: auto;
}
</style>