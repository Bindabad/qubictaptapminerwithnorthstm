import { X } from 'lucide-react';

interface WelcomeVideoProps {
  onClose: () => void;
}

export default function WelcomeVideo({ onClose }: WelcomeVideoProps) {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 bg-qubic-cyan text-black p-2 rounded-lg hover:bg-qubic-cyan/80 transition-all font-bold"
        >
          <X className="w-6 h-6" />
        </button>
        <video
          className="w-full rounded-xl border-4 border-qubic-cyan shadow-2xl"
          controls
          autoPlay
          src="/welcome.mp4"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}
