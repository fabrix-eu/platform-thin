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
import { MapPage } from '../routes/map';
import { CommunitiesPage } from '../routes/communities';
import { isAuthenticated } from './auth';

// Auth guard
function requireAuth() {
  if (!isAuthenticated()) {
    throw redirect({ to: '/login' });
  }
}

// Root
const rootRoute = createRootRoute({
  component: RootLayout,
});

// Public
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// Protected
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: requireAuth,
  component: HomePage,
});

// Organizations (admin list)
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

// Map
const mapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/map',
  beforeLoad: requireAuth,
  component: MapPage,
});

// Communities
const communitiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/communities',
  beforeLoad: requireAuth,
  component: CommunitiesPage,
});

// Org-scoped routes (/$orgSlug)
const orgRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$orgSlug',
  beforeLoad: requireAuth,
  component: OrgLayout,
});

const orgIndexRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/',
  component: OrgDashboardPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
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
  ]),
]);

export const router = createRouter({ routeTree });


declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
