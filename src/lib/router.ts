import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
} from '@tanstack/react-router';
import { z } from 'zod';
import { RootLayout } from '../routes/root';
import { HomePage } from '../routes/home';
import { LoginPage } from '../routes/login';
import { OrganizationsListPage } from '../routes/organizations/list';
import { OrganizationShowPage } from '../routes/organizations/show';
import { OrganizationNewPage } from '../routes/organizations/new';
import { OrganizationEditPage } from '../routes/organizations/edit';
import { OrgLayout } from '../routes/org/layout';
import { OrgDashboardPage } from '../routes/org/dashboard';
import { OrgProfilePage } from '../routes/org/profile';
import { OrgRelationsPage } from '../routes/org/relations';
import { OrgAssessmentsPage } from '../routes/org/assessments';
import { OrgCommunitiesListPage } from '../routes/org/communities-list';
import { OrgSettingsPage } from '../routes/org/settings';
import { CommunityLayout } from '../routes/community/layout';
import { CommunityOverviewPage } from '../routes/community/index';
import { CommunityMembersPage } from '../routes/community/members';
import { CommunityEventsListPage } from '../routes/community/events';
import { CommunityChallengesListPage } from '../routes/community/challenges';
import { CommunityMatchmakingPage } from '../routes/community/matchmaking';
import { MapPage } from '../routes/map';
import { CommunitiesPage } from '../routes/communities';
import { ForgotPasswordPage } from '../routes/forgot-password';
import { ResetPasswordPage } from '../routes/reset-password';
import { RegisterPage } from '../routes/register';
import { RegisterWithOrgPage } from '../routes/register-with-org';
import { VerifyInstructionsPage } from '../routes/verify-instructions';
import { VerifyEmailPage } from '../routes/verify-email';
import { TestGoogleAddressPage } from '../routes/test/google-address';
import { isAuthenticated, type User } from './auth';
import { queryClient } from './queryClient';

// ── Auth guards ──────────────────────────────────────────────

function requireAuth() {
  if (!isAuthenticated()) {
    throw redirect({ to: '/login' });
  }
}

function requireOrgMember({ params }: { params: { orgSlug: string } }) {
  const me = queryClient.getQueryData<User>(['me']);
  if (!me) throw redirect({ to: '/login' });
  const isMember = me.organizations.some(
    (o) => o.organization_slug === params.orgSlug
  );
  if (!isMember) {
    throw redirect({
      to: '/organizations/$id',
      params: { id: params.orgSlug },
    });
  }
}

function requireCommunityMember({
  params,
}: {
  params: { orgSlug: string; communitySlug: string };
}) {
  const me = queryClient.getQueryData<User>(['me']);
  if (!me) throw redirect({ to: '/login' });
  const org = me.organizations.find(
    (o) => o.organization_slug === params.orgSlug
  );
  const hasCommunity = org?.communities.some(
    (c) => c.community_slug === params.communitySlug
  );
  if (!hasCommunity) {
    throw redirect({
      to: '/$orgSlug/communities',
      params: { orgSlug: params.orgSlug },
    });
  }
}

// ── Root ─────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: RootLayout,
});

// ── Public ───────────────────────────────────────────────────

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: ForgotPasswordPage,
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  validateSearch: z.object({ token: z.string().optional() }),
  component: ResetPasswordPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
});

const registerWithOrgRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register-with-org',
  component: RegisterWithOrgPage,
});

const verifyInstructionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/verify-instructions',
  component: VerifyInstructionsPage,
});

const verifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/verify-email',
  validateSearch: z.object({ token: z.string().optional() }),
  component: VerifyEmailPage,
});

// ── Test pages (dev only) ────────────────────────────────────

const testGoogleAddressRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/test/google-address',
  component: TestGoogleAddressPage,
});

// ── Shell A: Explorer ────────────────────────────────────────

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const organizationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/organizations',
  beforeLoad: requireAuth,
});

const organizationsIndexRoute = createRoute({
  getParentRoute: () => organizationsRoute,
  path: '/',
  validateSearch: z.object({
    page: z.number().optional(),
    search: z.string().optional(),
  }),
  component: OrganizationsListPage,
});

const organizationNewRoute = createRoute({
  getParentRoute: () => organizationsRoute,
  path: '/new',
  component: OrganizationNewPage,
});

const organizationShowRoute = createRoute({
  getParentRoute: () => organizationsRoute,
  path: '/$id',
  component: OrganizationShowPage,
});

const organizationEditRoute = createRoute({
  getParentRoute: () => organizationsRoute,
  path: '/$id/edit',
  component: OrganizationEditPage,
});

const mapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/map',
  beforeLoad: requireAuth,
  component: MapPage,
});

const communitiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/communities',
  beforeLoad: requireAuth,
  component: CommunitiesPage,
});

// ── Shell B: Mon Organisation (/$orgSlug) ────────────────────

const orgRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$orgSlug',
  beforeLoad: ({ params }) => {
    requireAuth();
    requireOrgMember({ params });
  },
  component: OrgLayout,
});

// /$orgSlug → redirect to /$orgSlug/dashboard
const orgIndexRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/',
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/$orgSlug/dashboard',
      params: { orgSlug: params.orgSlug },
    });
  },
});

const orgDashboardRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/dashboard',
  component: OrgDashboardPage,
});

const orgProfileRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/profile',
  component: OrgProfilePage,
});

const orgRelationsRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/relations',
  component: OrgRelationsPage,
});

const orgAssessmentsRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/assessments',
  component: OrgAssessmentsPage,
});

const orgCommunitiesRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/communities',
  component: OrgCommunitiesListPage,
});

const orgSettingsRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/settings',
  component: OrgSettingsPage,
});

// ── Shell C: Community (/$orgSlug/communities/$communitySlug) ─

const communityRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/communities/$communitySlug',
  beforeLoad: ({ params }) => {
    requireCommunityMember({ params });
  },
  component: CommunityLayout,
});

const communityIndexRoute = createRoute({
  getParentRoute: () => communityRoute,
  path: '/',
  component: CommunityOverviewPage,
});

const communityMembersRoute = createRoute({
  getParentRoute: () => communityRoute,
  path: '/members',
  component: CommunityMembersPage,
});

const communityEventsRoute = createRoute({
  getParentRoute: () => communityRoute,
  path: '/events',
  component: CommunityEventsListPage,
});

const communityChallengesRoute = createRoute({
  getParentRoute: () => communityRoute,
  path: '/challenges',
  component: CommunityChallengesListPage,
});

const communityMatchmakingRoute = createRoute({
  getParentRoute: () => communityRoute,
  path: '/matchmaking',
  component: CommunityMatchmakingPage,
});

// ── Route tree ───────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  loginRoute,
  registerRoute,
  registerWithOrgRoute,
  verifyInstructionsRoute,
  verifyEmailRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  testGoogleAddressRoute,
  indexRoute,
  organizationsRoute.addChildren([
    organizationsIndexRoute,
    organizationNewRoute,
    organizationShowRoute,
    organizationEditRoute,
  ]),
  mapRoute,
  communitiesRoute,
  orgRoute.addChildren([
    orgIndexRoute,
    orgDashboardRoute,
    orgProfileRoute,
    orgRelationsRoute,
    orgAssessmentsRoute,
    orgCommunitiesRoute,
    orgSettingsRoute,
    communityRoute.addChildren([
      communityIndexRoute,
      communityMembersRoute,
      communityEventsRoute,
      communityChallengesRoute,
      communityMatchmakingRoute,
    ]),
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
