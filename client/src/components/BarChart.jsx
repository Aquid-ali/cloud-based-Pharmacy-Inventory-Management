import React from 'react';

/**
 * Minimal grouped bar chart built with plain CSS (no charting library, per
 * the app's lean-dependency policy) - always fed real aggregated data from
 * the backend (see saleController.getSalesStats' monthlyTrend/
 * paymentMethodBreakdown), never a fabricated placeholder. `series` is
 * [{ key, label, color }]; each `data` entry is `{ label, [seriesKey]: value, color? }`
 * - `color` on a data point overrides the series color, useful for a
 * single-series chart comparing distinct categories (e.g. Revenue/Cost/Profit).
 */
const BarChart = ({ title, data, series, valueFormatter = (v) => `${v}`, height = 200 }) => {
  const hasData = data.some((d) => series.some((s) => (d[s.key] || 0) > 0));
  const max = Math.max(1, ...data.flatMap((d) => series.map((s) => d[s.key] || 0)));

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h3 className="font-display font-bold text-slate-800">{title}</h3>
        {series.length > 1 && (
          <div className="flex items-center gap-3">
            {series.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className={`w-2 h-2 rounded-full ${s.color}`} /> {s.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {!hasData ? (
        <div style={{ height }} className="flex items-center justify-center text-xs text-slate-400">
          No sales recorded yet for this period.
        </div>
      ) : (
        <div className="flex items-end gap-4" style={{ height }}>
          {data.map((d) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div className="flex items-end gap-1 h-full w-full justify-center">
                {series.map((s) => (
                  <div
                    key={s.key}
                    className="flex-1 max-w-[22px] h-full flex flex-col justify-end"
                    title={`${s.label}: ${valueFormatter(d[s.key] || 0)}`}
                  >
                    <div
                      className={`w-full rounded-t-md transition-all ${d.color || s.color}`}
                      style={{ height: `${Math.max(2, ((d[s.key] || 0) / max) * 100)}%` }}
                    />
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 font-medium text-center">{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BarChart;
