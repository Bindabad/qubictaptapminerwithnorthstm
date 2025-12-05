import { Zap } from 'lucide-react';

interface InfoBoxProps {
  title: string;
  features: string[];
}

export default function InfoBox({ title, features }: InfoBoxProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-2xl border-2 border-black">
      <div className="flex items-center gap-3 mb-3">
        <Zap className="w-6 h-6 text-qubic-cyan" />
        <h3 className="text-lg font-bold text-black">{title}</h3>
      </div>
      <ul className="space-y-2 text-sm text-gray-700">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-qubic-cyan mt-1 font-bold">•</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
