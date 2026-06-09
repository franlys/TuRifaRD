import React, { useRef, useState } from 'react';
import { Upload, X, CheckSquare, Square } from 'lucide-react';

interface DepositUploaderProps {
  onFileSelect: (file: File | null) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export const DepositUploader: React.FC<DepositUploaderProps> = ({
  onFileSelect,
  onSubmit,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      onFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const clearSelection = () => {
    setPreviewUrl(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg mx-auto mt-4">
      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
          📝 COMPROBANTE DE PAGO
        </h4>
        <p className="text-xs text-text-muted">Sube una foto o captura de pantalla legible del depósito realizado</p>
      </div>

      {/* Drag & Drop Zone / Preview */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !previewUrl && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all duration-200 cursor-pointer ${
          isDragActive 
            ? 'border-accent-gold bg-accent-gold-muted' 
            : 'border-border-color-light hover:border-accent-gold-border hover:bg-[rgba(255,255,255,0.02)]'
        }`}
        style={{ minHeight: '180px' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />

        {previewUrl ? (
          <div className="w-full flex flex-col items-center gap-3 relative" onClick={(e) => e.stopPropagation()}>
            <img 
              src={previewUrl} 
              alt="Vista previa comprobante" 
              className="max-h-48 rounded-lg border object-contain"
              style={{ borderColor: 'var(--border-color-light)' }} 
            />
            <button
              type="button"
              onClick={clearSelection}
              className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white border-2 border-bg-primary transition-all duration-150"
            >
              <X size={16} />
            </button>
            <span className="text-xs text-success font-medium">¡Comprobante cargado con éxito!</span>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <Upload size={20} style={{ color: 'var(--accent-gold)' }} />
            </div>
            <div className="text-center">
              <span className="text-sm font-semibold text-white block">Subir Foto / Captura</span>
              <span className="text-xs text-text-muted block mt-1">Arrastra aquí o haz clic para buscar</span>
            </div>
          </>
        )}
      </div>

      {/* Terms & Conditions Acceptance */}
      <div 
        className="flex items-start gap-3 cursor-pointer select-none text-left max-w-md mx-auto"
        onClick={() => setAcceptedTerms(!acceptedTerms)}
      >
        <span style={{ color: acceptedTerms ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
          {acceptedTerms ? <CheckSquare size={20} /> : <Square size={20} />}
        </span>
        <p className="text-xs text-text-secondary leading-normal">
          Acepto los <span className="text-white hover:underline cursor-pointer">Términos y Condiciones</span> y declaro que he realizado la transferencia bancaria con el nombre correspondiente.
        </p>
      </div>

      {/* Confirm Button */}
      <button
        type="button"
        disabled={!previewUrl || !acceptedTerms || disabled}
        onClick={onSubmit}
        className={`w-full py-4 rounded-xl font-bold tracking-wider text-sm transition-all duration-150 uppercase ${
          previewUrl && acceptedTerms && !disabled
            ? 'glow-gold text-bg-primary hover:scale-[1.02] cursor-pointer'
            : 'bg-border-color-light text-text-muted cursor-not-allowed'
        }`}
        style={{
          background: previewUrl && acceptedTerms && !disabled ? 'linear-gradient(135deg, #f3cf65 0%, #d4af37 100%)' : 'var(--border-color-light)'
        }}
      >
        Confirmar Compra
      </button>
    </div>
  );
};
