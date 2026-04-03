import { useState, useRef } from 'react';
import { Link, useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getChallengeDetail,
  updateChallenge,
  deleteChallenge,
} from '../../lib/community-challenges';
import { uploadFile } from '../../lib/uploads';
import { FieldError, FormError } from '../../components/FieldError';

export function ChallengeEditPage() {
  const { orgSlug, communitySlug, challengeId } = useParams({ strict: false }) as {
    orgSlug: string;
    communitySlug: string;
    challengeId: string;
  };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const challengeQuery = useQuery({
    queryKey: ['community_challenges', communitySlug, challengeId],
    queryFn: () => getChallengeDetail(communitySlug, challengeId),
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [numberOfWinners, setNumberOfWinners] = useState('');
  const [startOn, setStartOn] = useState('');
  const [endOn, setEndOn] = useState('');
  const [requiresAttachment, setRequiresAttachment] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [uploading, setUploading] = useState(false);

  const challenge = challengeQuery.data;

  if (challenge && !initialized) {
    setTitle(challenge.title || '');
    setDescription(challenge.description || '');
    setNumberOfWinners(challenge.number_of_winners?.toString() || '');
    setStartOn(challenge.start_on || '');
    setEndOn(challenge.end_on || '');
    setRequiresAttachment(challenge.requires_attachment);
    setCurrentImageUrl(challenge.image_url);
    setInitialized(true);
  }

  const updateMutation = useMutation({
    mutationFn: async () => {
      let imageUrl: string | undefined;
      if (file) {
        setUploading(true);
        imageUrl = await uploadFile(file, 'Challenge', challengeId);
        setUploading(false);
      }

      return updateChallenge(communitySlug, challengeId, {
        title,
        description,
        number_of_winners: numberOfWinners ? parseInt(numberOfWinners, 10) : undefined,
        start_on: startOn || undefined,
        end_on: endOn || undefined,
        requires_attachment: requiresAttachment,
        ...(imageUrl ? { image_url: imageUrl } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_challenges', communitySlug] });
      queryClient.invalidateQueries({ queryKey: ['community_challenges', communitySlug, challengeId] });
      navigate({
        to: '/$orgSlug/communities/$communitySlug/challenges/$challengeId',
        params: { orgSlug, communitySlug, challengeId },
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteChallenge(communitySlug, challengeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_challenges', communitySlug] });
      navigate({
        to: '/$orgSlug/communities/$communitySlug/challenges',
        params: { orgSlug, communitySlug },
      });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
  }

  function handleDelete() {
    if (window.confirm('Are you sure you want to delete this challenge? This cannot be undone.')) {
      deleteMutation.mutate();
    }
  }

  if (challengeQuery.isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (challengeQuery.error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-red-600">Challenge not found</p>
        <Link
          to="/$orgSlug/communities/$communitySlug/challenges"
          params={{ orgSlug, communitySlug }}
          className="text-sm text-gray-500 hover:text-gray-700 mt-2 inline-block"
        >
          &larr; Back to challenges
        </Link>
      </div>
    );
  }

  const isPending = updateMutation.isPending || uploading;

  return (
    <div className="p-6 max-w-2xl mx-auto pb-12">
      <Link
        to="/$orgSlug/communities/$communitySlug/challenges"
        params={{ orgSlug, communitySlug }}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
      >
        &larr; Challenges
      </Link>

      <h1 className="text-xl font-display font-bold text-gray-900 mb-6">Edit challenge</h1>

      <FormError mutation={updateMutation} />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Challenge title"
          />
          <FieldError mutation={updateMutation} field="title" />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            placeholder="Describe the challenge..."
          />
          <FieldError mutation={updateMutation} field="description" />
        </div>

        {/* Number of winners */}
        <div>
          <label htmlFor="number_of_winners" className="block text-sm font-medium text-gray-700 mb-1">
            Number of winners
          </label>
          <input
            id="number_of_winners"
            name="number_of_winners"
            type="number"
            min="1"
            value={numberOfWinners}
            onChange={(e) => setNumberOfWinners(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={updateMutation} field="number_of_winners" />
        </div>

        {/* Start date */}
        <div>
          <label htmlFor="start_on" className="block text-sm font-medium text-gray-700 mb-1">
            Start date
          </label>
          <input
            id="start_on"
            name="start_on"
            type="date"
            value={startOn}
            onChange={(e) => setStartOn(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={updateMutation} field="start_on" />
        </div>

        {/* End date */}
        <div>
          <label htmlFor="end_on" className="block text-sm font-medium text-gray-700 mb-1">
            End date
          </label>
          <input
            id="end_on"
            name="end_on"
            type="date"
            value={endOn}
            onChange={(e) => setEndOn(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={updateMutation} field="end_on" />
        </div>

        {/* Requires attachment */}
        <div className="flex items-center gap-3">
          <input
            id="requires_attachment"
            type="checkbox"
            checked={requiresAttachment}
            onChange={(e) => setRequiresAttachment(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-ring"
          />
          <label htmlFor="requires_attachment" className="text-sm font-medium text-gray-700">
            Require attachment from applicants
          </label>
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cover image
          </label>
          {currentImageUrl && !file && (
            <div className="mb-3 rounded-lg overflow-hidden">
              <img
                src={currentImageUrl}
                alt="Current cover"
                className="w-full h-40 object-cover"
              />
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {currentImageUrl || file ? 'Change image' : 'Choose image'}
            </button>
            {file && (
              <span className="text-sm text-gray-500 truncate max-w-[200px]">{file.name}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? (uploading ? 'Uploading image...' : 'Saving...') : 'Save changes'}
          </button>
          <Link
            to="/$orgSlug/communities/$communitySlug/challenges/$challengeId"
            params={{ orgSlug, communitySlug, challengeId }}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>

      {/* Delete section */}
      <div className="mt-10 pt-6 border-t border-border">
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {deleteMutation.isPending ? 'Deleting...' : 'Delete challenge'}
        </button>
      </div>
    </div>
  );
}
