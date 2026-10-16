export async function compressImage(file) {
  if (!file) return null;
  if (!file.type.startsWith('image/')) throw new Error('Selecione uma imagem');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.65));
  if (!blob) throw new Error('Não foi possível compactar a imagem');
  if (blob.size > 1.5 * 1024 * 1024) throw new Error('Imagem excede o limite para uso offline (1,5 MB)');
  return new File([blob], 'comprovante.jpg', { type: 'image/jpeg' });
}
