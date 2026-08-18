import sharp from 'sharp';

sharp('public/assinatura2.png')
  .ensureAlpha()
  .toColorspace('srgb')
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    // Remove fundo branco
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      if (r > 240 && g > 240 && b > 240) {
        data[i + 3] = 0;
      }
    }
    
    return sharp(data, {
      raw: { width: info.width, height: info.height, channels: 4 }
    }).png().toFile('public/assinatura2.png');
  })
  .then(() => console.log('✓ Transparência aplicada'))
  .catch(err => console.error('Erro:', err));
