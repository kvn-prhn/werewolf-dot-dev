export function moonscriptTemplate(moonscriptSegments) {
	return `
-- Core
export TYPE = "__class"
export NAME = "__name"
export SCENE = {}

-- Physics
export class KINEMATIC
export class STATIC
export class POINTER
export class KINEMATIC_POINTER

export UP = "Up"
export DOWN = "Down"
export LEFT = "Left"
export RIGHT = "Right"

-- Input
export class HOLD
export class ONCE

export PRESS_HOLD = {}
export PRESS_HOLD_KEYS = {}

export CLICK_HOLD = {}
export HOVER_HOLD = {}
export KEYS = {}

-- Sprites
export ANIMATED = {}


-- Scene objects
export class Scene_Object
	@count: 0
	new: =>
		@@count += 1
		@x = 0
		@y = 0
		@angle = 0


export class Text
	new: =>
		@content = ""
		@size = 16
		@font = "Arial"
		@color = 0x00aaff
		@_is_text = true
	overlap: =>

export class Physics_Text
	new: =>
		@content = ""
		@size = 16
		@font = "Arial"
		@color = 0x00aaff
		@_is_text = true
	collide: =>

export class Static_Text extends Physics_Text
	collide: => STATIC

export class Kinematic_Text extends Physics_Text
	collide: => KINEMATIC

export class Pointer_Text extends Physics_Text
	collide: => POINTER

export class Kinematic_Pointer_Text extends Physics_Text
	collide: => KINEMATIC_POINTER


export class Timer
	new: =>
		@fire = -> nil
		@rate = 1000
		@count = 1
		@_is_timer = true


export spawn = (archetype, config = {}) ->
	instance = with archetype!
		[TYPE].__base[k] = v for k,v in pairs Scene_Object!
		[k] = v for k,v in pairs config
		.id = Scene_Object.count
		._class_name = archetype[NAME]
		._has_click = .click ~= nil
		._has_unclick = .unclick ~= nil
		._has_hover = .hover ~= nil
		._has_unhover = .unhover ~= nil
		._has_draw = .draw ~= nil
		if .collide
			collide_obj = \\collide {}
			if collide_obj then ._collide_name = collide_obj[NAME] else ._collide_name = "GRAVITY"
		if .overlap
			overlap_obj = \\overlap {}
			if overlap_obj then ._overlap_name = overlap_obj[NAME] else ._overlap_name = "GHOST"
	
	for k,v in pairs instance[TYPE].__base
		instance["__" .. k] = v
		
	SCENE[instance.id] = instance
	update_scene!
	_document\\dispatchEvent(js.new(_custom_event, "spawn", Object({
		detail: Object(instance)
	})))
	return instance
    

-- TODO: Remove most of this function?
export destroy = (instance) ->
	last_scene_object = table.remove(SCENE)
	Scene_Object.count -= 1
	
	if #SCENE > 0
		last_scene_object.id = instance.id
		SCENE[instance.id] = last_scene_object
		
	update_scene!
	
	_document\\dispatchEvent(js.new(_custom_event, "destroy", Object({
		detail: Object(instance)
	})))
	


export mirror = (instance) ->
	js.global.MIRROR_ID = instance.id
	js.global.MIRROR_X = true
	js.global.mirrorSprite!

export unmirror = (instance) ->
	js.global.MIRROR_ID = instance.id
	js.global.MIRROR_X = false
	js.global.mirrorSprite!


export flip = (instance) ->
	js.global.FLIP_ID = instance.id
	js.global.FLIP_Y = true
	js.global.flipSprite!

export unflip = (instance) ->
	js.global.FLIP_ID = instance.id
	js.global.FLIP_Y = false
	js.global.flipSprite!


export animate = (instance, name) ->
	if ANIMATED[instance.id] == nil
		js.global.ANIMATE_ID = instance.id
		js.global.ANIMATE_NAME = name
		js.global.animateSprite!
		ANIMATED[instance.id] = name

export unanimate = (instance) ->
	if ANIMATED[instance.id]
		js.global.UNANIMATE_ID = instance.id
		js.global.UNANIMATE_NAME = ANIMATED[instance.id]
		js.global.unanimateSprite!
		ANIMATED[instance.id] = nil


export thrust = (instance, direction, amount) ->
	js.global.THRUST_ID = instance.id
	js.global.THRUST_DIRECTION = direction
	js.global.THRUST_AMOUNT = amount
	js.global.applyThrust!


export play = (sound_name) ->
	js.global.SOUND_NAME = sound_name
	js.global.playSound!

export pause = (sound_name) ->
	js.global.SOUND_NAME = sound_name
	js.global.pauseSound!

export resume = (sound_name) ->
	js.global.SOUND_NAME = sound_name
	js.global.resumeSound!
	
export stop = (sound_name) ->
	js.global.SOUND_NAME = sound_name
	js.global.stopSound!
	
	
export line = (config) ->
	js.global.LINE_CONFIG = Object(config)
	js.global.drawLine!

export rectangle = (config) ->
	js.global.RECTANGLE_CONFIG = Object(config)
	js.global.drawRectangle!

export ellipse = (config) ->
	js.global.ELLIPSE_CONFIG = Object(config)
	js.global.drawEllipse!


${moonscriptSegments.create}
`
}

export function luaTemplate(luaSegments) {
  return `
js = require "js"

function Object(t)
	local o = js.new(js.global.Object)
	for k, v in pairs(t) do
		o[k] = v
	end
	return o
end

_document = js.global.document
_custom_event = js.global.CustomEvent

function update_scene()
	js.global.SCENE = js.global:Array()
	for key,value in pairs(SCENE) do
		js.global.SCENE:push(Object(value))
	end
end

js.global.set_position = function()
	local id = js.global._SET_POSITION_ID
	local x = js.global._SET_POSITION_X
	local y = js.global._SET_POSITION_Y
	
	SCENE[id].x = x
	SCENE[id].y = y
end

js.global.add_keys = function()
	local id = js.global.ID
	local has_press = js.global.HAS_PRESS
	SCENE[id]._has_press = has_press
	
	SCENE[id]._keys = {}
	for k,v in pairs(js.global.KEYS) do
		SCENE[id]._keys[v] = true
	end
end


js.global.run_press = function()
	local key = js.global.KEY
	local press_callback_name = "press_" .. key
	
	PRESS_HOLD_KEYS[key] = {}
	
	for id, scene_object in pairs(SCENE) do
		if scene_object[press_callback_name] then
			local result = scene_object[press_callback_name](scene_object)
			
			if (result and result[NAME] ~= "ONCE") or result == nil then
				PRESS_HOLD_KEYS[key][id] = scene_object
			end
		end
	end
	
end

js.global.run_unpress = function()
	local key = js.global.KEY
	local unpress_callback_name = "unpress_" .. key
	
	for id, scene_object in pairs(SCENE) do
		if scene_object[unpress_callback_name] then
			scene_object[unpress_callback_name](scene_object)
		end
	end
	
	PRESS_HOLD_KEYS[key] = {}
end


js.global.run_hover = function()
	local id = js.global.ID
	local hover_object = SCENE[id]:hover()
	
	if hover_object and hover_object[NAME] == "HOLD" then
		HOVER_HOLD[id] = SCENE[id]
	end
end

js.global.run_unhover = function()
	local id = js.global.ID
	
	if SCENE[id].unhover then
		SCENE[id]:unhover()
	end
	
	HOVER_HOLD = {}
end


js.global.run_click = function()
	local id = js.global.ID
	local click_object = SCENE[id]:click()
	if click_object and click_object[NAME] == "HOLD" then
		CLICK_HOLD[id] = SCENE[id]
	end
end

js.global.run_unclick = function()
	local id = js.global.ID
		
	if SCENE[id].unclick then
		SCENE[id]:unclick()
	end

	CLICK_HOLD = {}
end


js.global.run_draw = function()
	local id = js.global.DRAW_ID
	
	if SCENE[id].draw then
		SCENE[id]:draw()
	end
end


js.global.run_collide = function()
	local id1 = js.global.COLLIDE_ID1
	local id2 = js.global.COLLIDE_ID2
	SCENE[id1]:collide(SCENE[id2])
	SCENE[id2]:collide(SCENE[id1])
end

js.global.run_overlap = function()
	local id1 = js.global.OVERLAP_ID1
	local id2 = js.global.OVERLAP_ID2
	SCENE[id1]:overlap(SCENE[id2])
	SCENE[id2]:overlap(SCENE[id1])
end


${luaSegments.create}

js.global.game_update = function()
	${luaSegments.update}
	
	for input_key, v in pairs(PRESS_HOLD_KEYS) do
		local press_callback_name = "press_" .. input_key
		
		for id, scene_object in pairs(PRESS_HOLD_KEYS[input_key]) do
			if scene_object[press_callback_name] then
				scene_object[press_callback_name](scene_object)
			end
		end
	end
	
	
	for id, scene_object in pairs(HOVER_HOLD) do
		if scene_object and scene_object.hover then
			scene_object:hover()
		end
	end

	for id, scene_object in pairs(CLICK_HOLD) do
		if scene_object and scene_object.click then
			scene_object:click()
		end
	end
	
	update_scene()
end

update_scene()
`
}