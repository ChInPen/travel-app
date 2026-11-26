const GAS_URL = import.meta.env.VITE_GAS_URL as string;
const GAS_KEY = (import.meta.env.VITE_GAS_KEY as string) || "CHINPEN";
// GET
export async function gasGet(type: string) {
	const url = new URL(GAS_URL)
	url.searchParams.set('key', GAS_KEY)
	url.searchParams.set('type', type)
	try {
		const res = await fetch(url)
		if (!res.ok) {
			throw new Error(`HTTP 狀態碼異常：${res.status}`)
		}
		const result = await res.json()
		return result
	} catch (error) {
		console.error('抓取資料失敗', error)
		return false
	}
}

// POST
export type ExpenseAction = "add" | "delete";

export interface ExpensePayloadItem {
	id: string
	原因: string
	金額: number
	付款人: string
	幣別: string
	平分: string[] | string
	補充說明: string
}

export interface GasPostResponse {
	ok: boolean;
	message?: string;
	id?: string;
}

export async function gasPost(
	sheetName: string,
	action: ExpenseAction,
	item: ExpensePayloadItem
): Promise<GasPostResponse> {
	if (!GAS_URL) {
		throw new Error("缺少 VITE_GAS_URL 環境變數");
	}

	const response = await fetch(GAS_URL, {
		method: "POST",
		headers: {
			"Content-Type": "text/plain;charset=utf-8"
		},
		body: JSON.stringify({
			key: GAS_KEY,
			sheetName,
			action,
			item
		})
	});

	if (!response.ok) {
		throw new Error(`HTTP 請求失敗：${response.status}`);
	}

	const result: GasPostResponse = await response.json();
	if (!result.ok) {
		throw new Error(result.message || "GAS 處理失敗");
	}

	return result;
}