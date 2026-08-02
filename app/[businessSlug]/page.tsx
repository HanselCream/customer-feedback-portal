'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

type Screen = 'initial' | 'positive' | 'positive-reward' | 'negative' | 'negative-reward';

interface Business {
  id: string;
  name: string;
  logo_url: string;
  google_review_url: string;
  reward_code: string;
  reward_text: string;
  reward_expiry: string;
}

export default function FeedbackPage({ params }: { params: { businessSlug: string } }) {
  const supabase = createClient();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [screen, setScreen] = useState<Screen>('initial');
  const [suggestion, setSuggestion] = useState('');
  const [generatingReview, setGeneratingReview] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    name: '',
    contact: '',
    message: '',
  });
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load business config from database
  useEffect(() => {
    const loadBusiness = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('businesses')
          .select('*')
          .eq('slug', params.businessSlug)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Business not found');

        setBusiness(data as Business);
      } catch (err) {
        console.error('[v0] Error loading business:', err);
        setError('Business not found. Please check the URL.');
      } finally {
        setLoading(false);
      }
    };

    loadBusiness();
  }, [params.businessSlug, supabase]);

  // Handle generating review suggestion
  const handleGenerateSuggestion = async () => {
    setGeneratingReview(true);
    try {
      const response = await fetch('/api/suggest-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: business?.name }),
      });
      const data = await response.json();
      setSuggestion(data.suggestion || 'Great service and friendly staff!');
    } catch (error) {
      console.error('[v0] Error generating suggestion:', error);
      setSuggestion('Great service and friendly staff!');
    } finally {
      setGeneratingReview(false);
    }
  };

  // Handle leaving Google Review
  const handleLeaveReview = () => {
    if (business) {
      window.open(business.google_review_url, '_blank');
      setTimeout(() => {
        setScreen('positive-reward');
      }, 500);
    }
  };

  // Handle feedback form submission
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    setFeedbackSubmitting(true);
    try {
      const { error: submitError } = await supabase
        .from('feedback')
        .insert([
          {
            business_id: business.id,
            type: 'negative',
            name: feedbackData.name,
            contact: feedbackData.contact,
            message: feedbackData.message,
          },
        ]);

      if (submitError) throw submitError;

      setFeedbackData({ name: '', contact: '', message: '' });
      setTimeout(() => {
        setScreen('negative-reward');
      }, 1500);
    } catch (error) {
      console.error('[v0] Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Handle positive feedback submission
  const handlePositiveFeedback = async () => {
    if (!business) return;
    try {
      await supabase
        .from('feedback')
        .insert([
          {
            business_id: business.id,
            type: 'positive',
            message: 'User left a Google review',
          },
        ]);
    } catch (error) {
      console.error('[v0] Error logging positive feedback:', error);
    }
  };

  // Handle copy reward code
  const handleCopyCode = (code: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(code)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => fallbackCopy(code));
    } else {
      fallbackCopy(code);
    }
  };

  // Fallback copy method
  const fallbackCopy = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[v0] Fallback copy failed:', err);
    }
    document.body.removeChild(textarea);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <p className="text-red-600">{error || 'Business not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        {/* INITIAL SCREEN */}
        {screen === 'initial' && (
          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            <img
              className="mx-auto mb-6 h-20 w-20 rounded-full object-cover shadow-md"
              src={business.logo_url || 'https://via.placeholder.com/80'}
              alt={business.name}
            />
            <h1 className="mb-8 text-center text-2xl font-bold text-gray-900">
              How was your experience with {business.name}?
            </h1>
            <div className="space-y-4">
              <Button
                onClick={() => setScreen('positive')}
                className="h-16 w-full rounded-xl bg-green-500 text-lg font-semibold text-white hover:bg-green-600"
              >
                It was great! 🌟
              </Button>
              <Button
                onClick={() => setScreen('negative')}
                variant="outline"
                className="h-16 w-full rounded-xl text-lg font-semibold"
              >
                Could be better 💭
              </Button>
            </div>
          </div>
        )}

        {/* POSITIVE SCREEN */}
        {screen === 'positive' && (
          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
              Thanks for the great feedback! 🎉
            </h2>
            <div className="mb-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Share what you loved (optional):
                </label>
                <textarea
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="Tell us what made your experience great..."
                  className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={4}
                />
              </div>
              <Button
                onClick={handleGenerateSuggestion}
                disabled={generatingReview}
                variant="outline"
                className="w-full"
              >
                {generatingReview ? 'Generating...' : 'Generate suggestion'}
              </Button>
            </div>
            <Button
              onClick={() => {
                handlePositiveFeedback();
                handleLeaveReview();
              }}
              className="w-full rounded-lg bg-green-500 py-3 font-semibold text-white hover:bg-green-600"
            >
              Leave a Google Review
            </Button>
          </div>
        )}

        {/* POSITIVE REWARD SCREEN */}
        {screen === 'positive-reward' && business && (
          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
              Here&apos;s a little thank you 🎁
            </h2>
            <div className="mb-6 rounded-lg border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 shadow-md transition-transform hover:scale-105 hover:rotate-1">
              <div className="text-center">
                <p className="mb-3 text-sm font-medium text-gray-600">Your exclusive code:</p>
                <p className="mb-4 font-mono text-3xl font-bold text-amber-600">
                  {business.reward_code}
                </p>
                <p className="mb-4 text-sm text-gray-700">
                  Show this at checkout for {business.reward_text}
                </p>
                <p className="text-xs text-gray-500">
                  Valid for the next {business.reward_expiry}
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleCopyCode(business.reward_code)}
              className="w-full rounded-lg bg-amber-500 py-3 font-semibold text-white hover:bg-amber-600"
            >
              {copied ? 'Copied! ✓' : 'Copy code'}
            </Button>
          </div>
        )}

        {/* NEGATIVE SCREEN */}
        {screen === 'negative' && (
          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
              We&apos;d love to hear more
            </h2>
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={feedbackData.name}
                  onChange={(e) =>
                    setFeedbackData({ ...feedbackData, name: e.target.value })
                  }
                  placeholder="Your name"
                  className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Contact (optional)
                </label>
                <input
                  type="text"
                  value={feedbackData.contact}
                  onChange={(e) =>
                    setFeedbackData({ ...feedbackData, contact: e.target.value })
                  }
                  placeholder="Email or phone"
                  className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  What could we improve?
                </label>
                <textarea
                  value={feedbackData.message}
                  onChange={(e) =>
                    setFeedbackData({ ...feedbackData, message: e.target.value })
                  }
                  placeholder="Tell us what we can do better..."
                  className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={feedbackSubmitting}
                className="w-full rounded-lg bg-blue-500 py-3 font-semibold text-white hover:bg-blue-600"
              >
                {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </form>
          </div>
        )}

        {/* NEGATIVE REWARD SCREEN */}
        {screen === 'negative-reward' && business && (
          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
              Thanks for the feedback 💙
            </h2>
            <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50 p-6 shadow-md transition-transform hover:scale-105 hover:rotate-1">
              <div className="text-center">
                <p className="mb-3 text-sm font-medium text-gray-600">Here&apos;s a little something:</p>
                <p className="mb-4 font-mono text-3xl font-bold text-gray-600">
                  {business.reward_code}
                </p>
                <p className="mb-4 text-sm text-gray-700">5% off your next visit</p>
                <p className="text-xs text-gray-500">
                  Valid for the next {business.reward_expiry}
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleCopyCode(business.reward_code)}
              className="w-full rounded-lg bg-gray-500 py-3 font-semibold text-white hover:bg-gray-600"
            >
              {copied ? 'Copied! ✓' : 'Copy code'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
