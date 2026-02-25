import { useState, useRef, useCallback } from 'react';
import { Paperclip, X, FileText, FileSpreadsheet, FileType, Image, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';

interface UploadedFile {
    id: string;
    name: string;
    type: string;
    size: number;
    size_readable: string;
    storage_path: string;
    url: string | null;
}

interface ChatFileUploadProps {
    onFilesUploaded: (files: UploadedFile[]) => void;
    attachedFiles: UploadedFile[];
    onRemoveFile: (fileId: string) => void;
    disabled?: boolean;
}

const ALLOWED_EXTENSIONS = [
    '.pdf', '.doc', '.docx', '.csv', '.xls', '.xlsx',
    '.txt', '.md', '.html', '.json',
    '.jpg', '.jpeg', '.png', '.webp', '.gif',
];

const FILE_ICON_MAP: Record<string, React.ElementType> = {
    'application/pdf': FileText,
    'application/msword': FileType,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileType,
    'text/csv': FileSpreadsheet,
    'application/vnd.ms-excel': FileSpreadsheet,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileSpreadsheet,
    'image/jpeg': Image,
    'image/png': Image,
    'image/webp': Image,
    'image/gif': Image,
};

const FILE_COLOR_MAP: Record<string, string> = {
    'application/pdf': 'text-red-400',
    'text/csv': 'text-green-400',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'text-green-400',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'text-blue-400',
    'image/jpeg': 'text-purple-400',
    'image/png': 'text-purple-400',
};

export function ChatFileUpload({ onFilesUploaded, attachedFiles, onRemoveFile, disabled }: ChatFileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = useCallback(async (fileList: FileList | File[]) => {
        const files = Array.from(fileList);
        if (files.length === 0) return;

        // Validate
        const maxSize = 50 * 1024 * 1024;
        for (const file of files) {
            if (file.size > maxSize) {
                setError(`${file.name} exceeds 50MB limit`);
                return;
            }
            const ext = '.' + file.name.split('.').pop()?.toLowerCase();
            if (!ALLOWED_EXTENSIONS.includes(ext)) {
                setError(`${file.name}: unsupported type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
                return;
            }
        }

        if (attachedFiles.length + files.length > 5) {
            setError('Maximum 5 files per message');
            return;
        }

        setError(null);
        setUploading(true);

        try {
            const response = await apiClient.uploadChatFiles(files);
            if (response.success && response.data) {
                onFilesUploaded(response.data);
            } else {
                setError(response.error || 'Upload failed');
            }
        } catch (err: any) {
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [attachedFiles, onFilesUploaded]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (!disabled && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    }, [disabled, handleFiles]);

    return (
        <div className="relative">
            {/* Drop zone overlay */}
            {dragOver && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-xl">
                    <p className="text-sm font-medium text-primary">Drop files here</p>
                </div>
            )}

            {/* Attached files preview */}
            {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {attachedFiles.map((file) => {
                        const Icon = FILE_ICON_MAP[file.type] || FileText;
                        const color = FILE_COLOR_MAP[file.type] || 'text-muted-foreground';
                        return (
                            <div
                                key={file.id}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 border border-border/50 max-w-[200px] group"
                            >
                                <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                                <span className="text-xs truncate text-foreground/80" title={file.name}>
                                    {file.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground shrink-0">{file.size_readable}</span>
                                <button
                                    onClick={() => onRemoveFile(file.id)}
                                    className="p-0.5 rounded hover:bg-destructive/20 transition opacity-0 group-hover:opacity-100"
                                    title="Remove file"
                                >
                                    <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="text-xs text-destructive mb-2 flex items-center gap-1">
                    <X className="w-3 h-3" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-1 underline">dismiss</button>
                </div>
            )}

            {/* Upload button + drop target */}
            <div
                onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={ALLOWED_EXTENSIONS.join(',')}
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                    className="hidden"
                    disabled={disabled || uploading}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || uploading || attachedFiles.length >= 5}
                    className="h-8 w-8 rounded-lg hover:bg-muted/80 transition"
                    title={uploading ? 'Uploading...' : attachedFiles.length >= 5 ? 'Max 5 files' : 'Attach files (PDF, DOCX, CSV, images)'}
                >
                    {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                    )}
                </Button>
            </div>
        </div>
    );
}
