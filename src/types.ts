export interface Submission {
  _id?: string; // MongoDB id
  id: string;   // fallback unique id
  name: string;
  email: string;
  message: string;
  createdAt: string;
  status: 'new' | 'read' | 'replied';
  notes?: string;
}

export interface AdminStats {
  total: number;
  new: number;
  read: number;
  replied: number;
}
