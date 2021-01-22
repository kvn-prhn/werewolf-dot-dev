// Spawn
document.addEventListener("spawn", (e) => {
  const sceneObject = {
    ...e.detail,
    ...sceneObjectTemplate,
  }
  
  // Check for any "__press_" properties
  const checkPress = "__press_";
  const pressProperties = Object.keys(sceneObject).filter((key) => key.startsWith(checkPress));
  const keys = pressProperties.map((property) => property.split(checkPress)[1]);
  
  // Set variables accordingly
  window.HAS_PRESS = pressProperties.length > 0;
  window.KEYS = keys
  window.ID = sceneObject.id;
  
  // Call Lua-side
  window.add_keys();
  
  // Add to refs
  refSceneObjects.push(sceneObject);
  
  if (window._create) {
    _create(sceneObject);
  }
});

// Destroy
document.addEventListener("destroy", (e) => {
  const index = e.detail.id - 1;
  const sceneObject = refSceneObjects[index];
  
  // Ref scene objects
  const lastSceneObject = refSceneObjects.pop();
  
  if (refSceneObjects.length) {
    lastSceneObject.id = e.detail.id;
    refSceneObjects[index] = lastSceneObject;
  }
  
  // // Window scene objects
  // const lastWindowSceneObject = window.SCENE.pop();
  
  // if (lastWindowSceneObject && lastWindowSceneObject.length) {
  //   lastWindowSceneObject.id = e.detail.id;
  //   window.SCENE[index] = lastWindowSceneObject;
  // }
  
  // Destroy the game objects
  if (sceneObject._img) {
    sceneObject._img.destroy();
  }
  
  if (sceneObject._text) {
    sceneObject._text.destroy();
  }
});