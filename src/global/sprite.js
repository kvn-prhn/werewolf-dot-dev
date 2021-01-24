window.mirrorSprite = () => {
  const index = window.MIRROR_ID - 1;
  const sceneObject = SCENE[index];
  
  if (sceneObject.obj) {
    sceneObject.obj.flipX = window.MIRROR_X;
  }
}

window.flipSprite = () => {
  const index = window.FLIP_ID - 1;
  const sceneObject = SCENE[index];
  
  if (sceneObject.obj) {
    sceneObject.obj.flipY = window.FLIP_Y;
  }
}

window.animateSprite = () => {
  const index = window.ANIMATE_ID - 1;
  const sceneObject = SCENE[index];
  
  if (sceneObject.obj && sceneObject.obj.anims) {
    sceneObject.obj.anims.play(window.ANIMATE_NAME);
  }
}

window.unanimateSprite = () => {
  const index = window.UNANIMATE_ID - 1;
  const sceneObject = SCENE[index];
  
  if (sceneObject.obj && sceneObject.obj.anims) {
    sceneObject.obj.anims.pause();
    sceneObject.obj.anims.setProgress(0);
  }
}
