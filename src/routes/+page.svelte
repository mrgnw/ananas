<h1>yoho</h1>

<style>
	:root {
		font-size: 24px; /* Adjust this value to your preference */
	}
	form {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: center;
		margin-bottom: 2rem;
	}
	input[type='text'] {
		flex-grow: 1;
		font-size: 1rem;
	}
	button {
		padding: 0.5rem 1rem;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		font-size: 1rem;
	}
	button:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}
</style>
