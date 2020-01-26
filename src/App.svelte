<script>
	import FirstComponent from './FirstComponent.svelte';

	export let name;
	let familyName = 'Lanese';
	let userGitHub = 252649;
	let userImage = '';

	$: console.log(name, familyName, userGitHub, userImage);

	const onChangeName = () => name = (name === 'Leo')?  'Leonardo'  : 'Leo';
	const onChangeInput = () => familyName = event.target.value;
</script>

<style>
	h1 {
		color: #323f7d;
	}
	button, input {
		border: 1px solid #323f7d;
	}
	div {
		border: 2px solid black;
	}
</style>

<div>
	<h1>Parent Component</h1>
	<button on:click={onChangeName}>Change-Name</button>
	<input type="text"
		   value="{name}"
		   bind:value={name} />
	<input type="text"
		   value="{familyName}"
		   bind:value={familyName} />
	<input type="text"
		   value="{userGitHub}"
		   bind:value={userGitHub} />

	<FirstComponent
			name={name}
			familyName={familyName}
			userGitHub={userGitHub}
			userImage={userImage}
	></FirstComponent>
</div>


