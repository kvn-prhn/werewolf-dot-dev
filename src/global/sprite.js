window.mirrorSprite = () => {
  const index = window.MIRROR_ID - 1;
  const sceneObject = refSceneObjects[index];
  
  if (sceneObject._img) {
    sceneObject._img.flipX = window.MIRROR_X
  }
}

window.flipSprite = () => {
  const index = window.FLIP_ID - 1;
  const sceneObject = refSceneObjects[index];
  
  if (sceneObject._img) {
    sceneObject._img.flipY = window.FLIP_Y
  }
}

window.animateSprite = () => {
  const index = window.ANIMATE_ID - 1;
  const sceneObject = refSceneObjects[index];
  
  if (sceneObject._img && sceneObject._img.anims) {
    sceneObject._img.anims.play(window.ANIMATE_NAME);
  }
}

window.unanimateSprite = () => {
  const index = window.UNANIMATE_ID - 1;
  const sceneObject = refSceneObjects[index];
  
  if (sceneObject._img && sceneObject._img.anims) {
    // sceneObject._img.anims.stop();
    sceneObject._img.anims.pause();
    sceneObject._img.anims.setProgress(0);
  }
}
