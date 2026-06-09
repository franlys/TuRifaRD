import React, { createContext, useContext, useState, useEffect } from 'react';

export interface TenantConfig {
  id: string;
  slug: string;
  companyName: string;
  primaryColor: string; // Neon Gold, Cyan, etc.
  secondaryColor: string; // Accent color hover
  bgColor: string; // Background primary
  cardBg: string; // Card background secondary
  borderBg: string; // Border color tertiary
}

interface TenantContextType {
  currentTenant: TenantConfig;
  tenantSlug: string;
}

const DEFAULT_TENANTS: Record<string, TenantConfig> = {
  turifard: {
    id: 't-turifard',
    slug: 'turifard',
    companyName: 'Tu Rifa RD',
    primaryColor: '#FFD700', // Gold
    secondaryColor: '#FFE57F',
    bgColor: '#0A0A0F',
    cardBg: '#12121A',
    borderBg: '#1E1E2E'
  },
  banshee: {
    id: 't-banshee',
    slug: 'banshee',
    companyName: 'Banshees RD',
    primaryColor: '#FF9F0A', // Orange Neon
    secondaryColor: '#FFD60A',
    bgColor: '#0B0A0F',
    cardBg: '#14121A',
    borderBg: '#221E2F'
  },
  cibao: {
    id: 't-cibao',
    slug: 'cibao',
    companyName: 'Sorteos del Cibao',
    primaryColor: '#00F5FF', // Neon Cyan
    secondaryColor: '#80FBFF',
    bgColor: '#080F1A',
    cardBg: '#0F1A2B',
    borderBg: '#1E2F47'
  }
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenantSlug, setTenantSlug] = useState('turifard');

  useEffect(() => {
    // Detect tenant slug from URL search param '?brand='
    const params = new URLSearchParams(window.location.search);
    const brandParam = params.get('brand');
    
    // Also detect dynamic subdomains
    const host = window.location.hostname;
    const sub = host.split('.')[0];
    
    if (brandParam && DEFAULT_TENANTS[brandParam]) {
      setTenantSlug(brandParam);
    } else if (sub && DEFAULT_TENANTS[sub]) {
      setTenantSlug(sub);
    }
  }, []);

  const currentTenant = DEFAULT_TENANTS[tenantSlug] || DEFAULT_TENANTS.turifard;

  // Invalidate standard document colors and inject brand custom CSS variables dynamically!
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent-gold', currentTenant.primaryColor);
    root.style.setProperty('--accent-gold-hover', currentTenant.secondaryColor);
    root.style.setProperty('--accent-gold-muted', `${currentTenant.primaryColor}1f`); // ~12% alpha opacity hex
    root.style.setProperty('--accent-gold-border', `${currentTenant.primaryColor}4d`); // ~30% alpha opacity hex
    
    root.style.setProperty('--bg-primary', currentTenant.bgColor);
    root.style.setProperty('--bg-secondary', currentTenant.cardBg);
    root.style.setProperty('--bg-tertiary', currentTenant.borderBg);
    root.style.setProperty('--border-color', currentTenant.borderBg);
    root.style.setProperty('--border-color-light', `${currentTenant.primaryColor}1a`); // Subtle gold/cyan border
    
    document.title = `${currentTenant.companyName} | Cumpliendo Sueños`;
  }, [currentTenant]);

  return (
    <TenantContext.Provider value={{ currentTenant, tenantSlug }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
