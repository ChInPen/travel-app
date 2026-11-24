<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
import Swal from 'sweetalert2'
const members = ['金笨', '小謝', 'Book']

interface expensesType {
	id: string
	title: string
	amount: number
	payer: string
	currency: string,
	splitters: string[],
	note: string
}
const expenses = ref<expensesType[]>([
	{
		id: '001',
		title: '機場快線車票',
		amount: 1200,
		payer: '金笨',
		currency: 'JPY',
		splitters: members,
		note: ''
	},
	{
		id: '002',
		title: '拉麵晚餐',
		amount: 900,
		payer: '金笨',
		currency: 'TWD',
		splitters: members,
		note: ''
	}
])

const title = ref('')
const amount = ref('')
const payer = ref(members[0])
const splitters = ref([...members])
const note = ref('')

const totalAmount = computed(() => {
	return expenses.value.reduce((sum, item) => sum + Number(item.amount || 0), 0)
})

function addExpense() {
	const numericAmount = Number(amount.value)
	if (!title.value.trim() || !numericAmount || numericAmount <= 0) {
		return
	}

	title.value = ''
	amount.value = ''
	note.value = ''
	splitters.value = [...members]
}

function goItinerary() {
	router.push('/itinerary')
}
function hasDel(item: any) {
	Swal.fire({
		icon: 'question',
		title: `確定要刪除?`,
		text: item.title,
		showDenyButton: true,
		confirmButtonText: '是',
		denyButtonText: '否',
		preConfirm: () => {
		}
	})
	console.log('item', item.id)
}
</script>

<template>
	<div class="min-vh-100 bg-light pb-5">
		<!-- 頂部標題與行程表入口 -->
		<header class="sticky-top bg-white border-bottom px-3 py-3">
			<div class="d-flex align-items-center justify-content-between">
				<div>
					<h1 class="h5 fw-bold mb-0">旅遊記帳</h1>
					<div class="d-flex gap-2">
						<small class="text-secondary">累積支出：NT${{ totalAmount.toLocaleString() }}</small>
						<small class="text-secondary">累積支出：JPY¥{{ totalAmount.toLocaleString() }}</small>
					</div>
				</div>
				<button type="button" class="btn btn-sm btn-outline-primary rounded-pill px-3" @click="goItinerary">
					看行程表
				</button>
			</div>
		</header>

		<main class="px-3 pt-3 d-flex flex-column gap-3">
			<!-- 新增花費表單 -->
			<section class="card border-0 shadow-sm rounded-4">
				<div class="card-body p-3">
					<h2 class="h6 fw-bold mb-3">新增一筆花費</h2>

					<form class="d-flex flex-column gap-2" @submit.prevent="addExpense">
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
								<label class="form-label small mb-1">付款人</label>
								<select v-model="payer" class="form-select">
									<option v-for="person in members" :key="person" :value="person">
										{{ person }}
									</option>
								</select>
							</div>
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

						<button type="submit" class="btn btn-primary w-100 rounded-3 mt-1">
							儲存這筆花費
						</button>
					</form>
				</div>
			</section>

			<!-- 花費明細列表 -->
			<section class="d-flex flex-column gap-2">
				<h2 class="h6 fw-bold mb-1">花費紀錄</h2>

				<div v-for="item in expenses" :key="item.id" class="card border-0 shadow-sm rounded-4">
					<div class="card-body p-3">
						<div class="d-flex align-items-start justify-content-between gap-2">
							<div>
								<h3 class="h6 fw-bold mb-1">{{ item.title }}</h3>
								<div class="small text-secondary">
									{{ item.payer }} 先付 ・ 分攤：{{ item.splitters.join('、') }}
								</div>
								<div v-if="item.note" class="small text-muted mt-1">
									{{ item.note }}
								</div>
							</div>
							<div class="d-flex flex-column align-items-end gap-2">
								<div class="del" @click="hasDel(item)">X</div>
								<div class="fw-bold text-primary text-nowrap">
									{{ item.currency }} {{ Number(item.amount).toLocaleString() }}
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		</main>
	</div>
</template>
<style scoped>
.del {
	cursor: pointer
}
</style>