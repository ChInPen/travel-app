export function formattedDate(timezone: 'zh-TW' | 'ja-JP', time: string) {
	const date = new Date(time)
	if (Number.isNaN(date.getTime())) {
		return null
	}
	const dateTime = new Intl.DateTimeFormat(timezone, {
		timeZone: timezone == 'zh-TW' ? 'Asia/Taipei' : 'Asia/Tokyo',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(date)
	return dateTime
}