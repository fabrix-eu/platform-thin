import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCommunity } from '../../lib/communities';
import { FieldError, FormError } from '../../components/FieldError';

export function CommunityNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: () => createCommunity({ name, description: description || undefined }),
    onSuccess: (community) => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      navigate({ to: '/communities/$id', params: { id: community.slug || community.id } });
    },
  });

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <Link
          to="/communities"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to communities
        </Link>
      </div>

      <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">
        Create a community
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Circular Textiles Lyon"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
          />
          <FieldError mutation={mutation} field="name" />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the purpose and goals of this community..."
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none"
          />
          <FieldError mutation={mutation} field="description" />
        </div>

        <FormError mutation={mutation} />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!name.trim() || mutation.isPending}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {mutation.isPending ? 'Creating...' : 'Create community'}
          </button>
          <Link
            to="/communities"
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
