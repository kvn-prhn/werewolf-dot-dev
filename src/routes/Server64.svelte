<script>
  import { onMount } from "svelte";
  import { moonscriptTemplate, luaTemplate } from "../utils/lunar-templates";
  import "../global/events";
  import "../global/sprite";
  import "../global/physics";
  import "../global/audio";
  import "../global/draw";
  import "../global/create";

  export let server64;

  window.sceneObjectTemplate = {
		x: 0,
		y: 0,
		angle: 0
	}
	
	window.refSceneObjects = [];
	window.spriteTypeRefs = {};
	window.soundObjects = {};

  onMount(async () => {
    // Load data from server
    const botAPIEndpoint = "http://127.0.0.1:8080/";
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
				let collideRefs = refSceneObjects.filter((sceneObject) => sceneObject._collide_name);
				let collideObject1 = collideRefs.find((sceneObject) => (sceneObject._img || sceneObject._text).body === body1);
				let collideObject2 = collideRefs.find((sceneObject) => (sceneObject._img || sceneObject._text).body === body2);
				
				if ((collideObject1 && collideObject1.id) && (collideObject2 && collideObject2.id)) {
					window.COLLIDE_ID1 = collideObject1.id;
					window.COLLIDE_ID2 = collideObject2.id;
					window.run_collide();
				}
				
				// Overlapping bodies
				let overlapRefs = refSceneObjects.filter((sceneObject) => sceneObject._overlap_name);
				let overlapObject1 = overlapRefs.find((sceneObject) => (sceneObject._img || sceneObject._text).body === body1);
				let overlapObject2 = overlapRefs.find((sceneObject) => (sceneObject._img || sceneObject._text).body === body2);
				
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
			window.POINTER_OBJECTS = {};

			// TODO: Fix hover and click Lua-side
			this.input.on("pointermove", (pointer) => {
				const { worldX, worldY } = pointer;
				
				// Hover
				const hoverObjects = refSceneObjects.filter((sceneObject) => sceneObject._has_hover && (sceneObject._img || sceneObject._text));
				
				hoverObjects.forEach((sceneObject) => {
					const obj = (sceneObject._img || sceneObject._text);
					const isPointerOver = this.matter.containsPoint(obj.body, worldX, worldY);
					
					if (isPointerOver) {
						const hasHover = !!window.POINTER_OBJECTS[sceneObject.id];
						
						if (!hasHover) {
							window.POINTER_OBJECTS[sceneObject.id] = sceneObject;
							window.ID = sceneObject.id;
							window.run_hover();
						}
					}
					else if (window.POINTER_OBJECTS[sceneObject.id]) {
						sceneObject._pointer_down = false;
						
						window.ID = sceneObject.id;
						window.run_unhover();
						
						if (sceneObject._has_unclick) {
							window.run_unclick();
						}
						
						delete window.POINTER_OBJECTS[sceneObject.id];
					}
				});
				
				// Kinematic pointers
				const kinematicPointerObjects = refSceneObjects.filter((sceneObject) => sceneObject._pointer_down && sceneObject._collide_name === "KINEMATIC_POINTER");
				
				kinematicPointerObjects.forEach((sceneObject) => {
					const obj = (sceneObject._img || sceneObject._text);
					obj.setStatic(false);
				})
			})
			
			this.input.on("pointerdown", (pointer) => {
				const { worldX, worldY } = pointer;
				const clickObjects = refSceneObjects.filter((sceneObject) => sceneObject._has_click || sceneObject._collide_name === "KINEMATIC_POINTER");
				
				clickObjects.forEach((sceneObject) => {
					const { body } = (sceneObject._img || sceneObject._text);
					
					if (this.matter.containsPoint(body, worldX, worldY)) {
						sceneObject._pointer_down = true;
						
						window.ID = sceneObject.id;
						window.run_click();
					}
				})
			});
			
			this.input.on("pointerup", (pointer) => {
				const { worldX, worldY } = pointer;
				const clickObjects = refSceneObjects.filter((sceneObject) => sceneObject._has_click);
				
				clickObjects.forEach((sceneObject) => {
					const { body } = (sceneObject._img || sceneObject._text);
					
					if (this.matter.containsPoint(body, worldX, worldY)) {						
						window.ID = sceneObject.id;
						window.run_unclick();
					}
				})
				
				// Kinematic pointers
				const kinematicPointerObjects = refSceneObjects.filter((sceneObject) => sceneObject._pointer_down && sceneObject._collide_name === "KINEMATIC_POINTER");
				
				kinematicPointerObjects.forEach((sceneObject) => {
					sceneObject._pointer_down = false;
					
					const obj = (sceneObject._img || sceneObject._text);
					obj.setStatic(true);
				})
			});

      // Execute our Lua, bay-bee!
      window.fengari.load(lua)();
    }

    // Phaser - Once per frame
    function update(time, delta) {
      // Lua scene objects update 1
			window.game_update();
			
			// JS scene objects position 1
			window.SCENE.forEach((sceneObject, index) => {
				if (sceneObject._collide_name !== "STATIC") {
					const { x, y } = sceneObject;
					const ref = refSceneObjects[index];
					const obj = (ref._img || ref._text);
					
					// const { _img } = refSceneObjects[index];
					
					if (obj) {
						obj.x = x;
						obj.y = y;
					}
				}
			});
			
			// Physics - JS scene objects position 2
			this.matter.world.step(delta);
			
			// Physics - Lua scene objects update 2
			refSceneObjects.forEach((sceneObject) => {
				const obj = (sceneObject._img || sceneObject._text);
				
				if (obj) {
					if (!_isKinematic(sceneObject) || !obj.isStatic()) {
						window._SET_POSITION_ID = sceneObject.id;
						window._SET_POSITION_X = obj.x;
						window._SET_POSITION_Y = obj.y;
						window.set_position();
					}
					
					if (_isKinematic(sceneObject)) {
						obj.setAngularVelocity(0);
					}
				}
			});
			
			// Draw
			graphics.clear();
			
			const drawRefs = refSceneObjects.filter((sceneObject) => sceneObject._has_draw);
			
			drawRefs.forEach((refObject) => {
				window.DRAW_ID = refObject.id;
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