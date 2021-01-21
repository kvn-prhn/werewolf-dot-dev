<script>
  import { getContext } from "svelte";
  import { directionSigns } from "../constants/directionSigns";

  export let index = -1;
  
  let { text, style } = directionSigns[index] || {};
  let { selectedIndex } = getContext("sign-select");
  
  $: active = index === $selectedIndex;
</script>

<style>
  main {
    background-image: url("/assets/direction-sign.png");
    background-repeat: no-repeat;
    background-size: var(--direction-sign-width) var(--direction-sign-height);
    width: var(--direction-sign-width);
    height: var(--direction-sign-height);
    cursor: pointer;
  }
  
  .sign-text {
    font-family: 'Permanent Marker', cursive;
    position: relative;
    width: 224px;
  }
  
  .active {
    color: var(--active-sign-color);
  }
</style>

<main class="direciton-sign-component" class:active on:click>
  <section class="sign-text" {style}>
    {text}
  </section>
</main>