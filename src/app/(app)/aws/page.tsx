"use client";

import { useEffect, useState } from 'react';
import { Cloud, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';

export default function AWSPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/aws/health').then(res => {
      setHealth(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold leading-7 text-gray-900">AWS Connection</h2>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center space-x-3 mb-6">
            {health?.connected ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500" />
            )}
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {health?.connected ? 'Connected to AWS' : 'AWS Connection Failed'}
              </h3>
              <p className="text-sm text-gray-500">
                {health?.connected ? `Successfully authenticated and accessed bucket.` : health?.error}
              </p>
            </div>
          </div>

          {health?.connected && (
            <div className="border-t border-gray-200 pt-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Region</dt>
                  <dd className="mt-1 text-sm text-gray-900">{health.region}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">S3 Bucket</dt>
                  <dd className="mt-1 text-sm text-gray-900">{health.bucket}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500 mb-2">Verified Folders</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <ul className="space-y-3 rounded-md border border-gray-200 p-4">
                      {health.folders && Object.entries(health.folders).map(([folder, valid]) => (
                        <li key={folder} className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            <span className="font-mono text-gray-600">{folder.replace('_', '/')}/</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
