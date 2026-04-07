import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
  Outlet,
} from '@tanstack/react-router';
import { z } from 'zod';
import { RootLayout } from '../routes/root';
import { HomePage } from '../routes/home';
import { LoginPage } from '../routes/login';
import { OrganizationsListPage } from '../routes/organizations/list';
import { OrganizationShowPage } from '../routes/organizations/show';
import { OrganizationNewPage } from '../routes/organizations/new';
import { OrganizationEditPage } from '../routes/organizations/edit';
import { ExplorerLayout } from '../routes/explorer/layout';
import { OrgLayout } from '../routes/org/layout';
import { OrgDashboardPage } from '../routes/org/dashboard';
import { OrgProfilePage } from '../routes/org/profile';
import { OrgRelationsPage } from '../routes/org/relations';
import { OrgAssessmentsPage } from '../routes/org/assessments';
import { AssessmentFormPage } from '../routes/org/assessment-form';
import { AssessmentResultsPage } from '../routes/org/assessment-results';
import { OrgCommunitiesListPage } from '../routes/org/communities-list';
import { OrgSettingsMembersPage } from '../routes/org/settings';
import { CommunityLayout } from '../routes/community/layout';
import { CommunityOverviewPage } from '../routes/community/index';
import { CommunityMembersPage } from '../routes/community/members';
import { CommunityMemberDetailPage } from '../routes/community/member-detail';
import { CommunityEventsListPage } from '../routes/community/events';
import { CommunityEventDetailPage } from '../routes/community/event-detail';
import { CommunityEventNewPage } from '../routes/community/event-new';
import { CommunityEventEditPage } from '../routes/community/event-edit';
import { CommunityChallengesListPage } from '../routes/community/challenges';
import { ChallengeDetailPage } from '../routes/community/challenge-detail';
import { ChallengeNewPage } from '../routes/community/challenge-new';
import { ChallengeEditPage } from '../routes/community/challenge-edit';
import { CommunityMatchmakingPage } from '../routes/community/matchmaking';
import { CommunityJoinRequestsPage } from '../routes/community/join-requests';
import { CommunitySettingsPage } from '../routes/community/settings';
import { MapPage } from '../routes/map';
import { CommunitiesPage } from '../routes/communities';
import { CommunityShowPage } from '../routes/communities/show';
import { CommunityNewPage } from '../routes/communities/new';
import { ForgotPasswordPage } from '../routes/forgot-password';
import { ResetPasswordPage } from '../routes/reset-password';
import { RegisterPage } from '../routes/register';
import { RegisterHubPage } from '../routes/register-hub';
import { RegisterFacilitatorPage } from '../routes/register-facilitator';
import { RegisterWithOrgPage } from '../routes/register-with-org';
import { RegisterInvitationPage } from '../routes/register-invitation';
import { VerifyInstructionsPage } from '../routes/verify-instructions';
import { VerifyEmailPage } from '../routes/verify-email';
import { TestGoogleAddressPage } from '../routes/test/google-address';
import { DocsPage } from '../routes/docs';
import { ChangelogPage } from '../routes/changelog';
import { FeedbackPage } from '../routes/feedback';
import { AdminLayout } from '../routes/admin/layout';
import { AdminOrganizationsPage } from '../routes/admin/organizations';
import { AdminUsersPage } from '../routes/admin/users';
import { AdminCommunitiesPage } from '../routes/admin/communities';
import { AdminFeedbacksPage } from '../routes/admin/feedbacks';
import { NotificationsPage } from '../routes/notifications';
import { SettingsPage } from '../routes/settings';
import { NotificationPreferencesPage } from '../routes/notification-preferences';
import { MessagesPage } from '../routes/messages';
import { OrgMessagesPage } from '../routes/org/messages';
import { DataLayout } from '../routes/data/layout';
import { RotterdamPage } from '../routes/data/rotterdam';
import { RotterdamChartsPage } from '../routes/data/rotterdam-charts';
import { AthensPage } from '../routes/data/athens';
import { isAuthenticated, getMe, type User } from './auth';
import { queryClient } from './queryClient';

// ── Auth guards ──────────────────────────────────────────────

function requireAuth() {
  if (!isAuthenticated()) {
    throw redirect({ to: '/login' });
  }
}

async function ensureMe(): Promise<User> {
  const me = await queryClient.ensureQueryData<User>({
    queryKey: ['me'],
    queryFn: getMe,
  });
  return me;
}

async function requireOrgMember({ params }: { params: { orgSlug: string } }) {
  if (!isAuthenticated()) throw redirect({ to: '/login' });
  const me = await ensureMe();
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

async function requireAdmin() {
  if (!isAuthenticated()) throw redirect({ to: '/login' });
  const me = await ensureMe();
  if (me.role !== 'admin') {
    throw redirect({ to: '/' });
  }
}

async function requireCommunityMember({
  params,
}: {
  params: { orgSlug: string; communitySlug: string };
}) {
  if (!isAuthenticated()) throw redirect({ to: '/login' });
  const me = await ensureMe();
  const org = me.organizations.find(
    (o) => o.organization_slug === params.orgSlug
  );
  const hasCommunity = org?.communities.some(
    (c) => c.community_slug === params.communitySlug
  );
  // Also allow community admins (e.g. facilitator who created the community)
  const isCommunityAdmin = me.accessible_communities?.some(
    (c) => c.slug === params.communitySlug && c.is_admin
  );
  if (!hasCommunity && !isCommunityAdmin) {
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

const registerHubRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterHubPage,
});

const registerBasicRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register-basic',
  component: RegisterPage,
});

const registerFacilitatorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register-facilitator',
  component: RegisterFacilitatorPage,
});

const registerWithOrgRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register-with-org',
  component: RegisterWithOrgPage,
});

const registerInvitationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register-invitation',
  validateSearch: z.object({ token: z.string().optional() }),
  component: RegisterInvitationPage,
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

// ── Static pages ────────────────────────────────────────────

const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/docs',
  component: DocsPage,
});

const changelogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/changelog',
  component: ChangelogPage,
});

const feedbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/feedback',
  beforeLoad: requireAuth,
  component: FeedbackPage,
});

const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/notifications',
  beforeLoad: requireAuth,
  component: NotificationsPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  beforeLoad: requireAuth,
  component: SettingsPage,
});

const notificationPreferencesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/notification-preferences',
  beforeLoad: requireAuth,
  component: NotificationPreferencesPage,
});

const messagesRoute = createRoute({
  getParentRoute: () => explorerRoute,
  path: '/messages',
  beforeLoad: requireAuth,
  validateSearch: z.object({
    selected: z.string().optional(),
  }),
  component: MessagesPage,
});

// ── Shell A: Explorer ────────────────────────────────────────

const explorerRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'explorer',
  component: ExplorerLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => explorerRoute,
  path: '/',
  component: HomePage,
});

const organizationsRoute = createRoute({
  getParentRoute: () => explorerRoute,
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
  validateSearch: z.object({
    from: z.enum(['profile']).optional(),
  }),
  component: OrganizationShowPage,
});

const organizationEditRoute = createRoute({
  getParentRoute: () => organizationsRoute,
  path: '/$id/edit',
  component: OrganizationEditPage,
});

const mapRoute = createRoute({
  getParentRoute: () => explorerRoute,
  path: '/map',
  beforeLoad: requireAuth,
  component: MapPage,
});

const communitiesRoute = createRoute({
  getParentRoute: () => explorerRoute,
  path: '/communities',
  beforeLoad: requireAuth,
});

const communitiesIndexRoute = createRoute({
  getParentRoute: () => communitiesRoute,
  path: '/',
  component: CommunitiesPage,
});

const communityNewRoute = createRoute({
  getParentRoute: () => communitiesRoute,
  path: '/new',
  beforeLoad: requireAuth,
  component: CommunityNewPage,
});

const communityShowRoute = createRoute({
  getParentRoute: () => communitiesRoute,
  path: '/$id',
  component: CommunityShowPage,
});

// ── Data (under Explorer) ────────────────────────────────────

const dataRoute = createRoute({
  getParentRoute: () => explorerRoute,
  path: '/data',
  component: DataLayout,
});

const dataIndexRoute = createRoute({
  getParentRoute: () => dataRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/data/rotterdam' });
  },
});

const dataRotterdamRoute = createRoute({
  getParentRoute: () => dataRoute,
  path: '/rotterdam',
  component: RotterdamPage,
});

const dataRotterdamChartsRoute = createRoute({
  getParentRoute: () => dataRoute,
  path: '/rotterdam/charts',
  component: RotterdamChartsPage,
});

const dataAthensRoute = createRoute({
  getParentRoute: () => dataRoute,
  path: '/athens',
  component: AthensPage,
});

// ── Shell B: Mon Organisation (/$orgSlug) ────────────────────

const orgRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$orgSlug',
  beforeLoad: async ({ params }) => {
    requireAuth();
    await requireOrgMember({ params });
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

const orgAssessmentFormRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/assessments/$formId',
  component: AssessmentFormPage,
});

const orgAssessmentResultsRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/assessments/$formId/results',
  component: AssessmentResultsPage,
});

const orgMessagesRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/messages',
  component: OrgMessagesPage,
});

const orgCommunitiesRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/communities',
  component: OrgCommunitiesListPage,
});

const orgSettingsRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/settings',
  component: Outlet,
});

const orgSettingsIndexRoute = createRoute({
  getParentRoute: () => orgSettingsRoute,
  path: '/',
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/$orgSlug/settings/members',
      params: { orgSlug: params.orgSlug },
    });
  },
});

const orgSettingsMembersRoute = createRoute({
  getParentRoute: () => orgSettingsRoute,
  path: '/members',
  component: OrgSettingsMembersPage,
});

// ── Shell C: Community (/$orgSlug/communities/$communitySlug) ─

const communityRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/communities/$communitySlug',
  beforeLoad: async ({ params }) => {
    await requireCommunityMember({ params });
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
  validateSearch: z.object({
    search: z.string().optional(),
    page: z.number().optional(),
  }),
  component: CommunityMembersPage,
});

const communityMemberDetailRoute = createRoute({
  getParentRoute: () => communityRoute,
  path: '/members/$memberId',
  component: CommunityMemberDetailPage,
});

const communityEventsRoute = createRoute({
  getParentRoute: () => communityRoute,
  path: '/events',
  component: CommunityEventsListPage,
});

const communityEventNewRoute = createRoute({
  getParentRoute: () => communityRoute,
  path: '/events/new',
  component: CommunityEventNewPage,
});

const communityEventDetailRoute = createRoute({
  getParentRoute: () => communityRoute,
  path: '/events/$eventId',
  component: CommunityEventDetailPage,
});

const communityEventEditRoute = createRoute({
  getParentRoute: () => communityRoute,
  path: '/events/$eventId/edit',
  component: CommunityEventEditPage,
});

const communityChallengesRoute = createRoute({
  getParentRoute: () => communityRoute,
  path: '/challenges',
  component: CommunityChallengesListPage,
});

const communityChallengeNewRoute = createRoute({
  getParentRoute: () => communityRoute,
  path: '/challenges/new',
  component: ChallengeNewPage,
});

const communityChallengeDetailRoute = createRoute({
  getParentRoute: () => communityRoute,
  path: '/challenges/$challengeId',
  component: ChallengeDetailPage,
});

const communityChallengeEditRoute = createRoute({
  getParentRoute: () => communityRoute,
  path: '/challenges/$challengeId/edit',
  component: ChallengeEditPage,
});

const communityMatchmakingRoute = createRoute({
  getParentRoute: () => communityRoute,
  path: '/matchmaking',
  component: CommunityMatchmakingPage,
});

const communityJoinRequestsRoute = createRoute({
  getParentRoute: () => communityRoute,
  path: '/join-requests',
  component: CommunityJoinRequestsPage,
});

const communitySettingsRoute = createRoute({
  getParentRoute: () => communityRoute,
  path: '/settings',
  component: CommunitySettingsPage,
});

// ── Admin ────────────────────────────────────────────────────

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  beforeLoad: requireAdmin,
  component: AdminLayout,
});

const adminIndexRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/admin/organizations' });
  },
});

const adminOrganizationsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/organizations',
  component: AdminOrganizationsPage,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/users',
  component: AdminUsersPage,
});

const adminCommunitiesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/communities',
  component: AdminCommunitiesPage,
});

const adminFeedbacksRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/feedbacks',
  component: AdminFeedbacksPage,
});

// ── Route tree ───────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  loginRoute,
  registerHubRoute,
  registerBasicRoute,
  registerFacilitatorRoute,
  registerWithOrgRoute,
  registerInvitationRoute,
  verifyInstructionsRoute,
  verifyEmailRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  testGoogleAddressRoute,
  docsRoute,
  changelogRoute,
  feedbackRoute,
  notificationsRoute,
  settingsRoute,
  notificationPreferencesRoute,
  adminRoute.addChildren([
    adminIndexRoute,
    adminOrganizationsRoute,
    adminUsersRoute,
    adminCommunitiesRoute,
    adminFeedbacksRoute,
  ]),
  explorerRoute.addChildren([
    indexRoute,
    organizationsRoute.addChildren([
      organizationsIndexRoute,
      organizationNewRoute,
      organizationShowRoute,
      organizationEditRoute,
    ]),
    mapRoute,
    communitiesRoute.addChildren([
      communitiesIndexRoute,
      communityNewRoute,
      communityShowRoute,
    ]),
    messagesRoute,
    dataRoute.addChildren([
      dataIndexRoute,
      dataRotterdamRoute,
      dataRotterdamChartsRoute,
      dataAthensRoute,
    ]),
  ]),
  orgRoute.addChildren([
    orgIndexRoute,
    orgDashboardRoute,
    orgProfileRoute,
    orgRelationsRoute,
    orgAssessmentsRoute,
    orgAssessmentResultsRoute,
    orgAssessmentFormRoute,
    orgMessagesRoute,
    orgCommunitiesRoute,
    orgSettingsRoute.addChildren([
      orgSettingsIndexRoute,
      orgSettingsMembersRoute,
    ]),
    communityRoute.addChildren([
      communityIndexRoute,
      communityMembersRoute,
      communityMemberDetailRoute,
      communityEventsRoute,
      communityEventNewRoute,
      communityEventDetailRoute,
      communityEventEditRoute,
      communityChallengesRoute,
      communityChallengeNewRoute,
      communityChallengeDetailRoute,
      communityChallengeEditRoute,
      communityMatchmakingRoute,
      communityJoinRequestsRoute,
      communitySettingsRoute,
    ]),
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
