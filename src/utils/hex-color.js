export function getHexColor(color) {
  // Convert 0x00... into "#00..."
  const baseHexColor = color.toString(16);
  let padZeros = "";
  
  for (let i = 0; i < 6 - baseHexColor.length; i++) {
    padZeros += "0";
  }
  
  const hexColor = "#" + padZeros + baseHexColor;
  return hexColor;
}