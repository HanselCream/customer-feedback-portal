'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

// ==================== DEFAULT CONFIG ====================
// Override these with URL parameters: ?businessName=My%20Store&logoUrl=https://...&googleReviewUrl=https://...
const DEFAULT_CONFIG = {
  BUSINESS_NAME: 'Your Business',
  LOGO_URL: 'https://via.placeholder.com/80',
  GOOGLE_REVIEW_URL: 'https://google.com/maps/place/your-business',
  REWARD_CODE: 'SAVE10',
  REWARD_TEXT: '10% off your next visit',
  REWARD_EXPIRY: '30 days',
};

// ==================== TYPES ====================
type Screen = 'initial' | 'positive' | 'positive-reward' | 'negative' | 'negative-reward';

// ==================== MAIN COMPONENT ====================
export default function ReviewGatingPage() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [screen, setScreen] = useState<Screen>('initial');
  const [suggestion, setSuggestion] = useState('');
  const [generatingReview, setGeneratingReview] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    name: '',
    contact: '',
    message: '',
  });
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [negativeRewardVisible, setNegativeRewardVisible] = useState(false);

  // Load config from URL params on mount
  useEffect(() => {
    const businessName = searchParams.get('businessName') || DEFAULT_CONFIG.BUSINESS_NAME;
    const logoUrl = searchParams.get('logoUrl') || DEFAULT_CONFIG.LOGO_URL;
    const googleReviewUrl = searchParams.get('googleReviewUrl') || DEFAULT_CONFIG.GOOGLE_REVIEW_URL;
    const rewardCode = searchParams.get('rewardCode') || DEFAULT_CONFIG.REWARD_CODE;
    const rewardText = searchParams.get('rewardText') || DEFAULT_CONFIG.REWARD_TEXT;
    const rewardExpiry = searchParams.get('rewardExpiry') || DEFAULT_CONFIG.REWARD_EXPIRY;

    setConfig({
      BUSINESS_NAME: decodeURIComponent(businessName),
      LOGO_URL: decodeURIComponent(logoUrl),
      GOOGLE_REVIEW_URL: decodeURIComponent(googleReviewUrl),
      REWARD_CODE: decodeURIComponent(rewardCode),
      REWARD_TEXT: decodeURIComponent(rewardText),
      REWARD_EXPIRY: decodeURIComponent(rewardExpiry),
    });
  }, [searchParams]);

  // Handle generating review suggestion
  const handleGenerateSuggestion = async () => {
    setGeneratingReview(true);
    try {
      const response = await fetch('/api/suggest-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: config.BUSINESS_NAME }),
      });
      const data = await response.json();
      setSuggestion(data.suggestion || 'Great service and friendly staff!');
    } catch (error) {
      console.error('Error generating suggestion:', error);
      setSuggestion('Great service and friendly staff!');
    } finally {
      setGeneratingReview(false);
    }
  };

  // Handle leaving Google Review (open in new tab)
  const handleLeaveReview = () => {
    window.open(config.GOOGLE_REVIEW_URL, '_blank');
    // Show reward after a brief delay (user may return to tab)
    setTimeout(() => {
      setScreen('positive-reward');
    }, 500);
  };

  // Handle feedback form submission
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      });
      if (response.ok) {
        setFeedbackSuccess(true);
        setFeedbackData({ name: '', contact: '', message: '' });
        // Show smaller reward after 1.5 seconds
        setTimeout(() => {
          setScreen('negative-reward');
          setNegativeRewardVisible(true);
        }, 1500);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Handle copy reward code
  const handleCopyCode = () => {
    // Try modern Clipboard API first, fallback to older method for iframe compatibility
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(config.REWARD_CODE).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        // Fallback if clipboard fails
        fallbackCopy(config.REWARD_CODE);
      });
    } else {
      fallbackCopy(config.REWARD_CODE);
    }
  };

  // Fallback copy method using text selection
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
      console.error('Fallback copy failed:', err);
    }
    document.body.removeChild(textarea);
  };

  // ==================== RENDER: INITIAL SCREEN ====================
  if (screen === 'initial') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
        <img
          className="mb-6 h-20 w-20 rounded-full object-cover shadow-md"
          src={config.LOGO_URL}
          alt={config.BUSINESS_NAME}
              className="h-20 w-20 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23E0E7FF" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" font-size="40" fill="%234F46E5"%3E%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>

          {/* Heading */}
          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
            How was your experience with {config.BUSINESS_NAME}?
          </h1>
          <p className="mb-8 text-center text-gray-600">Your feedback helps us improve</p>

          {/* Two Path Buttons */}
          <div className="flex flex-col gap-4">
            <Button
              onClick={() => setScreen('positive')}
              className="h-16 rounded-xl bg-green-500 text-lg font-semibold text-white transition-all hover:scale-105 hover:bg-green-600 active:scale-95"
            >
              😊 It was great!
            </Button>
            <Button
              onClick={() => {
                setScreen('negative');
                setFeedbackSuccess(false);
              }}
              className="h-16 rounded-xl bg-gray-300 text-lg font-semibold text-gray-800 transition-all hover:scale-105 hover:bg-gray-400 active:scale-95"
            >
              😐 Could be better
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // ==================== RENDER: POSITIVE PATH ====================
  if (screen === 'positive') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          {/* Header */}
          <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
            That&apos;s awesome! 🎉
          </h2>
          <p className="mb-6 text-center text-gray-600">
            Help us share the love with a Google review
          </p>

          {/* Review Suggestion Box */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Want help writing your review? Tap below for a suggestion
            </label>
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Your review text will appear here..."
              className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-200"
              rows={4}
            />
          </div>

          {/* Generate Suggestion Button */}
          <button
            onClick={handleGenerateSuggestion}
            disabled={generatingReview}
            className="mb-4 w-full rounded-lg bg-indigo-100 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-200 disabled:opacity-50"
          >
            {generatingReview ? 'Generating...' : 'Generate suggestion'}
          </button>

          {/* Leave Google Review Button */}
          <Button
            onClick={handleLeaveReview}
            className="w-full rounded-lg bg-green-500 py-3 text-base font-semibold text-white transition-all hover:bg-green-600 active:scale-95"
          >
            Leave a Google Review →
          </Button>

          {/* Back Button */}
          <button
            onClick={() => setScreen('initial')}
            className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Back
          </button>
        </div>
      </main>
    );
  }

  // ==================== RENDER: POSITIVE REWARD ====================
  if (screen === 'positive-reward') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-yellow-50 to-amber-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          {/* Heading */}
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
            Here&apos;s a little thank you 🎁
          </h2>

          {/* Reward Coupon Card */}
          <div className="mb-6 rounded-lg border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 shadow-md transition-transform hover:scale-105 hover:rotate-1">
            <div className="text-center">
              <p className="mb-3 text-sm font-medium text-gray-600">Your exclusive code:</p>
              <p className="mb-4 font-mono text-3xl font-bold text-amber-600">
                {config.REWARD_CODE}
              </p>
              <p className="mb-4 text-sm text-gray-700">
                Show this at checkout for {config.REWARD_TEXT}
              </p>
              <p className="text-xs text-gray-500">
                Valid for the next {config.REWARD_EXPIRY}
              </p>
            </div>
          </div>

          {/* Copy Code Button */}
          <Button
            onClick={handleCopyCode}
            className="mb-4 w-full rounded-lg bg-amber-500 py-3 text-base font-semibold text-white transition-all hover:bg-amber-600 active:scale-95"
          >
            {copied ? '✓ Copied!' : 'Copy code'}
          </Button>

          {/* Back to Home */}
          <button
            onClick={() => setScreen('initial')}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Back home
          </button>
        </div>
      </main>
    );
  }

  // ==================== RENDER: NEGATIVE PATH ====================
  if (screen === 'negative') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          {/* Header */}
          <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
            We&apos;d love to improve
          </h2>
          <p className="mb-6 text-center text-gray-600">
            Your private feedback helps us serve you better
          </p>

          {/* Success Message */}
          {feedbackSuccess ? (
            <div className="mb-6 rounded-lg bg-green-50 p-4 text-center">
              <p className="text-sm font-semibold text-green-700">
                Thank you, we&apos;ll be in touch!
              </p>
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Name <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={feedbackData.name}
                  onChange={(e) =>
                    setFeedbackData({ ...feedbackData, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {/* Contact Field */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Phone or Email <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="123-456-7890 or email@example.com"
                  value={feedbackData.contact}
                  onChange={(e) =>
                    setFeedbackData({ ...feedbackData, contact: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {/* Message Field */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tell us what went wrong
                </label>
                <textarea
                  placeholder="Your feedback..."
                  value={feedbackData.message}
                  onChange={(e) =>
                    setFeedbackData({ ...feedbackData, message: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={feedbackSubmitting}
                className="w-full rounded-lg bg-indigo-500 py-3 text-base font-semibold text-white transition-all hover:bg-indigo-600 disabled:opacity-50 active:scale-95"
              >
                {feedbackSubmitting ? 'Submitting...' : 'Submit feedback'}
              </Button>
            </form>
          )}

          {/* Back Button */}
          {!feedbackSuccess && (
            <button
              onClick={() => setScreen('initial')}
              className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Back
            </button>
          )}
        </div>
      </main>
    );
  }

  // ==================== RENDER: NEGATIVE REWARD ====================
  if (screen === 'negative-reward') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          {/* Heading */}
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
            Thanks for the feedback 💙
          </h2>

          {/* Smaller Reward for Negative Path */}
          <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50 p-6 shadow-md transition-transform hover:scale-105 hover:rotate-1">
            <div className="text-center">
              <p className="mb-3 text-sm font-medium text-gray-600">Here&apos;s a little something:</p>
              <p className="mb-4 font-mono text-3xl font-bold text-gray-600">
                {config.REWARD_CODE}
              </p>
              <p className="mb-4 text-sm text-gray-700">5% off your next visit</p>
              <p className="text-xs text-gray-500">
                Valid for the next {config.REWARD_EXPIRY}
              </p>
            </div>
          </div>

          {/* Copy Code Button */}
          <Button
            onClick={handleCopyCode}
            className="mb-4 w-full rounded-lg bg-gray-500 py-3 text-base font-semibold text-white transition-all hover:bg-gray-600 active:scale-95"
          >
            {copied ? '✓ Copied!' : 'Copy code'}
          </Button>

          {/* Back to Home */}
          <button
            onClick={() => setScreen('initial')}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Back home
          </button>
        </div>
      </main>
    );
  }

  return null;
}
