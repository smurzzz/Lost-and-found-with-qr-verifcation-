/**
 * v3 nav tab → expo-router route maps. Routes are typed as Href so they
 * satisfy expo-router's typed-routes checking.
 */

import type { Href } from 'expo-router';

type Route = Href;

const studentTabRoutes: Record<string, Route> = {
  home: '/(student)/home',
  search: '/(student)/search',
  report: '/(student)/report',
  notifications: '/(student)/notifications',
  profile: '/(student)/profile',
};

const staffTabRoutes: Record<string, Route> = {
  'staff-home': '/(staff)/dashboard',
  search: '/(student)/search',
  scan: '/(staff)/scan',
  audit: '/(staff)/audit',
  profile: '/(staff)/profile',
};

const fallbackRoute: Record<'student' | 'staff', Route> = {
  student: '/(student)/home',
  staff: '/(staff)/dashboard',
};

export function tabRoute(role: 'student' | 'staff', tab: string): Route {
  return role === 'student'
    ? (studentTabRoutes[tab] ?? fallbackRoute.student)
    : (staffTabRoutes[tab] ?? fallbackRoute.staff);
}
