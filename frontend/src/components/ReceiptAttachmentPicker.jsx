import { Camera, FileImage, ImagePlus, RotateCcw, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Visual file picker used for fuel notes and expense receipts.
 * The native inputs stay in the DOM so mobile browsers can invoke the camera.
 */
export default function ReceiptAttachmentPicker({
  label,
  file,
  existingUrl,
  onSelect,
  onClear,
  cameraEnabled = false,
}) {
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const activeUrl = previewUrl || existingUrl;

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const selectFile = async event => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';
    if (selectedFile) await onSelect(selectedFile);
  };

  return (
    <section className="receipt-picker" aria-label={label}>
      <div className="receipt-picker-heading">
        <div>
          <span className="receipt-picker-label">{label}</span>
          <span className="receipt-picker-help">Imagem JPG ou PNG</span>
        </div>
        {file && <span className="receipt-picker-status">Pronto para enviar</span>}
      </div>

      {activeUrl ? (
        <div className="receipt-picker-preview">
          <img src={activeUrl} alt={`Prévia: ${label}`} />
          <div className="receipt-picker-file-details">
            <strong>{file?.name || 'Comprovante salvo'}</strong>
            {file && <span>{Math.max(1, Math.round(file.size / 1024))} KB</span>}
            {existingUrl && !file && <a href={existingUrl} target="_blank" rel="noreferrer">Abrir comprovante</a>}
          </div>
          {file && (
            <button type="button" className="receipt-picker-remove" onClick={onClear} aria-label={`Remover ${label.toLowerCase()}`}>
              <X size={16} /> Remover
            </button>
          )}
        </div>
      ) : (
        <div className="receipt-picker-empty">
          <FileImage size={22} aria-hidden="true" />
          <span>Nenhuma imagem selecionada</span>
        </div>
      )}

      <div className="receipt-picker-actions">
        {cameraEnabled && (
          <button type="button" className="receipt-picker-camera" onClick={() => cameraInputRef.current?.click()}>
            <Camera size={17} /> Tirar foto
          </button>
        )}
        <button type="button" className="receipt-picker-gallery" onClick={() => galleryInputRef.current?.click()}>
          {file || activeUrl ? <RotateCcw size={17} /> : <ImagePlus size={17} />}
          {cameraEnabled ? 'Galeria' : (file || activeUrl ? 'Trocar imagem' : 'Escolher imagem')}
        </button>
      </div>

      <input ref={galleryInputRef} className="receipt-picker-input" type="file" accept="image/*" onChange={selectFile} tabIndex="-1" />
      {cameraEnabled && <input ref={cameraInputRef} className="receipt-picker-input" type="file" accept="image/*" capture="environment" onChange={selectFile} tabIndex="-1" />}
    </section>
  );
}
