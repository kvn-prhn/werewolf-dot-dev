window._updateSceneObject = () => {
  const { x, y, id, _is_dead } = window.LUA_SCENE_OBJECT;
  const index = id - 1;
  const sceneObject = SCENE[index];
  
  if (_is_dead) {
    const lastSceneObject = SCENE.pop();
    const doesLastObjectMatch = lastSceneObject.id === sceneObject.id;
    
    if (SCENE.length > 0 && !doesLastObjectMatch) {
      lastSceneObject.id = id;
      SCENE[index] = lastSceneObject;
    }
    
    sceneObject.obj.destroy();
    
    // if (SCENE.length > 0 && lastSceneObject.id !== sceneObject.id) {
    //   lastSceneObject.id = sceneObject.id;
    //   SCENE[index] = lastSceneObject;
    // }
  }
  else if (sceneObject && sceneObject.obj) {
    sceneObject.obj.x = x;
    sceneObject.obj.y = y;
  }
  
}