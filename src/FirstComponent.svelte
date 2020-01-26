<script>
  export let name;
  export let familyName;

  export const onChangeName = () => name = event.target.value;
</script>

<style>
	h1 {
		color: #7d2a36;
	}
	button, input {
		border: 1px solid #7d2a36;
	}
	div {
		border: 1px solid red;
	}
</style>

<div>
	<h1>Hello First child component!</h1>
	<h2>{name} {familyName}</h2>
	<input type="text"
		   value="{name}"
		   bind:value={name} />
	<input type="text"
		   value="{familyName}"
		   bind:value={familyName} />
</div>
