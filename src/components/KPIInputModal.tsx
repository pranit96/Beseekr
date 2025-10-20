// KPI Input Modal - Allows users to enter accurate KPI values
import React, { useState } from 'react';
import { X, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface LowConfidenceKPI {
    kpi: string;
    confidence: number;
    value?: number;
    unit?: string;
    threshold: number;
    canImprove: boolean;
}

interface KPIInputModalProps {
    sessionId: string;
    lowConfidenceKPIs: LowConfidenceKPI[];
    onSubmit: (values: Record<string, any>) => Promise<void>;
    onClose: () => void;
}

const formatKPIName = (kpi: string): string => {
    const names: Record<string, string> = {
        mrr: 'Monthly Recurring Revenue',
        arr: 'Annual Recurring Revenue',
        cac: 'Customer Acquisition Cost',
        ltv: 'Lifetime Value',
        customers: 'Total Customers',
        churn_rate: 'Churn Rate',
        conversion_rate: 'Conversion Rate'
    };
    return names[kpi] || kpi.toUpperCase();
};

const getPlaceholder = (kpi: string, unit?: string): string => {
    if (unit === 'percent') return 'Enter percentage (0-100)';
    if (unit === 'USD') return 'Enter amount';
    return 'Enter value';
};

const getSuffix = (unit?: string): string => {
    if (unit === 'USD') return '$';
    if (unit === 'percent') return '%';
    return '';
};

export const KPIInputModal: React.FC<KPIInputModalProps> = ({
    sessionId,
    lowConfidenceKPIs,
    onSubmit,
    onClose
}) => {
    const [values, setValues] = useState<Record<string, string>>({});
    const [source, setSource] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const submitData: Record<string, any> = {
                source: source || 'user_input',
                notes: notes,
                currency: 'USD'
            };

            // Add KPI values
            lowConfidenceKPIs.forEach(kpi => {
                if (values[kpi.kpi] !== undefined && values[kpi.kpi] !== '') {
                    let value = parseFloat(values[kpi.kpi]);

                    // Convert percentage to decimal
                    if (kpi.unit === 'percent') {
                        value = value / 100;
                    }

                    submitData[kpi.kpi] = value;
                }
            });

            await onSubmit(submitData);
        } catch (error) {
            console.error('Failed to submit KPI values:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasValues = Object.values(values).some(v => v !== '');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-background border rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Improve Analysis Accuracy
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Enter accurate values for the following metrics
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={onClose}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-auto">
                    <div className="p-6 space-y-6">
                        {/* KPI Inputs */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-foreground">Metric Values</h3>
                            {lowConfidenceKPIs.map((kpi) => (
                                <div key={kpi.kpi} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor={kpi.kpi} className="text-sm font-medium">
                                            {formatKPIName(kpi.kpi)}
                                        </Label>
                                        <span className="text-xs text-amber-600">
                                            Current confidence: {(kpi.confidence * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="relative">
                                        {getSuffix(kpi.unit) === '$' && (
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                $
                                            </span>
                                        )}
                                        <Input
                                            id={kpi.kpi}
                                            type="number"
                                            step="any"
                                            placeholder={getPlaceholder(kpi.kpi, kpi.unit)}
                                            value={values[kpi.kpi] || ''}
                                            onChange={(e) => setValues({ ...values, [kpi.kpi]: e.target.value })}
                                            className={getSuffix(kpi.unit) === '$' ? 'pl-7' : ''}
                                        />
                                        {getSuffix(kpi.unit) === '%' && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                %
                                            </span>
                                        )}
                                    </div>
                                    {kpi.value !== undefined && (
                                        <p className="text-xs text-muted-foreground">
                                            Current estimate: {kpi.unit === 'USD' ? '$' : ''}{kpi.value.toLocaleString()}{kpi.unit === 'percent' ? '%' : ''}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Additional Fields */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="space-y-2">
                                <Label htmlFor="source" className="text-sm font-medium">
                                    Data Source <span className="text-muted-foreground font-normal">(optional)</span>
                                </Label>
                                <Input
                                    id="source"
                                    type="text"
                                    placeholder="e.g., Stripe dashboard, Financial report, Analytics"
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes" className="text-sm font-medium">
                                    Notes <span className="text-muted-foreground font-normal">(optional)</span>
                                </Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Any additional context or clarifications..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="min-h-[80px] resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t bg-muted/30">
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-xs text-muted-foreground">
                                {hasValues ? 'Your data will be used to reprocess the analysis' : 'Enter at least one value to continue'}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!hasValues || isSubmitting}
                                    className="gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit & Reprocess'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
