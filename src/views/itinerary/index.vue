<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
import { formattedDate } from '@/utils/udate'
import { gasGet } from '@/utils/ugas'
const itineraryDays = ref([])
const isLoading = ref(false)
onMounted(async () => {
	isLoading.value = true
	try {
		const result = await gasGet('總預覽')
		console.log('result', result)
		if (result === false) return
		result.items.forEach((el, idx) => {
			if (el.日期 == '') {
				el.日期 = result.items[idx - 1].日期
			}
			const date = formattedDate('ja-JP', el.日期)
			el.日期 = date
		})
		itineraryDays.value.push({
			day: 0,
			date: '預覽',
			title: "",
			items: result.items
		})
	} catch {
	} finally {
		isLoading.value = false
	}
})


const activeDayIndex = ref(0)

const currentDay = computed(() => {
	return itineraryDays.value[activeDayIndex.value]
})

function goExpenses() {
	router.push('/expenses')
}
</script>

<template>
	<div class="min-vh-100 bg-light pb-5">
		<!-- 頂部標題與快速記帳入口 -->
		<header class="sticky-top bg-white border-bottom px-3 py-3">
			<div class="d-flex align-items-center justify-content-between mb-2">
				<div>
					<h1 class="h5 fw-bold mb-0">旅遊行程表</h1>
					<small class="text-secondary">{{ currentDay?.title }}</small>
				</div>
				<button type="button" class="btn btn-sm btn-outline-primary rounded-pill px-3" :disabled="isLoading"
					@click="goExpenses">
					去記帳
				</button>
			</div>

			<!-- 天數切換列 -->
			<div class="d-flex gap-2 overflow-auto pb-1">
				<button v-for="(dayInfo, index) in itineraryDays" :key="dayInfo.day" type="button"
					class="btn btn-sm rounded-pill flex-shrink-0 px-3"
					:class="activeDayIndex === index ? 'btn-primary' : 'btn-outline-secondary'"
					@click="activeDayIndex = index">
					{{ dayInfo.date }}
				</button>
			</div>
		</header>

		<!-- 當天行程列表 -->
		<main class="px-3 pt-3">
			<div v-if="!isLoading" class="d-flex flex-column gap-3">
				<div v-for="item in currentDay?.items" :key="item.日期" class="card border-0 shadow-sm rounded-4">
					<div v-if="item.日期" class="card-body p-3">
						<div class="d-flex align-items-center justify-content-between mb-1">
							<span class="badge text-bg-primary-subtle text-primary rounded-pill px-0 py-1">
								{{ item.日期 }}
							</span>
						</div>
						<h2 class="h6 fw-bold mb-1">{{ item.行程 }}</h2>
						<p class="text-secondary small mb-0">{{ item.住宿方案 }}</p>
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
		</main>
	</div>
</template>