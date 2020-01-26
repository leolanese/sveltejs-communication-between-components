<script>
	import FirstComponent from './FirstComponent.svelte';

	export let name;
	let familyName = 'Lanese';

	$: uppercaseName = name.toUpperCase();
	$: uppercaseFamilyName = familyName.toUpperCase();
	$: console.log(uppercaseName, uppercaseFamilyName);

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
		border: 1px solid black;
	}
</style>

<div>
	<h1>Hello world!</h1>
	<h2>I'm the parent Component</h2>
	<h2>My name is: {uppercaseName} {uppercaseFamilyName}</h2>
	<button on:click={onChangeName}>Change-Name</button>
	<input type="text"
		   value="{name}"
		   bind:value={name} />
	<input type="text"
		   value="{familyName}"
		   bind:value={familyName} />

	<FirstComponent
			name={name}
			familyName={familyName}
	></FirstComponent>
</div>


