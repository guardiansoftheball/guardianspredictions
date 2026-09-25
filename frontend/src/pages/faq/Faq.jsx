import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';
import BlueGlow from '../../components/ui/BlueGlow';

const FAQ_DATA = [
  {
    questionKey: 'faq.q1',
    answerKey: 'faq.a1',
  },
  {
    questionKey: 'faq.q2',
    answerKey: 'faq.a2',
  },
  {
    questionKey: 'faq.q3',
    answerKey: 'faq.a3',
  },
  {
    questionKey: 'faq.q4',
    answerKey: 'faq.a4',
  },
];

const ChevronDown = ({ isOpen }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

function Faq() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState(0);

  const filteredFaqs = useMemo(() => {
    const items = FAQ_DATA.map((faq) => ({
      question: t(faq.questionKey),
      answer: t(faq.answerKey),
    }));
    if (!searchTerm.trim()) return items;
    const lower = searchTerm.toLowerCase();
    return items.filter(
      (faq) =>
        faq.question.toLowerCase().includes(lower) ||
        faq.answer.toLowerCase().includes(lower)
    );
  }, [searchTerm, t]);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-primary-background relative overflow-x-hidden">
      <BlueGlow />

      <Navbar />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-[#9CC9F1] mb-1">{t('faq.eyebrow')}</p>
          <h1 className="text-4xl font-bold text-white">{t('faq.heading')}</h1>
          <p className="mt-2 text-sm text-gray-400 max-w-2xl">{t('faq.subtitle')}</p>
        </div>

        <div className="relative mb-6">
          <input
            type="text"
            placeholder={t('faq.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setOpenIndex(null);
            }}
            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-[#9CC9F1]/60 focus:bg-[#9CC9F1]/5 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setOpenIndex(null);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
          {filteredFaqs.length === 0 ? (
            <p className="p-6 text-center text-gray-400">
              {t('faq.noResults')}
            </p>
          ) : (
            filteredFaqs.map((faq, index) => (
              <div key={index} className={index > 0 ? 'border-t border-white/10' : ''}>
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-4 md:p-5 text-left hover:bg-white/5 transition-colors duration-200"
                >
                  <span className="font-semibold text-sm md:text-base text-white pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown isOpen={openIndex === index} />
                </button>
                {openIndex === index && (
                  <div className="px-4 pb-4 md:px-5 md:pb-5">
                    <p className="text-sm leading-relaxed text-gray-400">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Faq;
