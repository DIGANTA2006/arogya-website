import GallerySection from "@/components/gallery-section";
import Navbar from "@/components/navbar";
import HeroSection from "@/components/hero-section";
import AboutSection from "@/components/about-section";
import ServicesSection from "@/components/services-section";
import ConditionsSection from "@/components/conditions-section";
import CareProcessSection from "@/components/care-process-section";
import WhyChooseUs from "@/components/why-choose-us";
import HearingAidsSection from "@/components/hearing-aids-section";
import VirtualCareSection from "@/components/virtual-care-section";
import AppointmentSection from "@/components/appointment-section";
import FaqSection from "@/components/faq-section";
import ContactSection from "@/components/contact-section";
import FinalCtaSection from "@/components/final-cta-section";
import Footer from "@/components/footer";
import FloatingButtons from "@/components/floating-buttons";
import ChatBot from "@/components/chatbot";
import PortalAccessButton from "@/components/portal-access-button";

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <GallerySection />
      <AboutSection />
      <ServicesSection />
      <ConditionsSection />
      <CareProcessSection />
      <WhyChooseUs />
      <HearingAidsSection />
      <VirtualCareSection />
      <AppointmentSection />
      <FaqSection />
      <ContactSection />
      <FinalCtaSection />
      <Footer />
      <FloatingButtons />
      <ChatBot />
      <PortalAccessButton />
    </main>
  );
}