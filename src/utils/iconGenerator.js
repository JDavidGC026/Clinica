// Utilidad para generar iconos de la aplicación
export const generateAppIcons = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  const icons = {};
  
  sizes.forEach(size => {
    canvas.width = size;
    canvas.height = size;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, size, size);
    
    // Crear gradiente de fondo
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#d946ef'); // Primary color
    gradient.addColorStop(1, '#a855f7'); // Accent color
    
    // Dibujar fondo con bordes redondeados
    const radius = size * 0.2;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, radius);
    ctx.fill();
    
    // Dibujar icono médico (cruz)
    const crossSize = size * 0.4;
    const crossThickness = size * 0.08;
    const centerX = size / 2;
    const centerY = size / 2;
    
    ctx.fillStyle = 'white';
    
    // Barra horizontal
    ctx.fillRect(
      centerX - crossSize / 2,
      centerY - crossThickness / 2,
      crossSize,
      crossThickness
    );
    
    // Barra vertical
    ctx.fillRect(
      centerX - crossThickness / 2,
      centerY - crossSize / 2,
      crossThickness,
      crossSize
    );
    
    // Convertir a blob y crear URL
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      icons[size] = url;
    }, 'image/png');
  });
  
  return icons;
};

// Función para descargar iconos generados
export const downloadGeneratedIcons = () => {
  const icons = generateAppIcons();
  
  Object.entries(icons).forEach(([size, url]) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `icon-${size}x${size}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
};