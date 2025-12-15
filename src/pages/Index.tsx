import Layout from "@/components/Layout";
import HeroSection from "@/components/home/HeroSection";
import StatsBar from "@/components/home/StatsBar";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import PropertyTypes from "@/components/home/PropertyTypes";
import DeveloperPartners from "@/components/home/DeveloperPartners";
import LocationsGrid from "@/components/home/LocationsGrid";
import AbuDhabiLocationsGrid from "@/components/home/AbuDhabiLocationsGrid";
import RasAlKhaimahLocationsGrid from "@/components/home/RasAlKhaimahLocationsGrid";
import JumeirahRentals from "@/components/home/JumeirahRentals";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <DeveloperPartners />
      <StatsBar />
      <FeaturedProperties />
      <ReviewsSection />
      <JumeirahRentals />
      <PropertyTypes />
      <LocationsGrid />
      <AbuDhabiLocationsGrid />
      <RasAlKhaimahLocationsGrid />
    </Layout>
  );
};

export default Index;
