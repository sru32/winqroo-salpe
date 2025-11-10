import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Star, Loader2, MessageSquare } from 'lucide-react';
import { mockDb } from '@/services/mockData';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  review_text: string;
  completed_at: string;
  services: {
    name: string;
  };
}

interface ShopReviewsProps {
  shopId: string;
  shopRating: number;
}

const ShopReviews = ({ shopId, shopRating }: ShopReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    loadReviews();
  }, [shopId]);

  const loadReviews = async () => {
    try {
      const queues = mockDb.getQueues();
      const shopQueues = queues
        .filter((q: any) => q.shop_id === shopId && q.rating !== null && q.rating !== undefined)
        .sort((a: any, b: any) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())
        .slice(0, 10);
      
      // Enrich with service info
      const enrichedReviews = shopQueues.map((q: any) => {
        const service = mockDb.getService(q.service_id);
        return {
          ...q,
          services: { name: service?.name || 'Service' }
        };
      });

      setReviews(enrichedReviews);
      setTotalReviews(queues.filter((q: any) => q.shop_id === shopId && q.rating).length);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-2xl font-bold">Customer Reviews</h3>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="text-xl font-bold">{shopRating.toFixed(1)}</span>
            <span className="text-muted-foreground">({totalReviews} reviews)</span>
          </div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No reviews yet. Be the first to leave a review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold">{review.customer_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {review.services.name} • {new Date(review.completed_at).toLocaleDateString()}
                  </p>
                </div>
                {renderStars(review.rating)}
              </div>
              {review.review_text && (
                <p className="text-sm text-muted-foreground mt-2">{review.review_text}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default ShopReviews;
