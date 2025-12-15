export interface Review {
  id: string;
  name: string | null;
  rating: number;
  headline: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}
