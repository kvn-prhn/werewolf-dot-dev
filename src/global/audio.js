window.playSound = () => {
  const name = window.SOUND_NAME.toLowerCase();
  phaserContext.sound.setVolume(0.25);
  soundObjects[name].play();
}

window.pauseSound = () => {
  const name = window.SOUND_NAME.toLowerCase();
  soundObjects[name].pause();
}

window.resumeSound = () => {
  const name = window.SOUND_NAME.toLowerCase();
  phaserContext.sound.setVolume(0.25);
  soundObjects[name].resume();
}

window.stopSound = () => {
  const name = window.SOUND_NAME.toLowerCase();
  soundObjects[name].stop();
}