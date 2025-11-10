import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface QueueRestrictionBannerProps {
  shopName: string;
}

const QueueRestrictionBanner = ({ shopName }: QueueRestrictionBannerProps) => {
  return (
    <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
      <AlertCircle className="h-5 w-5 text-amber-500" />
      <AlertDescription className="text-amber-600 dark:text-amber-400">
        You already have an active queue at <strong>{shopName}</strong>. Please complete or cancel that queue before joining another shop's queue.
      </AlertDescription>
    </Alert>
  );
};

export default QueueRestrictionBanner;
