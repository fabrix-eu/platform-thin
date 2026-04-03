import { useState, useRef } from 'react';
import { Link, useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import { createChallenge, updateChallenge } from '../../lib/community-challenges';
import { uploadFile } from '../../lib/uploads';
import { FieldError, FormError } from '../../components/FieldError';

export function ChallengeNewPage() {
  const { orgSlug, communitySlug } = useParams({ strict: false }) as {
    orgSlug: string;
    communitySlug: string;
  };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const me = useQuery({ queryKey: ['me'], queryFn: getMe });

  // Get user's org in this community for organization_id
  const myOrg = me.data?.organizations.find(
    (o) => o.communities.some((c) => c.community_slug === communitySlug),
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [numberOfWinners, setNumberOfWinners] = useState('1');
  const [startOn, setStartOn] = useState('');
  const [endOn, setEndOn] = useState('');
  const [requiresAttachment, setRequiresAttachment] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const challenge = await createChallenge(communitySlug, {
        title,
        description,
        number_of_winners: numberOfWinners ? parseInt(numberOfWinners, 10) : undefined,
        start_on: startOn || undefined,
        end_on: endOn || undefined,
        state: 'draft',
        organization_id: myOrg?.organization_id,
        requires_attachment: requiresAttachment,
      });

      if (file) {
        setUploading(true);
        const imageUrl = await uploadFile(file, 'Challenge', challenge.id);
        await updateChallenge(communitySlug, challenge.id, { image_url: imageUrl });
        setUploading(false);
      }

      return challenge;
    },
    onSuccess: (challenge) => {
      queryClient.invalidateQueries({ queryKey: ['community_challenges', communitySlug] });
      navigate({
        to: '/$orgSlug/communities/$communitySlug/challenges/$challengeId',
        params: { orgSlug, communitySlug, challengeId: challenge.id },
      });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
  }

  const isPending = mutation.isPending || uploading;

  return (
    <div className="p-6 max-w-2xl mx-auto pb-12">
      <Link
        to="/$orgSlug/communities/$communitySlug/challenges"
        params={{ orgSlug, communitySlug }}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
      >
        &larr; Challenges
      </Link>

      <h1 className="text-xl font-display font-bold text-gray-900 mb-6">Create challenge</h1>

      <FormError mutation={mutation} />

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
          <FieldError mutation={mutation} field="title" />
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
            placeholder="Describe the challenge, what you're looking for..."
          />
          <FieldError mutation={mutation} field="description" />
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
          <FieldError mutation={mutation} field="number_of_winners" />
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
          <FieldError mutation={mutation} field="start_on" />
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
          <FieldError mutation={mutation} field="end_on" />
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
              {file ? 'Change image' : 'Choose image'}
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
            {isPending ? (uploading ? 'Uploading image...' : 'Creating...') : 'Create challenge'}
          </button>
          <Link
            to="/$orgSlug/communities/$communitySlug/challenges"
            params={{ orgSlug, communitySlug }}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
