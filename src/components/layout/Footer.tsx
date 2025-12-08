import Link from 'next/link';
import {
    Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin,
    CreditCard, Truck, Shield, HeadphonesIcon, Crown
} from 'lucide-react';

const footerLinks = {
    shop: [
        { label: 'All Products', href: '/products' },
        { label: 'Categories', href: '/categories' },
        { label: 'Deals & Offers', href: '/deals' },
        { label: 'New Arrivals', href: '/products?filter=new' },
        { label: 'Best Sellers', href: '/products?filter=bestsellers' },
    ],
    sellers: [
        { label: 'Become a Seller', href: '/seller/register' },
        { label: 'Seller Dashboard', href: '/seller' },
        { label: 'Seller Guidelines', href: '/seller/guidelines' },
        { label: 'Store Setup', href: '/seller/setup' },
    ],
    support: [
        { label: 'Help Center', href: '/help' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'FAQs', href: '/faqs' },
        { label: 'Returns & Refunds', href: '/returns' },
        { label: 'Shipping Info', href: '/shipping' },
    ],
    company: [
        { label: 'About Us', href: '/about' },
        { label: 'Careers', href: '/careers' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
    ],
};

const features = [
    { icon: Truck, label: 'Free Shipping', desc: 'On orders over ₱2,000' },
    { icon: Shield, label: 'Secure Payment', desc: '100% protected' },
    { icon: HeadphonesIcon, label: '24/7 Support', desc: 'Dedicated help' },
    { icon: CreditCard, label: 'Easy Returns', desc: '7-day returns' },
];

export default function Footer() {
    return (
        <footer className="bg-mocha-950 text-cloud-300">
            {/* Features Bar */}
            <div className="border-b border-mocha-800">
                <div className="container-custom py-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-mocha-800 flex items-center justify-center flex-shrink-0">
                                    <feature.icon className="w-6 h-6 text-mocha-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-cloud-100">{feature.label}</p>
                                    <p className="text-sm text-mocha-400">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Footer */}
            <div className="container-custom py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 rounded-xl gradient-mocha flex items-center justify-center">
                                <span className="text-white font-bold text-xl">G</span>
                            </div>
                            <div>
                                <span className="font-bold text-2xl text-cloud-100">GoCart</span>
                                <span className="text-mocha-400 text-sm ml-1">Plaridel</span>
                            </div>
                        </Link>
                        <p className="text-mocha-400 mb-6 leading-relaxed">
                            Your premium multi-vendor marketplace. Discover amazing products from trusted sellers worldwide.
                        </p>
                        <Link
                            href="/subscription"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-dusk-500 to-mocha-600 text-white font-semibold hover:opacity-90 transition-opacity"
                        >
                            <Crown className="w-5 h-5" />
                            Upgrade to Plus
                        </Link>
                        <div className="flex gap-3 mt-6">
                            {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="w-10 h-10 rounded-xl bg-mocha-800 hover:bg-mocha-700 flex items-center justify-center transition-colors"
                                >
                                    <Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-semibold text-cloud-100 mb-4">Shop</h4>
                        <ul className="space-y-3">
                            {footerLinks.shop.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-mocha-400 hover:text-mocha-300 transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-cloud-100 mb-4">Sellers</h4>
                        <ul className="space-y-3">
                            {footerLinks.sellers.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-mocha-400 hover:text-mocha-300 transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-cloud-100 mb-4">Support</h4>
                        <ul className="space-y-3">
                            {footerLinks.support.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-mocha-400 hover:text-mocha-300 transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-cloud-100 mb-4">Contact</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 flex-shrink-0 text-mocha-400" />
                                <span className="text-mocha-400">Plaridel, Bulacan, Philippines</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-mocha-400" />
                                <span className="text-mocha-400">+63 917 123 4567</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-mocha-400" />
                                <span className="text-mocha-400">support@gocartplaridel.com</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-mocha-800">
                <div className="container-custom py-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-mocha-500">
                        © {new Date().getFullYear()} GoCart Plaridel. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        <img src="/visa.svg" alt="Visa" className="h-6 opacity-60" />
                        <img src="/mastercard.svg" alt="Mastercard" className="h-6 opacity-60" />
                        <img src="/gcash.svg" alt="GCash" className="h-6 opacity-60" />
                    </div>
                </div>
            </div>
        </footer>
    );
}
