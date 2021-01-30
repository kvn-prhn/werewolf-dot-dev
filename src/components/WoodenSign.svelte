<script>
  import { getContext } from "svelte";
  import { woodenSigns } from "../constants/woodenSigns";

  export let index = -1;
  
  let { intro, outro = "", list = [], marginTop } = woodenSigns[index] || {};
  let { selectedIndex } = getContext("sign-select")
  
  $: active = index === $selectedIndex;
  $: style = `margin-top: ${marginTop}`;
</script>

<style>
  main {
    background-image: url("/assets/wooden-sign.png");
    background-repeat: no-repeat;
    background-size: var(--wooden-sign-width) var(--wooden-sign-height);
    width: var(--wooden-sign-width);
    height: var(--wooden-sign-height);
    margin-top: -1%;
    display: none;
  }
  
  .sign-text {
    font-family: 'Cabin', sans-serif;
    margin-top: 5%;
    margin-left: 7%;
    font-size: 40px;
    width: calc(var(--wooden-sign-width) - 150px);
  }
  
  .intro {
    color: var(--active-sign-color);
  }
  
  .list {
    margin-left: 5%;
  }
  
  ol {
    margin-top: 4%;
  }

  li {
    margin-top: 2%;
  }
  
  .active {
    display: initial;
  }
</style>

<main class="wooden-sign-component" {style} class:active>
  <section class="sign-text">
    <span class="intro">{@html intro}</span>
    <div class="list">
      <ol>
        {#each list as listItem}
          <li>{@html listItem}</li>
        {/each}
      </ol>
    </div>
    <span class="outro">{@html outro}</span>
  </section>
</main>