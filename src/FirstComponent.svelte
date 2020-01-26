<script>
  export let name;
  export let familyName;
  export let userGitHub;
  export let userImage;
</script>

<style>
	h1 {
		color: #7d2a36;
	}
	button, input {
		border: 1px solid #7d2a36;
	}
	body {
		border: 2px double red;
		background-color: #a75a78;
	}
</style>

<body>
	<h2>Child component!</h2>
	<h3>{name} {familyName}</h3>
	<input type="text"
		   value="{name}"
		   bind:value={name} />
	<input type="text"
		   value="{familyName}"
		   bind:value={familyName} />
	<div>
		<img src="https://avatars3.githubusercontent.com/u/{userGitHub}"  />
	</div>
</body>
