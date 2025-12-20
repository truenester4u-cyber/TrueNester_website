import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { subscribeToNewsletter } from '@/lib/newsletter';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NewsletterFormProps {
  source?: string;
  className?: string;
}

export const NewsletterForm = ({ source = 'website', className = '' }: NewsletterFormProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    const result = await subscribeToNewsletter({ email, source });

    setIsLoading(false);

    if (result.success) {
      setIsSuccess(true);
      setEmail('');
      toast({
        title: 'Successfully Subscribed!',
        description: 'Thank you for subscribing to our newsletter.',
      });
      
      // Reset success state after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);
    } else {
      toast({
        title: 'Subscription Failed',
        description: result.error || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-3 max-w-md mx-auto ${className}`}>
      <Input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading || isSuccess}
        className="flex-1 px-4 py-3 rounded-md text-gray-900 placeholder:text-gray-500"
        required
      />
      <Button 
        type="submit"
        variant="secondary" 
        size="lg" 
        className="bg-white text-primary hover:bg-white/90"
        disabled={isLoading || isSuccess}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Subscribing...
          </>
        ) : isSuccess ? (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Subscribed!
          </>
        ) : (
          'Subscribe'
        )}
      </Button>
    </form>
  );
};
