export function copy(text: string): void {
	navigator.clipboard.writeText(text).then(
		() => {
			console.log('Copied', text);
		},
		(err: unknown) => {
			console.error('Could not copy: ', err);
		}
	);
}