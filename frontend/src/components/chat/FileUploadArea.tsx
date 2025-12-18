import React, { useRef, useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';

interface FileUploadAreaProps {
    onFileSelect: (file: File) => void;
    isLoading: boolean;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({ onFileSelect, isLoading }) => {
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
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer mb-6 ${isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
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

            <div className="flex flex-col items-center gap-2 text-slate-500">
                <Upload className="w-8 h-8 text-blue-500" />
                <p className="font-medium text-slate-700">Click or drag file to analyze</p>
                <p className="text-xs">Supports PDF, TXT</p>
            </div>
        </div>
    );
};

export default FileUploadArea;
