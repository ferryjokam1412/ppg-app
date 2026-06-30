// src/components/ui/SummaryCard.jsx
export default function SummaryCard({ icon, color, title, value, trend }) {
  const colorMaps = {
    primary: 'bg-primary-container text-on-primary-container',
    secondary: 'bg-secondary-container text-on-secondary-container',
    error: 'bg-error-container text-on-error-container',
    tint: 'bg-surface-tint text-white'
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-outline-variant ambient-shadow flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 duration-500 pointer-events-none"></div>
      
      <div className="flex justify-between items-start mb-4 z-10">
        <div className={`p-3 rounded-lg ${colorMaps[color] || colorMaps.primary}`}>
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        
        {trend !== 0 && (
          <span className={`flex items-center gap-0.5 text-xs font-bold ${trend > 0 ? 'text-primary' : 'text-error'}`}>
            <span className="material-symbols-outlined text-sm">
              {trend > 0 ? 'trending_up' : 'trending_down'}
            </span>
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      
      <h3 className="font-body-md text-sm text-on-surface-variant z-10 font-semibold">{title}</h3>
      <p className="font-headline-md text-2xl text-on-background font-bold mt-1 z-10">{value}</p>
    </div>
  );
}