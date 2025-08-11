import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';
import React from 'react';

interface QuoteOfTheDayProps {
  className?: string;
}

const quotes: { text: string; author?: string }[] = [
  { text: 'Insurance is not just about risk; it’s about resilience and confidence.', author: 'Abiraksha Insuretech' },
  { text: 'Great customer experience is the best policy you can issue.', author: 'CX Principle' },
  { text: 'Simple workflows, strong compliance—scale follows.', author: 'Platform Mindset' },
  { text: 'Data turns uncertainty into decisions.', author: 'Analytics Maxim' },
  { text: 'Automation pays dividends in every renewal cycle.', author: 'Ops Wisdom' },
  { text: 'Trust is the true currency of insurance.', author: 'Industry Axiom' },
  { text: 'Better tools make better brokers.', author: 'Product Truth' },
  { text: 'Protect today, empower tomorrow.', author: 'Broker Ethos' },
  { text: 'Consistency builds credibility.', author: 'Quality Mantra' },
  { text: 'What you standardize, you can scale.', author: 'Growth Principle' },
];

function getDayOfYearUTC(date = new Date()): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const now = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

const QuoteOfTheDay: React.FC<QuoteOfTheDayProps> = ({ className = '' }) => {
  const index = getDayOfYearUTC() % quotes.length;
  const q = quotes[index];

  return (
    <Card className={`rounded-xl border border-border/50 bg-card p-6 shadow-sm ${className}`}>
      <CardContent className="p-0">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-md border border-border/50 p-2 bg-background/60">
            <Quote className="h-5 w-5 text-primary" />
          </div>
          <div>
            <blockquote className="text-lg md:text-xl leading-relaxed text-foreground">
              “{q.text}”
            </blockquote>
            {q.author && (
              <cite className="mt-2 block text-sm text-muted-foreground">— {q.author}</cite>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuoteOfTheDay;
