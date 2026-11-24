const GAS_URL = import.meta.env.VITE_GAS_URL
const GAS_KEY = import.meta.env.VITE_GAS_KEY
export async function gasGet(type: string) {
	const url = new URL(GAS_URL)
	url.searchParams.set('key', GAS_KEY)
	url.searchParams.set('type', type)
	try {
		const res = await fetch(GAS_URL)
		return res
	} catch (error) {
		return error
	}
}