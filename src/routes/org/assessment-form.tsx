import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getForm, isQuestionVisible, isAnswered } from '../../lib/forms';
import type { Form, FormQuestion, FormSection } from '../../lib/forms';
import { getLatestAnswer, createAnswer, updateAnswer } from '../../lib/answers';
import type { Answer } from '../../lib/answers';
import type { User } from '../../lib/auth';

// ── Question renderers ───────────────────────────────────────

function TextInput({
  question,
  value,
  onChange,
}: {
  question: FormQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type={question.field_type === 'email' ? 'email' : 'text'}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={question.field_type === 'email' ? 'your@email.com' : 'Your answer...'}
      className="w-full border border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

function SelectInput({
  question,
  value,
  onChange,
}: {
  question: FormQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      {question.options?.choices?.map((choice) => (
        <button
          key={choice.value}
          type="button"
          onClick={() => onChange(choice.value)}
          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
            value === choice.value
              ? 'border-primary bg-primary/5'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                value === choice.value ? 'border-primary' : 'border-gray-300'
              }`}
            >
              {value === choice.value && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              )}
            </div>
            <span className="text-base">{choice.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function MultiselectInput({
  question,
  value,
  onChange,
}: {
  question: FormQuestion;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const selected = Array.isArray(value) ? value : [];
  return (
    <div className="space-y-3">
      {question.options?.choices?.map((choice) => {
        const isChecked = selected.includes(choice.value);
        return (
          <button
            key={choice.value}
            type="button"
            onClick={() => {
              const next = isChecked
                ? selected.filter((v) => v !== choice.value)
                : [...selected, choice.value];
              onChange(next);
            }}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              isChecked
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                  isChecked ? 'bg-primary border-primary' : 'border-gray-300'
                }`}
              >
                {isChecked && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
              <span className="text-base">{choice.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function RatingInput({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex justify-center gap-4">
      {[1, 2, 3, 4, 5].map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={`w-14 h-14 rounded-full border-2 text-lg font-medium transition-all ${
            value === r || String(value) === String(r)
              ? 'border-primary bg-primary text-white'
              : 'border-gray-300 hover:border-primary hover:bg-primary/5'
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

function TableInput({
  question,
  value,
  onChange,
}: {
  question: FormQuestion;
  value: Record<string, number>;
  onChange: (v: Record<string, number>) => void;
}) {
  const tableResp = typeof value === 'object' && !Array.isArray(value) ? value : {};
  return (
    <div className="space-y-5">
      {question.options?.rows?.map((row) => (
        <div key={row.value}>
          <p className="text-sm font-medium text-gray-700 mb-2">{row.label}</p>
          <div className="flex gap-2">
            {question.options?.scale?.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ ...tableResp, [row.value]: s })}
                className={`flex-1 py-2 px-3 rounded border-2 text-sm font-medium transition-all ${
                  tableResp[row.value] === s || String(tableResp[row.value]) === String(s)
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Wizard component ─────────────────────────────────────────

export function AssessmentFormPage() {
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

  if (formQuery.isLoading || answerQuery.isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (formQuery.error || !formQuery.data) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <p className="text-red-600">Assessment not found.</p>
      </div>
    );
  }

  return (
    <QuestionWizard
      form={formQuery.data}
      initialAnswer={answerQuery.data ?? null}
      organizationId={orgId!}
      orgSlug={orgSlug}
    />
  );
}

function QuestionWizard({
  form,
  initialAnswer,
  organizationId,
  orgSlug,
}: {
  form: Form;
  initialAnswer: Answer | null;
  organizationId: string;
  orgSlug: string;
}) {
  const navigate = useNavigate();
  const [responses, setResponses] = useState<Record<string, unknown>>(
    initialAnswer?.responses || {},
  );
  const [answerId, setAnswerId] = useState<string | null>(initialAnswer?.id || null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Flatten all sections into a single question list with section info
  const allSections = form.sections || [];

  // Current position: section index + question index within visible questions of that section
  const [sectionIdx, setSectionIdx] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);

  const currentSection = allSections[sectionIdx];

  const visibleQuestionsForSection = useCallback(
    (section: FormSection) =>
      section.questions.filter((q) => isQuestionVisible(q, responses)),
    [responses],
  );

  const visibleQuestions = currentSection ? visibleQuestionsForSection(currentSection) : [];
  const currentQuestion = visibleQuestions[questionIdx];

  // Find the first unanswered question on mount
  useEffect(() => {
    for (let si = 0; si < allSections.length; si++) {
      const vqs = allSections[si].questions.filter((q) => isQuestionVisible(q, responses));
      for (let qi = 0; qi < vqs.length; qi++) {
        if (!isAnswered(responses[vqs[qi].key])) {
          setSectionIdx(si);
          setQuestionIdx(qi);
          return;
        }
      }
    }
    // All answered — go to last question of last section
    const lastSi = allSections.length - 1;
    const lastVqs = allSections[lastSi]?.questions.filter((q) => isQuestionVisible(q, responses)) || [];
    setSectionIdx(lastSi);
    setQuestionIdx(Math.max(0, lastVqs.length - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Overall progress
  const totalVisible = allSections.reduce(
    (sum, s) => sum + s.questions.filter((q) => isQuestionVisible(q, responses)).length,
    0,
  );
  const totalAnswered = allSections.reduce(
    (sum, s) =>
      sum +
      s.questions
        .filter((q) => isQuestionVisible(q, responses))
        .filter((q) => isAnswered(responses[q.key])).length,
    0,
  );
  const overallPct = totalVisible > 0 ? Math.round((totalAnswered / totalVisible) * 100) : 0;

  // Save logic
  const answerIdRef = useRef(answerId);
  const pendingSaveRef = useRef<Record<string, unknown> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    answerIdRef.current = answerId;
  }, [answerId]);

  const saveNow = useCallback(
    async (toSave: Record<string, unknown>) => {
      setIsSaving(true);
      try {
        if (answerIdRef.current) {
          await updateAnswer(answerIdRef.current, { responses: toSave });
        } else {
          const created = await createAnswer({
            form_id: form.id,
            organization_id: organizationId,
            responses: toSave,
          });
          setAnswerId(created.id);
          answerIdRef.current = created.id;
        }
        setLastSaved(new Date());
      } catch (e) {
        console.error('Failed to save:', e);
      } finally {
        setIsSaving(false);
      }
    },
    [form.id, organizationId],
  );

  const flush = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (pendingSaveRef.current) {
      const data = pendingSaveRef.current;
      pendingSaveRef.current = null;
      await saveNow(data);
    }
  }, [saveNow]);

  // Debounced auto-save
  useEffect(() => {
    if (!pendingSaveRef.current) return;
    const data = pendingSaveRef.current;
    debounceRef.current = setTimeout(async () => {
      debounceRef.current = null;
      pendingSaveRef.current = null;
      await saveNow(data);
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [responses, saveNow]);

  const handleChange = useCallback((key: string, value: unknown) => {
    setResponses((prev) => {
      const next = { ...prev, [key]: value };
      pendingSaveRef.current = next;
      return next;
    });
  }, []);

  // Auto-advance for select/rating
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  const goToNextRef = useRef(() => {});

  const handleAutoAdvance = useCallback(
    (key: string, value: unknown) => {
      handleChange(key, value);
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = setTimeout(() => goToNextRef.current(), 350);
    },
    [handleChange],
  );

  // Navigation
  const goToNext = useCallback(async () => {
    if (questionIdx < visibleQuestions.length - 1) {
      setQuestionIdx(questionIdx + 1);
    } else if (sectionIdx < allSections.length - 1) {
      await flush();
      setSectionIdx(sectionIdx + 1);
      setQuestionIdx(0);
    } else {
      // Last question of last section — go to results
      await flush();
      navigate({ to: `/${orgSlug}/assessments/${form.key}/results` });
    }
  }, [questionIdx, visibleQuestions.length, sectionIdx, allSections.length, flush, navigate, orgSlug, form.key]);

  useEffect(() => {
    goToNextRef.current = goToNext;
  }, [goToNext]);

  const goToPrev = async () => {
    if (questionIdx > 0) {
      setQuestionIdx(questionIdx - 1);
    } else if (sectionIdx > 0) {
      await flush();
      const prevSection = allSections[sectionIdx - 1];
      const prevVisible = prevSection.questions.filter((q) => isQuestionVisible(q, responses));
      setSectionIdx(sectionIdx - 1);
      setQuestionIdx(Math.max(0, prevVisible.length - 1));
    }
  };

  const isFirst = questionIdx === 0 && sectionIdx === 0;
  const isLast = questionIdx === visibleQuestions.length - 1 && sectionIdx === allSections.length - 1;
  const hasResponse = currentQuestion ? isAnswered(responses[currentQuestion.key]) : false;

  if (!currentQuestion) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <p className="text-gray-500">No questions in this section.</p>
        <button
          onClick={goToNext}
          className="mt-4 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          {isLast ? 'View Results' : 'Next Section'}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Save status */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: `/${orgSlug}/assessments` })}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to assessments
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {isSaving ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Saving...</span>
            </>
          ) : lastSaved ? (
            <>
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span>Saved</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Overall progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Overall Progress</span>
          <span className="font-medium">{overallPct}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      {/* Section info */}
      {allSections.length > 1 && (
        <div className="text-center space-y-1">
          <p className="text-sm text-gray-500">
            Section {sectionIdx + 1} of {allSections.length}
          </p>
          <h2 className="text-lg font-semibold text-gray-900">{currentSection.title}</h2>
        </div>
      )}

      {/* Question card */}
      <div className="bg-white border border-border rounded-xl shadow-sm p-8">
        {/* Question progress dots */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-gray-500">
            Question {questionIdx + 1} of {visibleQuestions.length}
          </span>
          <div className="flex gap-1">
            {visibleQuestions.map((q, idx) => (
              <div
                key={q.id}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === questionIdx
                    ? 'bg-primary'
                    : isAnswered(responses[q.key])
                      ? 'bg-green-400'
                      : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Question text */}
        <h3 className="text-xl font-medium text-gray-900 mb-8">{currentQuestion.text}</h3>

        {/* Input */}
        <div>
          {(currentQuestion.field_type === 'text' || currentQuestion.field_type === 'email') && (
            <TextInput
              question={currentQuestion}
              value={responses[currentQuestion.key] as string}
              onChange={(v) => handleChange(currentQuestion.key, v)}
            />
          )}
          {currentQuestion.field_type === 'select' && (
            <SelectInput
              question={currentQuestion}
              value={responses[currentQuestion.key] as string}
              onChange={(v) => handleAutoAdvance(currentQuestion.key, v)}
            />
          )}
          {currentQuestion.field_type === 'multiselect' && (
            <MultiselectInput
              question={currentQuestion}
              value={responses[currentQuestion.key] as string[]}
              onChange={(v) => handleChange(currentQuestion.key, v)}
            />
          )}
          {currentQuestion.field_type === 'rating' && (
            <RatingInput
              value={responses[currentQuestion.key] as number}
              onChange={(v) => handleAutoAdvance(currentQuestion.key, v)}
            />
          )}
          {currentQuestion.field_type === 'table' && (
            <TableInput
              question={currentQuestion}
              value={responses[currentQuestion.key] as Record<string, number>}
              onChange={(v) => handleChange(currentQuestion.key, v)}
            />
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={goToPrev}
          disabled={isFirst}
          className="flex items-center gap-1 border border-border rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Previous
        </button>

        <button
          onClick={goToNext}
          disabled={!hasResponse}
          className="flex items-center gap-1 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isLast ? (
            <>
              Complete
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </>
          ) : (
            <>
              Next
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
