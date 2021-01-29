<script>
  import { onMount } from "svelte";

  export let server64;
  
  onMount(async () => {
    const botAPIEndpoint = "https://wwd-site-bot.uc.r.appspot.com/";
    const botAPIResponse = await fetch(botAPIEndpoint + server64 + "/discord");
    const data = await botAPIResponse.json();
    const { url: discordURL } = data;
    
    window.location.href = discordURL;
  })
</script>