import { getHexColor } from "../utils/hex-color";

window._spawn = () => {
  const sceneObject = window.SPAWN_OBJECT;
  const { x, y, angle, _class_name, id } = sceneObject;
  const name = _class_name.toLowerCase();
  
  let isKinematic = _isKinematic(sceneObject);
  let isStatic = _isStatic(sceneObject) || isKinematic;
  
  const ignorePointer = !_collideUsesPointer(sceneObject) && !_overlapUsesPointer(sceneObject);
  const isSensor = sceneObject._overlap_name === "GHOST" ;
  
  const index = id - 1;
  SCENE[index] = sceneObject;
  
  // Text
  if (sceneObject._is_text) {
    const { content, font, size, color } = sceneObject;
    
    let text = phaserContext.add.text(x, y, content, { fontFamily: font, fontSize: size, fill: getHexColor(color) });
    
    if (sceneObject._collide_name) {
      let matterText =
        phaserContext.matter.add.gameObject(text, { isSensor, ignorePointer })
        .setStatic(isStatic)
        .setIgnoreGravity(isSensor || isKinematic)
        .setAngle(angle);
        
      sceneObject.obj = matterText;
    }
    else {
      sceneObject.obj = text;
    }
  }
  // Timers
  else if (sceneObject._is_timer) {
    const { rate, count } = sceneObject;
    const event = {
      delay: rate,
      callbackScope: phaserContext,
      callback: () => {
        sceneObject.fire();
      }
    }
    
    if (count > 0) {
      event.repeat = count - 1;
    }
    else {
      event.loop = true
    }
    
    phaserContext.time.addEvent(event);
  }
  // Images
  else {
    const spriteType = spriteTypeRefs[name];
    const { friction } = sceneObject;
    
    // TODO: Add scale (and a bunch of other properties)
    let img = phaserContext.matter.add[spriteType](x, y, name, null, {
      ignorePointer,
      isSensor,
      friction
    }).setAngle(angle);
    
    // Tweak img
    if (img.texture.key === "__MISSING") {
      img.destroy();
      img = null;
    }
    else {
      img.setStatic(isStatic);
      img.setIgnoreGravity(isSensor || isKinematic || !sceneObject._collide_name);
    }
    
    sceneObject.obj = img;
  }
  
  // Set misc "private" variables
  if (sceneObject._has_hover) {
    sceneObject._hover = false;
    sceneObject._pointer_down = false;
  }
  
  // Set the adjusted sceneObject
  SCENE[index] = sceneObject;
}