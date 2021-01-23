window._updateSceneObject = () => {
  const { x, y, id } = window.LUA_SCENE_OBJECT;
  const index = id - 1;
  const sceneObject = SCENE[index];
  
  if (sceneObject._img) {
    sceneObject._img.x = x;
  }
}