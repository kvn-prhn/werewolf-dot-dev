window.drawLine = () => {
  const {
    x1 = 0,
    y1 = 0,
    x2 = x1,
    y2 = y1,
    thickness = 1,
    color = 0x00aaff,
    opacity = 1,
  } = window.LINE_CONFIG;
  
  graphics.lineStyle(thickness, color, opacity);
  graphics.lineBetween(x1, y1, x2, y2);
}

window.drawRectangle = () => {
  const {
    x = 0,
    y = 0,
    width = 1,
    height = 1,
    thickness = 1,
    color = 0x00aaff,
    opacity = 1,
    stroke,
  } = window.RECTANGLE_CONFIG;
  
  graphics.lineStyle(thickness, stroke, opacity);
  graphics.fillStyle(color, opacity);
  graphics.fillRect(x, y, width, height);
  
  if (stroke) {
    graphics.strokeRect(x, y, width, height);
  }
}

window.drawEllipse = () => {
  const {
    x = 0,
    y = 0,
    radius = 1,
    thickness = 1,
    color = 0x00aaff,
    opacity = 1,
    height,
    stroke,
  } = window.ELLIPSE_CONFIG;
  
  graphics.lineStyle(thickness, stroke, opacity);
  graphics.fillStyle(color, opacity);
  
  if (height) {
    graphics.fillEllipse(x, y, radius, height);
    
    if (stroke) {
      graphics.strokeEllipse(x, y, radius, height);
    }
  }
  else {
    graphics.fillCircle(x, y, radius);
    
    if (stroke) {
      graphics.strokeCircle(x, y, radius);
    }
  }
}