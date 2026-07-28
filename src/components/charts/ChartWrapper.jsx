import React from 'react';
import { Card } from '../ui/Card';

/**
 * Reusable chart wrapper with title, subtitle, and icon
 */
const ChartWrapper = React.memo(({ title, subtitle, icon: Icon, iconBgClass, children }) => (
    <Card className="min-h-[400px]">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h3 className="font-bold text-white text-lg">{title}</h3>
                <p className="text-sm text-slate-400">{subtitle}</p>
            </div>
            {Icon && (
                <div className={`p-2 ${iconBgClass} rounded-lg`}>
                    <Icon className="text-current" size={20} />
                </div>
            )}
        </div>
        <div className="h-[300px] w-full">
            {children}
        </div>
    </Card>
));

ChartWrapper.displayName = 'ChartWrapper';

export default ChartWrapper;
