<script>
  import { onMount } from "svelte";
  import { moonscriptTemplate, luaTemplate } from "../utils/lunar-templates";
  // import "../global/events";
  import "../global/sprite";
  import "../global/physics";
  import "../global/audio";
  import "../global/draw";
	import "../global/spawn";
	import "../global/destroy";
	import "../global/scene";

  export let server64;

  window.sceneObjectTemplate = {
		x: 0,
		y: 0,
		angle: 0
	}
	
	window.SCENE = [];
	window.refSceneObjects = [];
	window.spriteTypeRefs = {};
	window.soundObjects = {};

  onMount(async () => {
    // Load data from server
    const botAPIEndpoint = "https://wwd-site-bot.uc.r.appspot.com/";
    const botAPIResponse = await fetch(botAPIEndpoint + server64);
    const data = await botAPIResponse.json();
    const { moonscriptSegments, assets } = data;

    // Create and execute Lua template
		const moonscriptCreate = moonscriptTemplate(moonscriptSegments).trim();
		
		const luaSegments = {
			create: await window.MoonScript.compile(moonscriptCreate),
			update: await window.MoonScript.compile(moonscriptSegments.update)
		}
		
		const returnPattern = /^return/gm;
		luaSegments.create = luaSegments.create.replaceAll(returnPattern, "");
		luaSegments.update = luaSegments.update.replaceAll(returnPattern, "");
		
		const lua = luaTemplate(luaSegments);
		
		// // DEBUG
		// console.log(lua);
		
    // window.fengari.load(lua)();
    
    // Phaser - Load assets
    function preload() {
			for (let asset of assets) {
				const name = asset.name.toLowerCase();
				const { url } = asset;
				
				if (asset.animations.length) {
					const { frameWidth, frameHeight } = asset;
					this.load.spritesheet(name, url, { frameWidth, frameHeight });
				}
				else if (asset.type === "sound") {
					this.load.audio(name, [url]);
				}
				else {
					this.load.image(name, url);
				}
			}
    }
    
    // Phaser - Start game
    function create() {
      // Global config
      window.phaserContext = this;
			window.graphics = this.add.graphics();
			
			// Physics config
			this.matter.world.autoUpdate = false;
			this.matter.world.setBounds();
      this.matter.add.pointerConstraint({ length: 1, stiffness: 1 });

      // Assets config
			for (let asset of assets) {
				const name = asset.name.toLowerCase();
				const { animations, frameRate, type } = asset;
				
				// Animations
				spriteTypeRefs[name] = animations.length ? "sprite" : "image";
				
				for (let animation of animations) {
					const [key] = Object.keys(animation);
					const frames = animation[key];
					const lastFrame = frames.pop();
					let repeat = 1;
					
					if (typeof lastFrame === "string" && lastFrame.toLowerCase() === "loop") {
						repeat = -1;
					}
					else {
						frames.push(lastFrame);
					}
					
					this.anims.create({
						key,
						frames: this.anims.generateFrameNumbers(name, { frames }),
						frameRate,
						repeat
					})
				}
				
				// Sounds
				if (type === "sound") {
					const sound = this.sound.add(name);
					soundObjects[name] = sound;
				}
      }
      
      // Physics events
			this.matter.world.on("collisionstart", (event, body1, body2) => {
				// Colliding bodies
				let collideRefs = SCENE.filter((sceneObject) => sceneObject._collide_name);
				let collideObject1 = collideRefs.find((sceneObject) => sceneObject.obj.body === body1);
				let collideObject2 = collideRefs.find((sceneObject) => sceneObject.obj.body === body2);
				
				if ((collideObject1 && collideObject1.id) && (collideObject2 && collideObject2.id)) {
					window.COLLIDE_ID1 = collideObject1.id;
					window.COLLIDE_ID2 = collideObject2.id;
					window.run_collide();
				}
				
				// Overlapping bodies
				let overlapRefs = SCENE.filter((sceneObject) => sceneObject._overlap_name);
				let overlapObject1 = overlapRefs.find((sceneObject) => sceneObject.obj.body === body1);
				let overlapObject2 = overlapRefs.find((sceneObject) => sceneObject.obj.body === body2);
				
				if ((overlapObject1 && overlapObject1.id) && (overlapObject2 && overlapObject2.id)) {
					window.OVERLAP_ID1 = overlapObject1.id;
					window.OVERLAP_ID2 = overlapObject2.id;
					window.run_collide();
				}
      });
      
      // Keyboard events
			document.addEventListener("keydown", (e) => {
				if (e.repeat) return;
				
				const key = e.key.trim() ? e.key.toUpperCase() : e.code.toUpperCase();
				
				window.KEY = key;
				window.run_press();
			});
			
			document.addEventListener("keyup", (e) => {
				if (e.repeat) return;
				
				const key = e.key.toUpperCase();
				
				window.KEY = key;
				window.run_unpress();
			})
			
			
			// Pointer events
			this.input.on("pointermove", (pointer) => {
				const { worldX, worldY } = pointer;
				const hoverObjects = SCENE.filter((sceneObject) => sceneObject._has_hover && sceneObject.obj);
				
				hoverObjects.forEach((sceneObject) => {
					const isPointerOver = this.matter.containsPoint(sceneObject.obj.body, worldX, worldY);
					
					if (isPointerOver) {
						if (!sceneObject._did_hover) {
							window.HOVER_ID = sceneObject.id;
							window.run_hover();
							
							sceneObject._did_hover = true;
						}
					}
					else if (sceneObject._did_hover) {
						window.UNHOVER_ID = sceneObject.id;
						window.run_unhover();
						window.run_unclick();
						
						sceneObject._did_hover = false;
					}
				});
			});
			
			this.input.on("pointerdown", (pointer) => {
				const { worldX, worldY } = pointer;
				const clickObjects = SCENE.filter((sceneObject) => sceneObject._has_click);
				
				clickObjects.forEach((sceneObject) => {
					const { body } = sceneObject.obj;
					
					if (body && this.matter.containsPoint(body, worldX, worldY)) {
						window.CLICK_ID = sceneObject.id;
						window.run_click();
						
						sceneObject._pointer_down = true;
					}
				})
			});
			
			this.input.on("pointerup", (pointer) => {
				const { worldX, worldY } = pointer;
				const clickObjects = SCENE.filter((sceneObject) => sceneObject._has_click);
				
				clickObjects.forEach((sceneObject) => {
					const { body } = sceneObject.obj;
					
					if (body && this.matter.containsPoint(body, worldX, worldY)) {						
						window.UNCLICK_ID = sceneObject.id;
						window.run_unclick();
						
						sceneObject._pointer_down = false;
					}
				});
			});

      // Execute our Lua, bay-bee!
      window.fengari.load(lua)();
    }

    // Phaser - Once per frame
    function update(time, delta) {
			// Lua game update
			window.game_update();
			
			// Physics
			this.matter.world.step(delta);
			
			SCENE.filter((sceneObject) => sceneObject._collide_name).forEach((collideSceneObject) => {
				const { x, y } = collideSceneObject.obj;
				window._SET_POSITION_ID = collideSceneObject.id;
				window._SET_POSITION_X = x;
				window._SET_POSITION_Y = y;
				window.set_position();
			})
			
			// Draw
			graphics.clear();
			
			SCENE.filter((sceneObject) => sceneObject._has_draw).forEach((drawSceneObject) => {
				window.DRAW_ID = drawSceneObject.id;
				window.run_draw();
			});
    }

    // Create Phaser game
    let gameConfig = {
			// ...window.configStub,
			type: Phaser.AUTO,
			physics: {
				default: "matter"
			},
			scene: {
				preload,
				create,
				update,
			}
    }
    
    window.game = new Phaser.Game(gameConfig);
  })
</script>

<svelte:head>
	<script src="/fengari-web.js" type="text/javascript"></script>
	<script src="/phaser.min.js"></script>
	<script src="/moonscript/index.js"></script>
</svelte:head>