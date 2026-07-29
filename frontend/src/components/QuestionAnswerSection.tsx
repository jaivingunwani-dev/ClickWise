import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Loader, AlertCircle, MessageSquare } from 'lucide-react';

interface QuestionAnswerSectionProps {
  contentHash: string;
  documentContent: string;
  docType: string;
  summary: any;
  onQALoaded?: (faqs: string[]) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  sources?: string[];
  followUps?: string[];
}

export const QuestionAnswerSection: React.FC<QuestionAnswerSectionProps> = ({
  contentHash,
  documentContent,
  docType,
  summary,
  onQALoaded,
}) => {
  const [faqs, setFaqs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userQuestion, setUserQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [answering, setAnswering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load suggested FAQs on mount
  useEffect(() => {
    loadSuggestedFAQs();
  }, [contentHash]);

  const loadSuggestedFAQs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/generate-faqs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_content: documentContent,
          doc_type: docType,
          summary: summary,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate FAQs: ${response.statusText}`);
      }

      const data = await response.json();
      const faqList = data.suggested_faqs || [];
      setFaqs(faqList);
      onQALoaded?.(faqList);
    } catch (err) {
      console.error('FAQ loading error:', err);
      setError('Failed to load FAQ suggestions');
      // Provide default FAQs on error
      setFaqs([
        'What data is collected from me?',
        'How is my data used and shared?',
        'What are my rights under this policy?',
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFAQClick = async (faqQuestion: string) => {
    await sendQuestion(faqQuestion);
  };

  const handleAskQuestion = async () => {
    if (userQuestion.trim()) {
      await sendQuestion(userQuestion);
      setUserQuestion('');
    }
  };

  const sendQuestion = async (question: string) => {
    try {
      setAnswering(true);
      setError(null);

      // Add user message to chat
      setChatHistory((prev) => [...prev, { role: 'user', text: question }]);

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_hash: contentHash,
          question: question,
          document_context: documentContent.substring(0, 3000), // Limit context to first 3000 chars
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get answer: ${response.statusText}`);
      }

      const data = await response.json();

      // Add assistant message to chat
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer,
          sources: data.sources,
          followUps: data.follow_up_questions,
        },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to get answer. Please try again.');
      // Remove the pending user message on error
      setChatHistory((prev) => prev.slice(0, -1));
    } finally {
      setAnswering(false);
    }
  };

  return (
    <div className="space-y-4 border-t pt-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-900">Ask Questions</h3>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* FAQ Suggestions */}
      {!loading && faqs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600">Suggested Questions</p>
          <div className="flex flex-wrap gap-2">
            {faqs.map((faq, idx) => (
              <button
                key={idx}
                onClick={() => handleFAQClick(faq)}
                disabled={answering}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {faq}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat History */}
      {chatHistory.length > 0 && (
        <div className="space-y-3 max-h-48 overflow-y-auto bg-gray-50 rounded-lg p-3">
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`space-y-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
            >
              {/* Message Bubble */}
              <div
                className={`inline-block px-3 py-2 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {msg.text}
              </div>

              {/* Sources (if assistant message) */}
              {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                <div className="text-xs text-gray-600 px-3">
                  <p className="font-semibold">Sources:</p>
                  <ul className="list-disc list-inside">
                    {msg.sources.map((source, sidx) => (
                      <li key={sidx}>{source}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow-up Questions */}
              {msg.role === 'assistant' && msg.followUps && msg.followUps.length > 0 && (
                <div className="text-xs text-gray-600 px-3 space-y-1">
                  <p className="font-semibold">You might also ask:</p>
                  <div className="flex flex-wrap gap-1">
                    {msg.followUps.map((followUp, fidx) => (
                      <button
                        key={fidx}
                        onClick={() => handleFAQClick(followUp)}
                        disabled={answering}
                        className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs disabled:opacity-50 transition-colors"
                      >
                        {followUp}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {answering && (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-xs">Analyzing document...</span>
            </div>
          )}
        </div>
      )}

      {/* Question Input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !answering) {
                handleAskQuestion();
              }
            }}
            placeholder="Ask a question about this document..."
            disabled={answering}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleAskQuestion}
            disabled={answering || !userQuestion.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            {answering ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Ask
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          💡 Click a suggestion or type your own question
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-4 text-gray-600">
          <Loader className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading FAQ suggestions...</span>
        </div>
      )}

      {/* Disclaimer */}
      <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 border border-gray-200">
        ⚠️ AI-generated responses are for informational purposes only and do not constitute legal advice.
      </div>
    </div>
  );
};
