import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Shield, ArrowRight, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { QuoteSession } from '@/hooks/useQuoteSession';

interface ResumeQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResume: () => void;
  onStartNew: () => void;
  session: QuoteSession;
}

export const ResumeQuoteModal: React.FC<ResumeQuoteModalProps> = ({
  isOpen,
  onClose,
  onResume,
  onStartNew,
  session
}) => {
  const getStepName = (step: string) => {
    const stepNames: Record<string, string> = {
      'product-selection': 'Product Selection',
      'customer-details': 'Customer Details',
      'quote-result': 'Quote Comparison',
      'addon-selection': 'Add-ons Selection',
      'proposal-form': 'Proposal Form',
      'payment': 'Payment',
      'complete': 'Complete'
    };
    return stepNames[step] || step;
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Resume Previous Quote?
          </DialogTitle>
          <DialogDescription>
            You have an incomplete insurance quote that you can continue from where you left off.
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="font-medium">{session.line_of_business} Insurance</span>
                </div>
                <Badge variant="secondary">
                  {getDaysAgo(session.created_at)}
                </Badge>
              </div>

              {session.selected_quote && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Selected Coverage</div>
                  <div className="font-medium">₹{session.selected_quote.totalPremium?.toLocaleString()} premium</div>
                  {session.sum_insured && (
                    <div className="text-sm text-muted-foreground">
                      Sum Insured: ₹{session.sum_insured.toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current Step:</span>
                <span className="font-medium">{getStepName(session.current_step)}</span>
              </div>

              {session.addons_selected && session.addons_selected.length > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Add-ons selected:</span>
                  <span className="ml-1 font-medium">{session.addons_selected.length}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onStartNew}
          >
            <X className="w-4 h-4 mr-2" />
            Start New Quote
          </Button>
          <Button 
            className="flex-1"
            onClick={onResume}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Continue Quote
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};