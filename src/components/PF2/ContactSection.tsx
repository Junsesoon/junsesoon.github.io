'use client';

import React, { useState } from 'react';
import { sendContactEmail } from '@/actions/contactActions';
import { DEFAULT_CONTACT_EMAIL } from '@/constants';


export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setStatus('sending');
    setFeedback('');

    const result = await sendContactEmail(formData);

    if (result.success) {
      setStatus('success');
      setFeedback(result.message);
      setFormData({ name: '', email: '', message: '' });
    } else {
      setStatus('error');
      setFeedback(result.message);
    }
  };

  return (
    <div id="contact" className="w-full max-w-3xl mx-auto mt-20 select-text text-left animate-fade-in relative z-10">
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>

      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
          Contact Me
        </h2>
        <p className="text-sm md:text-base text-slate-400">
          협업 제안이나 질문이 있으시면 언제든 편하게 연락해 주세요.
        </p>
      </div>

      {/* Card Wrapper */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/[0.01] border border-white/[0.05] backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* Left Column: Direct Info */}
          <div className="md:col-span-2 flex flex-col justify-between gap-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-200 mb-2">소통을 기다립니다</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  피드백, 협업, 혹은 단순한 커피 챗도 환영합니다. 아래 채널을 이용하거나 폼을 통해 직접 메시지를 남겨주세요.
                </p>
              </div>

              <div className="space-y-4">
                {/* Email Link */}
                <a 
                  href={`mailto:${DEFAULT_CONTACT_EMAIL}`}
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.08] transition-all duration-300 group no-underline"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Email</span>
                    <span className="block text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                      {DEFAULT_CONTACT_EMAIL}
                    </span>
                  </div>
                </a>

                {/* GitHub Link */}
                <a 
                  href="https://github.com/Junsesoon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.08] transition-all duration-300 group no-underline"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider">GitHub</span>
                    <span className="block text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                      github.com/Junsesoon
                    </span>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="md:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="이름"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.04] transition-all text-sm"
                  required
                />
              </div>

              <div>
                <input
                  type="email"
                  placeholder="이메일"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.04] transition-all text-sm"
                  required
                />
              </div>

              <div>
                <textarea
                  placeholder="메시지를 입력해주세요"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.04] transition-all text-sm resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={status === 'sending'}
                className={`w-full py-3 px-6 rounded-2xl font-semibold text-white text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                  status === 'sending'
                    ? 'bg-indigo-500/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 cursor-pointer'
                }`}
              >
                {status === 'sending' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    전송 중...
                  </>
                ) : (
                  '메시지 전송하기'
                )}
              </button>

              {feedback && (
                <div className={`p-4 rounded-2xl border text-xs text-center animate-fade-in ${
                  status === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  {status === 'success' ? '✨ ' : '⚠️ '}
                  {feedback}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
