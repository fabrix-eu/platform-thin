import { useState, useRef, useEffect } from 'react';
import { Link, useParams, useNavigate } from '@tanstack/react-router';
import {
  useListing,
  useUpdateListing,
  useAddListingImage,
  useRemoveListingImage,
  LISTING_CATEGORIES,
  LISTING_SUBCATEGORIES,
} from '../../lib/listings';
import { uploadFile } from '../../lib/uploads';
import { FieldError, FormError } from '../../components/FieldError';
import type { ListingImage } from '../../lib/listings';

export function MarketplaceEditPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const listingQuery = useListing(id);
  const updateMutation = useUpdateListing();
  const addImageMutation = useAddListingImage();
  const removeImageMutation = useRemoveListingImage();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [status, setStatus] = useState('active');
  const [quantity, setQuantity] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [uploading, setUploading] = useState(false);

  const listing = listingQuery.data;

  // Initialize form values when listing loads
  useEffect(() => {
    if (listing && !initialized) {
      setTitle(listing.title);
      setDescription(listing.description);
      setCategory(listing.category);
      setSubcategory(listing.subcategory || '');
      setStatus(listing.status);
      setQuantity(listing.quantity != null ? String(listing.quantity) : '');
      setExpiresAt(listing.expires_at ? listing.expires_at.split('T')[0] : '');
      setInitialized(true);
    }
  }, [listing, initialized]);

  if (listingQuery.isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-destructive">Listing not found</p>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate(
      {
        id,
        payload: {
          category,
          subcategory: subcategory || undefined,
          title,
          description,
          status,
          quantity: quantity ? Number(quantity) : undefined,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        },
      },
      {
        onSuccess: () => {
          navigate({ to: '/marketplace/$id', params: { id } });
        },
      },
    );
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;
    e.target.value = '';

    setUploading(true);
    for (const file of selected) {
      try {
        const imageUrl = await uploadFile(file, 'Listing', id);
        await addImageMutation.mutateAsync({ listingId: id, imageFileUrl: imageUrl });
      } catch {
        // continue
      }
    }
    setUploading(false);
  }

  function handleRemoveImage(image: ListingImage) {
    removeImageMutation.mutate({ listingId: id, imageId: image.id });
  }

  const images = listing.images ?? [];
  const isPending = updateMutation.isPending;

  return (
    <div className="max-w-2xl mx-auto p-6 pb-12">
      <Link
        to="/marketplace/$id"
        params={{ id }}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
      >
        &larr; Back to listing
      </Link>

      <h1 className="text-xl font-display font-bold text-gray-900 mb-6">Edit listing</h1>

      <FormError mutation={updateMutation} />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 capitalize">
            {listing.listing_type}
          </p>
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
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white"
          >
            {Object.entries(LISTING_CATEGORIES).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>
          <FieldError mutation={updateMutation} field="category" />
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
            <FieldError mutation={updateMutation} field="subcategory" />
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
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <FieldError mutation={updateMutation} field="description" />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white"
          >
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <input
            id="quantity"
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Expires at */}
        <div>
          <label htmlFor="expires_at" className="block text-sm font-medium text-gray-700 mb-1">Expires on</label>
          <input
            id="expires_at"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Existing images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
          {images.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {images.map((img) => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.image_file_url}
                    alt=""
                    className="w-20 h-20 rounded-md object-cover border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img)}
                    disabled={removeImageMutation.isPending}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Add images'}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save changes'}
          </button>
          <Link
            to="/marketplace/$id"
            params={{ id }}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
