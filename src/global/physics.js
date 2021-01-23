window.applyThrust = () => {
  const index = window.THRUST_ID - 1;
  const sceneObject = SCENE[index];
  
  if (sceneObject._img) {
    // Rotate the direction anti-clockwise because why the hell not amirite?
    const direction = 
      window.THRUST_DIRECTION === "Up" ? "Left" :
      window.THRUST_DIRECTION === "Down" ? "Right" :
      window.THRUST_DIRECTION === "Left" ? "Back" :
      window.THRUST_DIRECTION === "Right" ? "" : null;
      
    if (direction !== null) {
      const amount = window.THRUST_AMOUNT;
      sceneObject._img[`thrust${direction}`](amount);
    }
  }
}

window._isKinematic = (sceneObject) => {
  const { _collide_name } = sceneObject;
  return _collide_name && _collide_name.startsWith("KINEMATIC");
}
  
window._collideUsesPointer = (sceneObject) => {
  const { _collide_name } = sceneObject;
  return _collide_name && _collide_name.endsWith("POINTER");
}

window._overlapUsesPointer = (sceneObject) => {
  const { _overlap_name } = sceneObject;
  return _overlap_name && _overlap_name.endsWith("POINTER");
}