
import React, { useState, useCallback } from "react";
import { Cloud, FileWarning, FileCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface FileUploaderProps {
  onFilesUploaded: (files: File[]) => void;
  isProcessing: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  onFilesUploaded,
  isProcessing 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      const files = Array.from(e.dataTransfer.files);
      const validFiles = files.filter(file => 
        file.name.toLowerCase().endsWith('.html') || 
        file.name.toLowerCase().endsWith('.css')
      );
      
      if (validFiles.length === 0) {
        toast({
          title: "Invalid files",
          description: "Please upload HTML or CSS files only.",
          variant: "destructive",
        });
        return;
      }
      
      onFilesUploaded(validFiles);
    },
    [onFilesUploaded, toast]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      const validFiles = Array.from(files).filter(file => 
        file.name.toLowerCase().endsWith('.html') || 
        file.name.toLowerCase().endsWith('.css')
      );
      
      if (validFiles.length === 0) {
        toast({
          title: "Invalid files",
          description: "Please upload HTML or CSS files only.",
          variant: "destructive",
        });
        return;
      }
      
      onFilesUploaded(validFiles);
      
      // Reset the input value so the same file can be uploaded again if needed
      e.target.value = '';
    },
    [onFilesUploaded, toast]
  );

  return (
    <div 
      className={`
        border-2 border-dashed rounded-lg p-10 transition-all duration-300 
        ${isDragging ? 'border-education bg-blue-50' : 'border-gray-300'} 
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="bg-education-light rounded-full p-4">
          <Cloud className="h-10 w-10 text-education-dark" />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium">
            {isDragging ? "Drop HTML or CSS files here" : "Drag & Drop your HTML or CSS files here"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            or click to browse your files
          </p>
        </div>
        <div className="flex gap-2 mt-2">
          <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
            <FileCheck size={16} className="text-education" />
            <span className="text-xs text-gray-600">Files with MSSV</span>
          </div>
          <div className="flex items-center gap-1 bg-red-50 px-3 py-1 rounded-full">
            <FileWarning size={16} className="text-destructive" />
            <span className="text-xs text-gray-600">Files without MSSV</span>
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="file-upload">
            <Button 
              disabled={isProcessing}
              className="gap-2 bg-education hover:bg-education-dark"
            >
              <Upload size={16} />
              Select HTML or CSS Files
            </Button>
          </label>
          <input
            id="file-upload"
            type="file"
            multiple
            accept=".html,.css"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isProcessing}
          />
        </div>
      </div>
    </div>
  );
};
