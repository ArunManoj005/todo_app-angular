export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;  
  updatedAt: string; 
  pinned?: boolean;
  color?: 'yellow' | 'blue' | 'green' | 'default' | '';  
  image?: string | null;   

}
