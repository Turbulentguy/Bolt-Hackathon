// Type declarations related to file upload functionality

declare interface UploadedFile extends File {
  id?: string;
  progress?: number;
  status?: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}
