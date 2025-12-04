import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';
import type { PricingSignal } from '@/types/problems';

interface PricingSignalsProps {
    signals: PricingSignal[];
}

export function PricingSignals({ signals }: PricingSignalsProps) {
    if (!signals || signals.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Pricing Signals
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No pricing signals available</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Pricing Signals
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {signals.map((signal) => (
                        <li key={signal.id} className="flex items-start gap-2">
                            <Badge
                                variant={signal.confidence >= 0.7 ? 'default' : 'secondary'}
                                className="shrink-0 text-xs"
                            >
                                {Math.round(signal.confidence * 100)}%
                            </Badge>
                            <span className="text-sm">{signal.signal}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

export default PricingSignals;
