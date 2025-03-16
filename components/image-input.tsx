export function ImageInput({
	onChange,
	onError,
	maxBytes = 100_000,
	...props
}: {
	onChange?: (dataUrl: string) => void
	onError?: (error: string) => void
	maxBytes?: number
} & Omit<React.ComponentProps<"input">, "type" | "onChange" | "onError" | "accept">) {
	return (
		<input
			{...props}
			type="file"
			accept="image/*"
			onError={(e) => {
				console.error(e)
				onError?.("Unknown error")
			}}
			onChange={async (e) => {
				const file = e.target.files?.[0]
				if (!file) return

				if (!file.type.startsWith("image/")) {
					onError?.("Please select a valid image file")
					return
				}

				// Create an image element to load the file
				const img = new Image()
				img.src = URL.createObjectURL(file)
				await new Promise((resolve) => (img.onload = resolve))

				const dataUrl = compressImage({ img, maxBytes })
				// Cleanup
				URL.revokeObjectURL(img.src)

				if (!dataUrl) {
					onError?.("Failed to process image")
					return
				}

				if (dataUrl.length > maxBytes) {
					onError?.(
						`Image is too large. Please select an image under ${Math.floor(maxBytes / 1000)}KB`,
					)
					return
				}

				onChange?.(dataUrl)
			}}
		/>
	)
}

function compressImage({ img, maxBytes = 100_000 }: { img: HTMLImageElement; maxBytes?: number }) {
	// Create canvas for resizing
	const canvas = document.createElement("canvas")
	const ctx = canvas.getContext("2d")
	if (!ctx) return

	// Calculate new dimensions (max 400px)
	const maxSize = 400
	let width = img.width
	let height = img.height
	if (width > height && width > maxSize) {
		height = (height * maxSize) / width
		width = maxSize
	} else if (height > maxSize) {
		width = (width * maxSize) / height
		height = maxSize
	}

	// Set canvas size and draw resized image
	canvas.width = width
	canvas.height = height
	ctx.drawImage(img, 0, 0, width, height)

	// Convert to base64 with reduced quality
	const base64 = canvas.toDataURL("image/jpeg", 0.8)

	// Check if size is under 100KB, if not reduce quality further
	let quality = 0.8
	let base64String = base64
	while (base64String.length > maxBytes && quality > 0.1) {
		quality -= 0.1
		base64String = canvas.toDataURL("image/jpeg", quality)
	}

	return base64String
}
