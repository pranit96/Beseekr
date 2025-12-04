import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart3 } from 'lucide-react';
import type { MarketEstimate } from '@/types/problems';

interface MarketEstimateBoxProps {
    estimate: MarketEstimate;
}

export function MarketEstimateBox({ estimate }: MarketEstimateBoxProps) {
    if (!estimate || !estimate.size) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Market Estimate
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No market estimate available</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Market Estimate
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div>
                    <p className="text-2xl font-bold text-primary">{estimate.size}</p>
                    <p className="text-xs text-muted-foreground">Total Addressable Market</p>
                </div>

                {estimate.growth_rate && (
                    <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span>{estimate.growth_rate} growth rate</span>
                    </div>
                )}

                {estimate.confidence !== undefined && (
                    <div className="text-xs text-muted-foreground">
                        Confidence: {Math.round(estimate.confidence * 100)}%
                    </div>
                )}

                {estimate.sources && estimate.sources.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                        Sources: {estimate.sources.join(', ')}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default MarketEstimateBox;
