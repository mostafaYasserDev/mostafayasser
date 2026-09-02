import React from 'react';
import Hero from '@/components/Hero';
import AboutSection from '@/components/AboutSection';
import ServicesSection from '@/components/ServicesSection';
import ProjectsSection from '@/components/ProjectsSection';
import ArticlesSection from '@/components/ArticlesSection';
import ReviewsSection from '@/components/ReviewsSection';
import ContactSection from '@/components/ContactSection';

export default function HomePage() {
  return (
    <div className="view active" id="home-view">
      <Hero />
      <AboutSection />
      <ServicesSection />
      <ProjectsSection />
      <ArticlesSection />
      <ReviewsSection />
      <ContactSection />
    </div>
  );
}
