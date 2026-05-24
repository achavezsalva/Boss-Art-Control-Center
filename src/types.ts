/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Admin' | 'Developer' | 'Viewer';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface Project {
  id: number;
  name: string;
  path: string;
  status: 'deploying' | 'running' | 'stopped' | 'failed';
  createdAt: string;
}

export interface SystemMetrics {
  cpu: number;
  ram: number;
  disk: number;
  uptime: number;
  appsCount: number;
  servicesCount: number;
}

export interface Backup {
  id: number;
  filename: string;
  createdAt: string;
}
