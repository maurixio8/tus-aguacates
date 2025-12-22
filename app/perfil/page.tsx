'use client';

import { useEffect } from 'react';

export default function PerfilRedirect() {
  useEffect(() => {
    window.location.href = '/cuenta';
  }, []);

  return null;
}