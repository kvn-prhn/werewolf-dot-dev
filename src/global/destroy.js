window._destroy = () => {
  const destroyInstance = window.DESTROY_INSTANCE
  const { id } = destroyInstance;
  const index = id - 1;
  const sceneObject = refSceneObjects[index];
  
  // Ref scene objects
  const lastSceneObject = refSceneObjects.pop();
  
  if (refSceneObjects.length) {
    _manualDestory(sceneObject);
    
    lastSceneObject.id = sceneObject.id;
    refSceneObjects[index] = lastSceneObject;
  }
}

window._manualDestory = (sceneObject) => {
  if (sceneObject._img) {
    sceneObject._img.destroy();
  }
  
  if (sceneObject._text) {
    sceneObject._text.destroy();
  }
}