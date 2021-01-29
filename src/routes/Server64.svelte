<script>
  import { onMount } from "svelte";
  import { moonscriptTemplate, luaTemplate } from "../utils/lunar-templates";
  // import "../global/events";
  import "../global/sprite";
  import "../global/physics";
  import "../global/audio";
  import "../global/draw";
	import "../global/spawn";
	import "../global/scene";

  export let server64;

  window.sceneObjectTemplate = {
		x: 0,
		y: 0,
		angle: 0
	}
	
	window.SCENE = [];
	// window.refSceneObjects = [];
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
				
				// // DEBUG
				// console.log(collideRefs, collideObject1, collideObject2)
				
				// Overlapping bodies
				let overlapRefs = SCENE.filter((sceneObject) => sceneObject._overlap_name);
				let overlapObject1 = overlapRefs.find((sceneObject) => sceneObject.obj.body === body1);
				let overlapObject2 = overlapRefs.find((sceneObject) => sceneObject.obj.body === body2);
				
				if ((overlapObject1 && overlapObject1.id) && (overlapObject2 && overlapObject2.id)) {
					window.OVERLAP_ID1 = overlapObject1.id;
					window.OVERLAP_ID2 = overlapObject2.id;
					window.run_overlap();
				}
				
				// // DEBUG
				// console.log(overlapRefs, overlapObject1, overlapObject2);
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
				
				SCENE.forEach((sceneObject) => {
					const { body } = sceneObject.obj || {};
					
					if (body) {
						sceneObject._isPointerOver = this.matter.containsPoint(body, worldX, worldY);
					}
				})
				
				// DE-DUPE
				hoverObjects.forEach((sceneObject) => {
					if (sceneObject._isPointerOver) {
						if (!sceneObject._did_hover && !sceneObject._pointer_down) {
							window.HOVER_ID = sceneObject.id;
							window.run_hover();
							sceneObject._did_hover = true;
						}
						
						if (sceneObject._pointer_down) {
							sceneObject._dragging = true;
						}
					}
					else if (sceneObject._did_hover) {
						if (sceneObject._has_unhover) {
							window.UNHOVER_ID = sceneObject.id;
							window.run_unhover();
						}
						
						if (sceneObject._has_unclick && !sceneObject._dragging) {
							window.UNCLICK_ID = sceneObject.id;
							window.run_unclick();
						}
						else {
							sceneObject.dragging = false;
						}
						
						sceneObject._did_hover = false;
					}
				});
			});
			
			this.input.on("pointerdown", (pointer) => {
				// const { worldX, worldY } = pointer;
				const clickObjects = SCENE.filter((sceneObject) => sceneObject._has_click);
				
				clickObjects.forEach((sceneObject) => {
					if (sceneObject._isPointerOver) {
						window.CLICK_ID = sceneObject.id;
						window.run_click();
						
						sceneObject._pointer_down = true;
					}
					
					if (sceneObject._collide_name === "KINEMATIC_POINTER") {
						sceneObject.obj.setStatic(false);
					}
				})
			});
			
			this.input.on("pointerup", (pointer) => {
				const { worldX, worldY } = pointer;
				const unclickObjects = SCENE.filter((sceneObject) => sceneObject._has_unclick);
				
				unclickObjects.forEach((sceneObject) => {	
					if (sceneObject._pointer_down) {						
						window.UNCLICK_ID = sceneObject.id;
						window.run_unclick();
						
						sceneObject._pointer_down = false;
					}
					
					const { body } = sceneObject.obj;
					sceneObject._did_hover = body && this.matter.containsPoint(body, worldX, worldY);
					
					if (sceneObject._collide_name === "KINEMATIC_POINTER") {
						sceneObject.obj.setStatic(true);
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
				const isKinematic = _isKinematic(collideSceneObject);
				const isCharacter = _isCharacter(collideSceneObject);
				
				if (isKinematic || isCharacter) {
					collideSceneObject.obj.setAngularVelocity(0);
					
					if (isKinematic) {
						collideSceneObject.obj.setVelocity(0);
					}
				}
				
				const { x, y, angle, body } = collideSceneObject.obj;
				const { velocity } = body;
				
				window._SET_POSITION_ID = collideSceneObject.id;
				window._SET_POSITION_X = x;
				window._SET_POSITION_Y = y;
				window._SET_POSITION_ANGLE = angle
				window._SET_POSITION_VELOCITY_X = velocity.x
				window._SET_POSITION_VELOCITY_Y = velocity.y
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
				default: "matter",
				matter: {
					// debug: true
				}
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