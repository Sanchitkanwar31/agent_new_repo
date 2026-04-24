import type { ReactNode } from "react";

export type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: string | number;
  color: string;
};

export function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-[#ef6c00]/30">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-[#0b0f1a] flex-shrink-0 ${color}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-[#455976] font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-[#0f172a]">{value}</p>
      </div>
    </div>
  );
}
