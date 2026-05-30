import { useRef } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

const reviews = [
  {
    name: 'Mark',
    image: '/mark.jpg',
    rating: 5,
    text: 'The Swift Payment Tracker takes the guesswork out of international transfers. Estimated arrival times are accurate to within minutes. Fantastic tool.',
  },
  {
    name: 'David',
    image: '/david.jpg',
    rating: 5,
    text: 'I rely on the Swift Payment Tracker for business payments. Enter the transfer details and it tells you when funds will land. Never have to chase payments again.',
  },
  {
    name: 'Victor',
    image: '/victor.jpg',
    rating: 5,
    text: 'A must-have for anyone sending money abroad. Shows the real-time journey of a Swift payment and predicts arrival times with impressive accuracy.',
  },
  {
    name: 'Moses',
    image: '/moses.jpg',
    rating: 5,
    text: 'The platform monitors every hop a payment makes and gives a clear ETA. Tracked a tricky international transfer accurately down to the hour. Brilliant.',
  },
];

const ReviewSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = 340;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="py-12 bg-muted/30 rounded-2xl mt-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">User Reviews</h2>
            <p className="text-sm text-muted-foreground mt-1">Trusted by senders worldwide</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center hover:bg-accent transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center hover:bg-accent transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto px-4 md:px-6 lg:px-8 pb-4 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="shrink-0 w-1" />
        {reviews.map((review) => (
          <div
            key={review.name}
            className="shrink-0 w-[280px] sm:w-[300px] bg-card border border-border rounded-xl p-5 snap-start hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-4">
              <img
                src={review.image}
                alt={review.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-sm">{review.name}</p>
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} size={11} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p>
          </div>
        ))}
        <div className="shrink-0 w-1" />
      </div>
    </section>
  );
};

export default ReviewSection;
