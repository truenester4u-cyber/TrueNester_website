import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NewsletterSubscriber } from '@/types/newsletter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Mail, Search, Download, Trash2, Users, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Production backend URL (Render) - fallback to localhost for development
const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
const PRODUCTION_API_URL = 'https://truenester-api.onrender.com/api';
const API_BASE_URL = import.meta.env.VITE_ADMIN_API_URL || (isProduction ? PRODUCTION_API_URL : 'http://localhost:4001/api');

const AdminNewsletter = () => {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscribers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = subscribers.filter((sub) =>
        sub.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSubscribers(filtered);
    } else {
      setFilteredSubscribers(subscribers);
    }
  }, [searchTerm, subscribers]);

  const fetchSubscribers = async () => {
    try {
      console.log('📧 Fetching newsletter subscribers...');
      
      // Try backend API first (uses service role key, bypasses RLS)
      try {
        const response = await fetch(`${API_BASE_URL}/newsletter/subscribers`);
        const result = await response.json();
        
        if (response.ok && result.success) {
          console.log(`✅ Loaded ${result.data.length} subscribers via backend API`);
          setSubscribers(result.data || []);
          setFilteredSubscribers(result.data || []);
          return;
        }
        console.warn('⚠️ Backend API failed, trying Supabase direct...');
      } catch (apiError) {
        console.warn('⚠️ Backend API unavailable, using Supabase fallback...');
      }

      // Fallback: Direct Supabase query
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (error) throw error;
      console.log(`✅ Loaded ${data?.length || 0} subscribers via Supabase`);
      setSubscribers(data || []);
      setFilteredSubscribers(data || []);
    } catch (error: any) {
      console.error('❌ Error fetching subscribers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load newsletter subscribers.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      console.log(`🗑️ Deleting subscriber: ${id}`);
      
      // Try backend API first
      try {
        const response = await fetch(`${API_BASE_URL}/newsletter/subscribers/${id}`, {
          method: 'DELETE',
        });
        const result = await response.json();
        
        if (response.ok && result.success) {
          console.log('✅ Subscriber deleted via backend API');
          toast({
            title: 'Success',
            description: 'Subscriber deleted successfully.',
          });
          fetchSubscribers();
          return;
        }
        console.warn('⚠️ Backend API delete failed, trying Supabase...');
      } catch (apiError) {
        console.warn('⚠️ Backend API unavailable, using Supabase fallback...');
      }

      // Fallback: Direct Supabase delete
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Subscriber deleted via Supabase');
      toast({
        title: 'Success',
        description: 'Subscriber deleted successfully.',
      });

      fetchSubscribers();
    } catch (error: any) {
      console.error('❌ Error deleting subscriber:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete subscriber.',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Email', 'Status', 'Source', 'Subscribed At', 'IP Address'],
      ...filteredSubscribers.map((sub) => [
        sub.email,
        sub.status,
        sub.source,
        new Date(sub.subscribed_at).toLocaleString(),
        sub.ip_address || 'N/A',
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Subscribers exported successfully.',
    });
  };

  const activeCount = subscribers.filter((s) => s.status === 'active').length;
  const unsubscribedCount = subscribers.filter((s) => s.status === 'unsubscribed').length;
  const todayCount = subscribers.filter(
    (s) => new Date(s.created_at).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Newsletter Subscribers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your newsletter subscriber list
          </p>
        </div>
        <Button onClick={handleExportCSV} disabled={filteredSubscribers.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscribers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeCount} active, {unsubscribedCount} unsubscribed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((activeCount / subscribers.length) * 100 || 0).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Subscribed today</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Subscribers Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredSubscribers.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No subscribers found matching your search.' : 'No subscribers yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Subscribed At</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscribers.map((subscriber) => (
                    <TableRow key={subscriber.id}>
                      <TableCell className="font-medium">{subscriber.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={subscriber.status === 'active' ? 'default' : 'secondary'}
                        >
                          {subscriber.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{subscriber.source}</TableCell>
                      <TableCell>
                        {new Date(subscriber.subscribed_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {subscriber.ip_address || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(subscriber.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the subscriber
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminNewsletter;
