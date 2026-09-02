'use strict';
'use client';

import React from 'react';
import ContactSection from '@/components/ContactSection';

export default function ContactPage() {
  return (
    <div className="view active" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <ContactSection />
    </div>
  );
}
