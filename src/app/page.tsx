import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchModal from '@/components/search/SearchModal';
import ToastContainer from '@/components/ui/Toast';
import HeroSection from '@/components/home/HeroSection';
import FlashSaleBanner from '@/components/home/FlashSaleBanner';
import CategoriesSection from '@/components/home/CategoriesSection';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import DealsSection from '@/components/home/DealsSection';
import StoresSection from '@/components/home/StoresSection';
import SubscriptionSection from '@/components/home/SubscriptionSection';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <FlashSaleBanner />
        <CategoriesSection />
        <FeaturedProducts />
        <DealsSection />
        <StoresSection />
        <SubscriptionSection />
      </main>
      <Footer />
      <CartDrawer />
      <SearchModal />
      <ToastContainer />
    </>
  );
}
