<script>
	import { setContext } from "svelte";
	import { writable } from "svelte/store";
	import DirectionSign from "../components/DirectionSign.svelte";
	import HowlMoon from "../components/HowlMoon.svelte";
	import WoodenSign from "../components/WoodenSign.svelte";
	import { directionSigns } from "../constants/directionSigns";
	import { woodenSigns } from "../constants/woodenSigns";

	let selectedIndex = writable(0);
	
	setContext("sign-select", {
		selectedIndex
	});
	
	function selectSign(index) {
		$selectedIndex = index;
	}
</script>

<style>
	.all-the-signs {
		position: absolute;
		left: 5%;
		top: 15%;
		display: flex;
		flex-direction: row;
		width: 100%;
	}
	
	.direction-sign-wrapper {
    padding-bottom: 7%;
	}
</style>

<main>
	<HowlMoon />
	<section class="all-the-signs">
		<div class="direction-signs">
			{#each directionSigns as _, index}
				<div class="direction-sign-wrapper">
					<DirectionSign {index} on:click={() => selectSign(index)}/>
				</div>
			{/each}
		</div>
		
		{#each woodenSigns as _, index}
			<WoodenSign {index} />
		{/each}
	</section>
</main>