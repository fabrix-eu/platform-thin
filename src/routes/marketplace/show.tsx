import { useState } from 'react';
import { Link, useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import {
  useListing,
  useDeleteListing,
  LISTING_TYPES,
  LISTING_CATEGORIES,
  LISTING_SUBCATEGORIES,
} from '../../lib/listings';
import type { ListingImage } from '../../lib/listings';

function ImageGallery({ images }: { images: ListingImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const sorted = [...images].sort((a, b) => a.position - b.position);

  if (sorted.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={sorted[activeIndex]?.image_file_url}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={`shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                i === activeIndex ? 'border-primary' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img
                src={img.image_file_url}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function MarketplaceShowPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const listingQuery = useListing(id);
  const me = useQuery({ queryKey: ['me'], queryFn: getMe, retry: false });
  const deleteMutation = useDeleteListing();

  const listing = listingQuery.data;

  if (listingQuery.isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="aspect-[16/10] bg-gray-200 rounded-lg" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (listingQuery.error || !listing) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center space-y-3">
        <p className="text-destructive">Listing not found</p>
        <Link to="/marketplace" className="text-sm text-primary hover:underline">
          &larr; Back to marketplace
        </Link>
      </div>
    );
  }

  const isOwner = me.data?.organizations.some(
    (o) => o.organization_id === listing.organization.id,
  );

  const typeConfig = LISTING_TYPES[listing.listing_type];
  const categoryConfig = LISTING_CATEGORIES[listing.category];
  const isOffer = listing.listing_type === 'offer';

  function handleDelete() {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    deleteMutation.mutate(listing!.id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['listings'] });
        navigate({ to: '/marketplace' });
      },
    });
  }

  return (
    <div className="max-w-3xl mx-auto p-6 pb-12 space-y-6">
      {/* Back link */}
      <Link to="/marketplace" className="text-sm text-gray-500 hover:text-gray-700 inline-block">
        &larr; Marketplace
      </Link>

      {/* Title + Actions */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                isOffer ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              }`}
            >
              {typeConfig?.label ?? listing.listing_type}
            </span>
            {categoryConfig && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryConfig.badgeColor}`}>
                {categoryConfig.label}
              </span>
            )}
            {listing.subcategory && LISTING_SUBCATEGORIES[listing.category]?.[listing.subcategory] && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {LISTING_SUBCATEGORIES[listing.category][listing.subcategory].label}
              </span>
            )}
            {listing.status === 'closed' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                Closed
              </span>
            )}
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-900">{listing.title}</h1>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/marketplace/$id/edit"
              params={{ id: listing.id }}
              className="px-3 py-1.5 text-sm font-medium border border-border rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="px-3 py-1.5 text-sm font-medium border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      {/* Images */}
      {listing.images && listing.images.length > 0 && (
        <ImageGallery images={listing.images} />
      )}

      {/* Description */}
      <div className="prose prose-sm max-w-none">
        <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4">
        {listing.quantity != null && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-0.5">Quantity</p>
            <p className="text-sm font-medium text-gray-900">{listing.quantity}</p>
          </div>
        )}
        {listing.expires_at && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-0.5">Expires</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(listing.expires_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        )}
      </div>

      {/* Organization */}
      <div className="border border-border rounded-lg p-4">
        <p className="text-xs text-gray-500 mb-2">Posted by</p>
        <Link
          to="/organizations/$id"
          params={{ id: listing.organization.slug || listing.organization.id }}
          className="flex items-center gap-3 group"
        >
          {listing.organization.image_url ? (
            <img
              src={listing.organization.image_url}
              alt={listing.organization.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
              {listing.organization.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
              {listing.organization.name}
            </p>
          </div>
        </Link>
      </div>

      {/* Community */}
      {listing.community && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-0.5">Community</p>
          <p className="text-sm font-medium text-gray-900">{listing.community.name}</p>
        </div>
      )}

      {/* Contact button */}
      {!isOwner && me.data && (
        <Link
          to="/messages"
          className="block w-full text-center bg-primary text-primary-foreground rounded-lg px-4 py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Contact {listing.organization.name}
        </Link>
      )}

      {/* Timestamp */}
      <p className="text-xs text-gray-400">
        Posted {new Date(listing.created_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </p>
    </div>
  );
}
