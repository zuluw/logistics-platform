import { cn } from '../utils/cn.js';

export function Card({ children, className = '', title, subtitle, headerRight, footer, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/80 bg-white shadow-xs transition-shadow hover:shadow-sm',
        className
      )}
      {...props}
    >
      {(title || subtitle || headerRight) && (
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
}

export default Card;
