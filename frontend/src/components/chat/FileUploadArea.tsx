import { Upload } from 'lucide-react';
import React, { useRef, useState } from 'react';

interface FileUploadAreaProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  className?: string;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  onFileSelect,
  isLoading,
  className,
}) => {
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
          ? 'border-[#0f7a6a] bg-[#e8f3f0]'
          : 'border-[#d8cdc6] hover:border-[#a7b9b4] hover:bg-white/70'
      } ${isLoading ? 'pointer-events-none opacity-50' : ''} ${className ?? ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files && onFileSelect(e.target.files[0])}
        className="hidden"
        accept=".pdf,.txt,.md"
      />

      <div className="flex flex-col items-center gap-2 text-[#6b6f6c]">
        <Upload className="h-8 w-8 text-[#0f7a6a]" />
        <p className="font-medium text-[#2c3b3a]">Click or drag file to analyze</p>
        <p className="text-xs">Supports PDF, TXT</p>
      </div>
    </div>
  );
};

export default FileUploadArea;
