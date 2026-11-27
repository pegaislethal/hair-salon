'use client';

import React from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';

export default function SubAdminLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['sub_admin', 'super_admin']}>{children}</ProtectedRoute>;
}
