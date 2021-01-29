<script>
	import { Router, Route } from "svelte-routing";
	import Discord from "./routes/Discord.svelte";
	import Home from "./routes/Home.svelte";
	import Server64 from "./routes/Server64.svelte";
</script>

<Router>
	<Route path="/">
		<Home />
	</Route>

	<Route path="/:server64" let:params>
		<Server64 {...params} />
	</Route>
	
	<Route path="/:server64/discord" let:params>
		<Discord {...params} />
	</Route>
</Router>