import { T } from '@tolgee/react';
import { Upload } from 'lucide-react';
import React, { useRef, useState } from 'react';

interface FileUploadAreaProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  className?: string;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({ onFileSelect, isLoading, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`mb-6 cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
        isDragging
          ? 'border-brand bg-brand-soft'
          : 'border-border-muted hover:border-border-strong hover:bg-surface/70'
      } ${isLoading ? 'pointer-events-none opacity-50' : ''} ${className ?? ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClick();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files && onFileSelect(e.target.files[0])}
        className="hidden"
        accept=".pdf,.txt,.md"
      />

      <div className="text-neutral flex flex-col items-center gap-2">
        <Upload className="text-brand h-8 w-8" />
        <p className="text-chat font-medium">
          <T keyName="fileUpload.title" />
        </p>
        <p className="text-xs">
          <T keyName="fileUpload.supports" />
        </p>
      </div>
    </div>
  );
};

export default FileUploadArea;
