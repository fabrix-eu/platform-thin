import { useParams } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getForm } from '../../lib/forms';
import type { Form } from '../../lib/forms';
import { getLatestAnswer, getAnswers } from '../../lib/answers';
import type { Answer } from '../../lib/answers';
import type { User } from '../../lib/auth';

// ── Score helpers ────────────────────────────────────────────

function getScoreCategory(score: number) {
  if (score >= 80)
    return {
      label: 'Advanced Readiness',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      dotColor: 'bg-green-500',
      description: "You're demonstrating strong environmental and circular practices.",
    };
  if (score >= 60)
    return {
      label: 'Proactive but Developing',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      dotColor: 'bg-yellow-400',
      description: "You're on a promising path with commitment to environmental responsibility.",
    };
  if (score >= 40)
    return {
      label: 'Early Stage',
      textColor: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      dotColor: 'bg-orange-400',
      description: "You've taken initial steps, but there's room to build a stronger foundation.",
    };
  return {
    label: 'Needs Improvement',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    dotColor: 'bg-red-500',
    description: 'Your organization has significant opportunities to integrate sustainability.',
  };
}

function getRecommendations(score: number): string[] {
  if (score >= 80) {
    return [
      'Benchmark your practices with industry leaders',
      'Share your success stories to inspire others',
      'Explore advanced partnerships and certifications',
      'Invest in circular innovation and traceability tools',
    ];
  }
  if (score >= 60) {
    return [
      'Establish a dedicated environmental lead or taskforce',
      'Expand training programs to all departments',
      'Increase your share of renewable energy',
      'Begin measuring and disclosing your carbon footprint',
    ];
  }
  if (score >= 40) {
    return [
      'Appoint someone to oversee environmental issues',
      'Introduce basic environmental training for staff',
      'Start tracking energy consumption',
      'Evaluate opportunities with certified local suppliers',
    ];
  }
  return [
    'Assign responsibility for environmental topics',
    'Reach out to local support organizations',
    'Identify quick wins for sustainability',
    'Use this assessment as a roadmap for improvement',
  ];
}

function calcSectionScores(form: Form, answer: Answer) {
  return (form.sections || []).map((section) => {
    let points = 0;
    let maxPoints = 0;

    section.questions.forEach((q) => {
      const resp = answer.responses[q.key];
      if (q.options?.choices) {
        const maxC = q.options.choices.reduce((mx, c) => Math.max(mx, c.points || 0), 0);
        maxPoints += maxC;
        if (resp) {
          if (Array.isArray(resp)) {
            (resp as string[]).forEach((v) => {
              const c = q.options?.choices?.find((ch) => ch.value === v);
              points += c?.points || 0;
            });
          } else {
            const c = q.options.choices.find((ch) => ch.value === resp);
            points += c?.points || 0;
          }
        }
      }
    });

    const score = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;
    return { title: section.title, score, category: getScoreCategory(score) };
  });
}

// ── Score circle ─────────────────────────────────────────────

function ScoreCircle({ score, textColor }: { score: number; textColor: string }) {
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-40 h-40">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="70" stroke="#e5e7eb" strokeWidth="12" fill="none" />
        <circle
          cx="80"
          cy="80"
          r="70"
          stroke="currentColor"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={textColor}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-4xl font-bold font-display ${textColor}`}>{score}%</span>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────

export function AssessmentResultsPage() {
  const { orgSlug, formId } = useParams({ strict: false }) as { orgSlug: string; formId: string };
  const qc = useQueryClient();
  const me = qc.getQueryData<User>(['me']);
  const orgId = me?.organizations.find((o) => o.organization_slug === orgSlug)?.organization_id;

  const formQuery = useQuery({
    queryKey: ['forms', formId],
    queryFn: () => getForm(formId),
  });

  const answerQuery = useQuery({
    queryKey: ['answers', 'latest', orgId, formId],
    queryFn: () => getLatestAnswer(orgId!, formId),
    enabled: !!orgId,
  });

  const historyQuery = useQuery({
    queryKey: ['answers', 'history', orgId, formQuery.data?.id],
    queryFn: () => getAnswers(orgId!, formQuery.data!.id),
    enabled: !!orgId && !!formQuery.data,
  });

  if (formQuery.isLoading || answerQuery.isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 rounded-lg" />
          <div className="h-32 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  const form = formQuery.data;
  const answer = answerQuery.data;

  if (!form || !answer) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <p className="text-amber-800 font-medium">No results available yet. Complete the assessment first.</p>
          <Link
            to="/$orgSlug/assessments/$formId"
            params={{ orgSlug, formId }}
            className="inline-block mt-4 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
          >
            Start Assessment
          </Link>
        </div>
      </div>
    );
  }

  const score = Math.round(answer.normalized_score || 0);
  const category = getScoreCategory(score);
  const recommendations = getRecommendations(score);
  const sectionScores = calcSectionScores(form, answer);
  const allAnswers = historyQuery.data ?? [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link
        to="/$orgSlug/assessments"
        params={{ orgSlug }}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to assessments
      </Link>

      {/* Main score card */}
      <div className={`border-2 rounded-lg p-8 ${category.borderColor} ${category.bgColor}`}>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <ScoreCircle score={score} textColor={category.textColor} />
          <div className="flex-1 text-center md:text-left">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white mb-2 ${category.dotColor}`}>
              {category.label}
            </span>
            <h2 className="text-2xl font-bold font-display text-gray-900 mb-2">{form.title}</h2>
            <p className="text-gray-600">{category.description}</p>
          </div>
        </div>
      </div>

      {/* Section breakdown */}
      {sectionScores.length > 1 && (
        <div className="bg-white border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />
            </svg>
            Score by Section
          </h3>
          <div className="space-y-4">
            {sectionScores.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{s.title}</span>
                  <span className={`text-sm font-bold ${s.category.textColor}`}>{s.score}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${s.category.dotColor}`}
                    style={{ width: `${s.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-white border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
          Recommendations
        </h3>
        <ul className="space-y-3">
          {recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span className="text-gray-700">{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* History */}
      {allAnswers.length > 1 && (
        <div className="bg-white border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
            </svg>
            Assessment History
          </h3>
          <div className="space-y-2">
            {allAnswers.slice(0, 5).map((a) => {
              const aScore = Math.round(a.normalized_score || 0);
              const aCat = getScoreCategory(aScore);
              const isLatest = a.id === answer.id;
              return (
                <div
                  key={a.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isLatest ? 'bg-primary/10' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${aCat.dotColor}`} />
                    <span className="text-sm text-gray-700">
                      {new Date(a.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    {isLatest && (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-200 text-gray-600">
                        Latest
                      </span>
                    )}
                  </div>
                  <span className={`font-bold text-sm ${aCat.textColor}`}>{aScore}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/$orgSlug/assessments/$formId"
          params={{ orgSlug, formId }}
          className="flex-1 text-center border border-border rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Retake Assessment
        </Link>
        <Link
          to="/$orgSlug/assessments"
          params={{ orgSlug }}
          className="flex-1 text-center bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Back to All Assessments
        </Link>
      </div>
    </div>
  );
}
