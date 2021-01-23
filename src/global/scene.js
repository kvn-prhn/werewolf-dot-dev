window._updateSceneObject = () => {
  const { x, y, id } = window.LUA_SCENE_OBJECT;
  const index = id - 1;
  const sceneObject = SCENE[index];
  const gameObject = sceneObject._img || sceneObject._text;
  
  if (gameObject) {
    gameObject.x = x;
    gameObject.y = y;
  }
}