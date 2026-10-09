import { Activity } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center p-12">
      <div className="flex flex-col items-center space-y-4">
        <Activity className="h-10 w-10 text-indigo-600 animate-pulse" />
        <p className="text-sm font-medium text-gray-500">Loading data...</p>
      </div>
    </div>
  );
}
