<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import { gasGet, gasPost } from '@/utils/ugas'

const router = useRouter()

type MemberName = '金笨' | 'Book' | '小謝';
const MEMBERS: MemberName[] = ['金笨', 'Book', '小謝'];
const expenses = ref<ExpensesType[]>([])
const isLoading = ref(false)
const showAddModal = ref(false)
interface ExpensesType {
	id: string
	原因: string
	金額: number
	付款人: string
	幣別: string
	平分: string[] | string
	補充說明: string
}
export interface CostSummary {
	// JPY 個人總花費
	jpySpent: number;
	// JPY 實際計算後要收或付的金額（正數應收、負數應付）
	jpySettlement: number;
	// TWD 個人總花費
	twdSpent: number;
	// TWD 實際計算後要收或付的金額（正數應收、負數應付）
	twdSettlement: number;
}
const costTotal = ref<{
	金笨: CostSummary
	Book: CostSummary
	小謝: CostSummary
}>({
	金笨: {
		jpySpent: 0,
		jpySettlement: 0,
		twdSpent: 0,
		twdSettlement: 0
	},
	Book: {
		jpySpent: 0,
		jpySettlement: 0,
		twdSpent: 0,
		twdSettlement: 0
	},
	小謝: {
		jpySpent: 0,
		jpySettlement: 0,
		twdSpent: 0,
		twdSettlement: 0
	}
})
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

		const validItems = result.items.filter((el: ExpensesType) => el.id !== '').map((el: ExpensesType) => ({
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
		expenses.value = validItems;
		result.items.slice(0, 4).forEach((el: any, index: number) => {
			const key = ['jpySpent', 'jpySettlement', 'twdSpent', 'twdSettlement'] as (keyof CostSummary)[];
			const title = key[index]
			if (!title) return;
			MEMBERS.forEach((name) => {
				costTotal.value[name][title] = el[name]
			})
		})
	} catch (error) {
		console.error('抓取資料失敗', error)
	} finally {
		isLoading.value = false
	}
}
function createExpenseId(): string {
	const timestamp = Date.now();
	const randomCode = Math.random().toString(36).slice(2, 6);
	return `exp_${timestamp}_${randomCode}`;
}

const title = ref('')
const amount = ref('')
const currency = ref('JPY')
const payer = ref(MEMBERS[0])
const splitters = ref([...MEMBERS])
const note = ref('')

const JPYtotalAmount = computed(() => {
	return costTotal.value.金笨.jpySpent + costTotal.value.小謝.jpySpent + costTotal.value.Book.jpySpent
})
const TWDtotalAmount = computed(() => {
	return costTotal.value.金笨.twdSpent + costTotal.value.小謝.twdSpent + costTotal.value.Book.twdSpent
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
			? splitters.value.filter((name) => Boolean(name && name.trim()))
			: payer.value
				? [payer.value]
				: []
	const plyload = {
		//用時間戳+隨機碼
		id: createExpenseId(),
		原因: title.value.trim(),
		金額: numericAmount,
		付款人: payer.value ?? MEMBERS[0] ?? '',
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
	} finally {
		getData()
		isLoading.value = false
	}
	title.value = ''
	amount.value = ''
	currency.value = 'JPY'
	payer.value = MEMBERS[0]
	splitters.value = [...MEMBERS]
	note.value = ''
}

function goItinerary() {
	router.push('/itinerary')
}

function hasDel(item: ExpensesType) {
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
			const plyload: ExpensesType = {
				id: item.id,
				付款人: item.付款人,
				原因: item.原因,
				平分: item.平分,
				幣別: item.幣別,
				金額: item.金額,
				補充說明: item.補充說明
			}
			try {
				isLoading.value = true
				await gasPost('花費', 'delete', plyload)
				Swal.fire({
					icon: "success",
					title: "刪除成功!"
				})
			} catch (error) {
				console.error("刪除失敗", error)
			} finally {
				getData()
				isLoading.value = false
			}
		}
	})
}
// 個人花費
const selectedMember = ref<MemberName>('金笨');
function formatCurrency(amount: number, currency: 'JPY' | 'TWD'): string {
	const prefix = currency === 'JPY' ? '¥' : 'NT$';
	return `${prefix}${Math.abs(amount).toLocaleString()}`;
}

function getSettlementLabel(amount: number): string {
	if (amount > 0) return '應收';
	if (amount < 0) return '應付';
	return '已結清';
}

function getSettlementClass(amount: number): string {
	if (amount > 0) return 'text-success fw-bold';
	if (amount < 0) return 'text-danger fw-bold';
	return 'text-secondary fw-semibold';
}

</script>

<template>
	<div class="min-vh-100 bg-light pb-5">
		<header class="sticky-top bg-white border-bottom px-3 py-3">
			<div class="d-flex align-items-center justify-content-between mb-2">
				<div>
					<h1 class="h5 fw-bold mb-0">旅遊記帳</h1>
					<div class="d-flex gap-2">
						<small class="text-secondary">累積支出：NT${{ TWDtotalAmount }}</small>
						<small class="text-secondary">累積支出：JPY¥{{ JPYtotalAmount }}</small>
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
								<option v-for="person in MEMBERS" :key="person" :value="person">
									{{ person }}
								</option>
							</select>
						</div>

						<div>
							<label class="form-label small mb-1">分攤對象</label>
							<div class="d-flex flex-wrap gap-2">
								<label v-for="person in MEMBERS" :key="person" class="btn btn-sm rounded-pill"
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
		<!-- 底部，懸浮按鈕 -->
		<button type="button" data-bs-toggle="modal" data-bs-target="#exampleModal"
			class="btn btn-primary rounded-circle shadow-lg position-fixed bottom-0 end-0 m-3 m-md-4 p-0 d-inline-flex flex-column align-items-center justify-content-center z-3"
			style="width: 3rem; height: 3rem; line-height: 1.15;">
			<span class="fw-semibold" style="font-size: 0.7rem;">個人</span>
			<span class="fw-semibold" style="font-size: 0.7rem;">花費</span>
		</button>

		<!-- 個人花費彈窗 -->
		<div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
			<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title" id="exampleModalLabel">個人花費與結算</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>

					<div class="modal-body">
						<!-- 成員切換 -->
						<div class="btn-group w-100 mb-3" role="group" aria-label="選擇成員">
							<button v-for="member in MEMBERS" :key="member" type="button" class="btn"
								:class="selectedMember === member ? 'btn-primary' : 'btn-outline-primary'"
								@click="selectedMember = member">
								{{ member }}
							</button>
						</div>

						<!-- JPY 區塊 -->
						<div class="border rounded-3 p-3 mb-3 bg-light-subtle">
							<div class="d-flex justify-content-between align-items-center mb-2">
								<span class="fw-bold">日幣（JPY）</span>
								<span class="badge" :class="costTotal[selectedMember].jpySettlement > 0
									? 'text-bg-success'
									: costTotal[selectedMember].jpySettlement < 0
										? 'text-bg-danger'
										: 'text-bg-secondary'
									">
									{{ getSettlementLabel(costTotal[selectedMember].jpySettlement) }}
								</span>
							</div>

							<div class="d-flex justify-content-between py-1 border-bottom">
								<span class="text-secondary">目前花費</span>
								<span class="fw-semibold">
									{{ formatCurrency(costTotal[selectedMember].jpySpent, 'JPY') }}
								</span>
							</div>

							<div class="d-flex justify-content-between pt-2">
								<span class="text-secondary">
									{{ getSettlementLabel(costTotal[selectedMember].jpySettlement) }}金額
								</span>
								<span :class="getSettlementClass(costTotal[selectedMember].jpySettlement)">
									<template v-if="costTotal[selectedMember].jpySettlement > 0">+</template>
									<template v-else-if="costTotal[selectedMember].jpySettlement < 0">-</template>
									{{ formatCurrency(costTotal[selectedMember].jpySettlement, 'JPY') }}
								</span>
							</div>
						</div>

						<!-- TWD 區塊 -->
						<div class="border rounded-3 p-3 bg-light-subtle">
							<div class="d-flex justify-content-between align-items-center mb-2">
								<span class="fw-bold">台幣（TWD）</span>
								<span class="badge" :class="costTotal[selectedMember].twdSettlement > 0
									? 'text-bg-success'
									: costTotal[selectedMember].twdSettlement < 0
										? 'text-bg-danger'
										: 'text-bg-secondary'
									">
									{{ getSettlementLabel(costTotal[selectedMember].twdSettlement) }}
								</span>
							</div>

							<div class="d-flex justify-content-between py-1 border-bottom">
								<span class="text-secondary">目前花費</span>
								<span class="fw-semibold">
									{{ formatCurrency(costTotal[selectedMember].twdSpent, 'TWD') }}
								</span>
							</div>

							<div class="d-flex justify-content-between pt-2">
								<span class="text-secondary">
									{{ getSettlementLabel(costTotal[selectedMember].twdSettlement) }}金額
								</span>
								<span :class="getSettlementClass(costTotal[selectedMember].twdSettlement)">
									<template v-if="costTotal[selectedMember].twdSettlement > 0">+</template>
									<template v-else-if="costTotal[selectedMember].twdSettlement < 0">-</template>
									{{ formatCurrency(costTotal[selectedMember].twdSettlement, 'TWD') }}
								</span>
							</div>
						</div>
					</div>

					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
					</div>
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