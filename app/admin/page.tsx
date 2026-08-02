'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Business {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  reward_code: string;
  feedback_count?: number;
  created_at: string;
}

interface Feedback {
  id: string;
  business_id: string;
  type: string;
  name?: string;
  message?: string;
  created_at: string;
}

export default function AdminDashboard() {
  const supabase = createClient();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [showNewBusinessForm, setShowNewBusinessForm] = useState(false);
  const [newBusiness, setNewBusiness] = useState({
    name: '',
    slug: '',
    logo_url: '',
    google_review_url: '',
    reward_code: 'SAVE10',
    reward_text: '10% off your next visit',
    reward_expiry: '30 days',
  });

  // Check authentication and load businesses
  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setAuthenticated(false);
          setLoading(false);
          return;
        }

        setAuthenticated(true);

        // Load user's businesses
        const { data: businessesData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', user.id);

        if (businessError) throw businessError;

        setBusinesses((businessesData as Business[]) || []);
      } catch (error) {
        console.error('[v0] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supabase]);

  // Load feedback for selected business
  useEffect(() => {
    if (!selectedBusiness) return;

    const loadFeedback = async () => {
      try {
        const { data: feedbackData, error } = await supabase
          .from('feedback')
          .select('*')
          .eq('business_id', selectedBusiness.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setFeedback((feedbackData as Feedback[]) || []);
      } catch (error) {
        console.error('[v0] Error loading feedback:', error);
      }
    };

    loadFeedback();
  }, [selectedBusiness, supabase]);

  // Create new business
  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('businesses')
        .insert([
          {
            ...newBusiness,
            owner_id: user.id,
          },
        ])
        .select();

      if (error) throw error;

      setBusinesses([...businesses, data[0]]);
      setNewBusiness({
        name: '',
        slug: '',
        logo_url: '',
        google_review_url: '',
        reward_code: 'SAVE10',
        reward_text: '10% off your next visit',
        reward_expiry: '30 days',
      });
      setShowNewBusinessForm(false);
    } catch (error) {
      console.error('[v0] Error creating business:', error);
      alert('Error creating business');
    }
  };

  // Delete business
  const handleDeleteBusiness = async (businessId: string) => {
    if (!confirm('Are you sure? This will delete all feedback for this business.')) return;

    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId);

      if (error) throw error;

      setBusinesses(businesses.filter((b) => b.id !== businessId));
      setSelectedBusiness(null);
      setFeedback([]);
    } catch (error) {
      console.error('[v0] Error deleting business:', error);
      alert('Error deleting business');
    }
  };

  // Delete feedback
  const handleDeleteFeedback = async (feedbackId: string) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', feedbackId);

      if (error) throw error;
      setFeedback(feedback.filter((f) => f.id !== feedbackId));
    } catch (error) {
      console.error('[v0] Error deleting feedback:', error);
      alert('Error deleting feedback');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Admin Access Required</h1>
          <p className="mb-6 text-gray-600">Please log in to access the admin dashboard.</p>
          <Link href="/auth/login">
            <Button>Log In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Link href="/auth/login">
            <Button variant="outline">Log Out</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Businesses List */}
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Your Businesses</h2>
              <Button
                onClick={() => setShowNewBusinessForm(!showNewBusinessForm)}
                size="sm"
              >
                + Add
              </Button>
            </div>

            {showNewBusinessForm && (
              <form onSubmit={handleCreateBusiness} className="mb-6 space-y-3 rounded-lg border border-gray-200 p-4">
                <input
                  type="text"
                  placeholder="Business Name"
                  value={newBusiness.name}
                  onChange={(e) =>
                    setNewBusiness({ ...newBusiness, name: e.target.value })
                  }
                  className="w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="URL Slug (e.g., coffee-shop)"
                  value={newBusiness.slug}
                  onChange={(e) =>
                    setNewBusiness({ ...newBusiness, slug: e.target.value })
                  }
                  className="w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="url"
                  placeholder="Logo URL"
                  value={newBusiness.logo_url}
                  onChange={(e) =>
                    setNewBusiness({ ...newBusiness, logo_url: e.target.value })
                  }
                  className="w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="url"
                  placeholder="Google Review URL"
                  value={newBusiness.google_review_url}
                  onChange={(e) =>
                    setNewBusiness({
                      ...newBusiness,
                      google_review_url: e.target.value,
                    })
                  }
                  className="w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Reward Code"
                  value={newBusiness.reward_code}
                  onChange={(e) =>
                    setNewBusiness({ ...newBusiness, reward_code: e.target.value })
                  }
                  className="w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Reward Text"
                  value={newBusiness.reward_text}
                  onChange={(e) =>
                    setNewBusiness({ ...newBusiness, reward_text: e.target.value })
                  }
                  className="w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" className="flex-1">
                    Create
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewBusinessForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {businesses.length === 0 ? (
                <p className="text-gray-500">No businesses yet. Create one to get started!</p>
              ) : (
                businesses.map((business) => (
                  <div
                    key={business.id}
                    onClick={() => setSelectedBusiness(business)}
                    className={`cursor-pointer rounded-lg border-2 p-3 transition-colors ${
                      selectedBusiness?.id === business.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {business.logo_url && (
                        <img
                          src={business.logo_url}
                          alt={business.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{business.name}</p>
                        <p className="text-xs text-gray-500">/{business.slug}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Business Details & Feedback */}
          {selectedBusiness ? (
            <div className="space-y-6 lg:col-span-2">
              {/* Business Info */}
              <div className="rounded-lg bg-white p-6 shadow-lg">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedBusiness.name}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Feedback page:{' '}
                      <code className="rounded bg-gray-100 px-2 py-1">
                        /{selectedBusiness.slug}
                      </code>
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteBusiness(selectedBusiness.id)}
                  >
                    Delete
                  </Button>
                </div>

                <div className="space-y-3 text-sm">
                  <p>
                    <span className="font-semibold text-gray-700">Reward Code:</span>{' '}
                    {selectedBusiness.reward_code}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Reward Text:</span>{' '}
                    {selectedBusiness.reward_code}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-700">Total Feedback:</span>{' '}
                    {feedback.length}
                  </p>
                </div>
              </div>

              {/* Feedback List */}
              <div className="rounded-lg bg-white p-6 shadow-lg">
                <h3 className="mb-4 text-xl font-bold text-gray-900">Recent Feedback</h3>
                <div className="space-y-4">
                  {feedback.length === 0 ? (
                    <p className="text-gray-500">No feedback yet</p>
                  ) : (
                    feedback.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between border-l-4 border-blue-500 bg-gray-50 p-4"
                      >
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                              {item.type === 'positive' ? '⭐ Positive' : '💬 Feedback'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {item.name && (
                            <p className="text-sm font-semibold text-gray-900">
                              {item.name}
                            </p>
                          )}
                          {item.message && (
                            <p className="mt-1 text-sm text-gray-700">{item.message}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFeedback(item.id)}
                          className="ml-2"
                        >
                          ✕
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="col-span-2 flex items-center justify-center rounded-lg bg-white p-12 shadow-lg">
              <p className="text-gray-500">Select a business to view details and feedback</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
