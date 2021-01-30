window._updateSceneObject = () => {
  const { x, y, id, _is_dead } = window.LUA_SCENE_OBJECT;
  const index = id - 1;
  const sceneObject = SCENE[index];
  
  if (_is_dead) {
    const lastSceneObject = SCENE.pop();
    const doesNotMatchLastObject = lastSceneObject.id !== sceneObject.id;
    
    if (SCENE.length > 0 && doesNotMatchLastObject) {
      lastSceneObject.id = id;
      SCENE[index] = lastSceneObject;
    }
    
    sceneObject.obj.destroy();
  }
  else if (sceneObject && sceneObject.obj) {
    sceneObject.obj.x = x;
    sceneObject.obj.y = y;

    // TODO: what other values need to be passed between
    //  Lua and Javascript?
    if (window.LUA_SCENE_OBJECT._class_name == "Text")
    {
      if (window.LUA_SCENE_OBJECT.content && sceneObject.obj.setText && 
          window.LUA_SCENE_OBJECT.content != sceneObject.obj.text) { 
        sceneObject.obj.setText(window.LUA_SCENE_OBJECT.content);
      } 
    }

    if (window.LUA_SCENE_OBJECT.color && sceneObject.obj.style && 
        sceneObject.obj.style.color && sceneObject.obj.style.setColor &&
        window.LUA_SCENE_OBJECT.color != sceneObject.obj.style.color.substr(1)) { 
       sceneObject.obj.style.setColor("#" + window.LUA_SCENE_OBJECT.color); 
    }
  }
}