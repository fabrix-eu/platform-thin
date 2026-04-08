import { useState, useRef } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import {
  useCreateListing,
  addListingImage,
  LISTING_CATEGORIES,
  LISTING_SUBCATEGORIES,
} from '../../lib/listings';
import { uploadFile } from '../../lib/uploads';
import { FieldError, FormError } from '../../components/FieldError';

export function MarketplaceNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [listingType, setListingType] = useState<'offer' | 'demand'>('offer');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const createMutation = useCreateListing();

  // Set default org on load
  const orgs = me.data?.organizations ?? [];
  if (orgs.length > 0 && !organizationId) {
    setOrganizationId(orgs[0].organization_id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    createMutation.mutate(
      {
        organization_id: organizationId,
        listing_type: listingType,
        category,
        subcategory: subcategory || undefined,
        title,
        description,
        quantity: quantity ? Number(quantity) : undefined,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      },
      {
        onSuccess: async (listing) => {
          // Upload images sequentially
          if (files.length > 0) {
            setUploading(true);
            for (const file of files) {
              try {
                const imageUrl = await uploadFile(file, 'Listing', listing.id);
                await addListingImage(listing.id, imageUrl);
              } catch {
                // continue with remaining images
              }
            }
            setUploading(false);
          }

          queryClient.invalidateQueries({ queryKey: ['listings'] });
          navigate({ to: '/marketplace/$id', params: { id: listing.id } });
        },
      },
    );
  }

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...selected]);
    // Reset input so same file can be re-selected
    e.target.value = '';
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const isPending = createMutation.isPending || uploading;

  return (
    <div className="max-w-2xl mx-auto p-6 pb-12">
      <Link to="/marketplace" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
        &larr; Marketplace
      </Link>

      <h1 className="text-xl font-display font-bold text-gray-900 mb-6">Create listing</h1>

      <FormError mutation={createMutation} />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Organization (if multiple) */}
        {orgs.length > 1 && (
          <div>
            <label htmlFor="organization_id" className="block text-sm font-medium text-gray-700 mb-1">
              Organization <span className="text-red-500">*</span>
            </label>
            <select
              id="organization_id"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white"
            >
              {orgs.map((o) => (
                <option key={o.organization_id} value={o.organization_id}>
                  {o.organization_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Type toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setListingType('offer')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                listingType === 'offer'
                  ? 'border-green-300 bg-green-50 text-green-800'
                  : 'border-border text-gray-500 hover:bg-gray-50'
              }`}
            >
              Offer
            </button>
            <button
              type="button"
              onClick={() => setListingType('demand')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                listingType === 'demand'
                  ? 'border-blue-300 bg-blue-50 text-blue-800'
                  : 'border-border text-gray-500 hover:bg-gray-50'
              }`}
            >
              Demand
            </button>
          </div>
          <FieldError mutation={createMutation} field="listing_type" />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => { setCategory(e.target.value); setSubcategory(''); }}
            required
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white"
          >
            <option value="">Select a category</option>
            {Object.entries(LISTING_CATEGORIES).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>
          <FieldError mutation={createMutation} field="category" />
        </div>

        {/* Subcategory */}
        {category && LISTING_SUBCATEGORIES[category] && (
          <div>
            <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
              Subcategory
            </label>
            <select
              id="subcategory"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white"
            >
              <option value="">All / General</option>
              {Object.entries(LISTING_SUBCATEGORIES[category]).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
            <FieldError mutation={createMutation} field="subcategory" />
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g. Organic cotton yarn — 500kg available"
          />
          <FieldError mutation={createMutation} field="title" />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            placeholder="Describe what you're offering or looking for..."
          />
          <FieldError mutation={createMutation} field="description" />
        </div>

        {/* Quantity */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <input
            id="quantity"
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Optional"
          />
        </div>

        {/* Expires at */}
        <div>
          <label htmlFor="expires_at" className="block text-sm font-medium text-gray-700 mb-1">
            Expires on
          </label>
          <input
            id="expires_at"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Add images
          </button>
          {files.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {files.map((file, i) => (
                <div key={i} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="w-20 h-20 rounded-md object-cover border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending
              ? uploading
                ? 'Uploading images...'
                : 'Creating...'
              : 'Create listing'}
          </button>
          <Link
            to="/marketplace"
            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
