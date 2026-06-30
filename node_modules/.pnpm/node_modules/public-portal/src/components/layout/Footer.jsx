// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';

export default function Footer() {
  const footerLinks = [
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Terms of Service', path: '/terms' },
    { name: 'Contact Support', path: '/support' }
  ];

  return (
    <footer className="bg-tertiary dark:bg-on-tertiary-fixed w-full py-8 border-t border-tertiary-container mt-auto selection:text-tertiary selection:bg-tertiary-fixed-dim/30">
      <div className="flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto gap-6 md:gap-0">
        <div className="font-headline-md text-xl text-secondary-fixed text-center md:text-left font-bold">
          PPG Portal
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {footerLinks.map(link => (
            <Link key={link.path} className="text-tertiary-fixed-dim hover:text-secondary-fixed transition-colors font-body-md text-sm" to={link.path}>
              {link.name}
            </Link>
          ))}
        </div>
        <div className="text-tertiary-fixed-dim font-body-md text-sm text-center md:text-right">
          © {new Date().getFullYear()} PPG. Be the Teacher of the World.
        </div>
      </div>
    </footer>
  );
}