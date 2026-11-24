<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goItinerary() {
	router.push('/itinerary')
}

function goExpenses() {
	router.push('/expenses')
}

</script>

<template>
	<main class="min-vh-100 d-flex align-items-center justify-content-center bg-light px-3 py-4">
		<div class="card w-100 shadow-sm border-0 rounded-4" style="max-width: 420px;">
			<div class="card-body p-4 text-center">
				<div class="mb-3 fs-1">✈️</div>
				<h1 class="h4 card-title fw-bold mb-2">歡迎回來，準備出發了嗎？</h1>
				<p class="card-text text-secondary mb-4">
					隨時掌握每日行程與旅費分帳明細
				</p>

				<div class="d-grid gap-2">
					<button type="button" class="btn btn-primary btn-lg rounded-3" @click="goItinerary">
						查看行程表
					</button>
					<button type="button" class="btn btn-outline-primary btn-lg rounded-3" @click="goExpenses">
						快速記帳
					</button>
				</div>
			</div>
		</div>
	</main>
</template>