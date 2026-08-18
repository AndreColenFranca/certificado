const sharp = require('sharp');

// Remove white background e deixa transparente
sharp('public/assinatura2.png')
  .ensureAlpha() // Garante canal alpha
  .toColorspace('srgb')
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    // Remove fundo branco (RGB 255, 255, 255)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Se for branco, deixa transparente
      if (r > 240 && g > 240 && b > 240) {
        data[i + 3] = 0; // Alpha = 0 (transparente)
      }
    }
    
    return sharp(data, {
      raw: { width: info.width, height: info.height, channels: 4 }
    }).png().toFile('public/assinatura2.png');
  })
  .then(() => console.log('✓ Fundo branco removido, imagem agora é transparente'))
  .catch(err => console.error('Erro:', err));
