// Type declarations related to file upload functionality

declare interface UploadedFile extends File {
  id?: string;
  progress?: number;
  status?: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

// SVG module declarations
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.svg?react' {
  import { FunctionComponent, SVGProps } from 'react';
  const content: FunctionComponent<SVGProps<SVGElement>>;
  export default content;
}
