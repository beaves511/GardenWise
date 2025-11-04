"use client"; // Required because this component uses useState and useRouter

import { useState } from 'react';
import { useRouter } from 'next/navigation'; 

// STYLING CONSTANTS 
const GREEN_PRIMARY = '#10B981'; 
const GREEN_LIGHT = '#D1FAE5'; 
const GRAY_TEXT = '#4B5563'; 

const styles = {
  heroContainer: {
    textAlign: 'center',
    padding: '80px 20px',
    backgroundColor: GREEN_LIGHT, 
  },
  heroTagline: {
    color: GREEN_PRIMARY,
    fontWeight: '600',
    fontSize: '0.9em',
    marginBottom: '15px',
    padding: '5px 15px',
    borderRadius: '20px',
    display: 'inline-block',
    border: `1px solid ${GREEN_PRIMARY}`,
  },
  mainTitle: {
    fontSize: '3.5em',
    color: GREEN_PRIMARY,
    margin: '10px 0',
    fontWeight: '800',
  },
  mainSubtitle: {
    fontSize: '1.2em',
    color: GRAY_TEXT,
    maxWidth: '650px',
    margin: '0 auto 30px auto',
    lineHeight: '1.5',
  },
  searchForm: {
    display: 'flex',
    justifyContent: 'center',
    maxWidth: '600px',
    margin: '0 auto',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
  },
  searchInput: {
    flexGrow: 1,
    padding: '15px 20px',
    fontSize: '1em',
    border: 'none',
    outline: 'none',
  },
  searchButton: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: GREEN_PRIMARY,
    color: 'white',
    border: 'none',
    padding: '15px 30px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'background-color 0.2s',
  },
  contentSection: {
    textAlign: 'center',
    padding: '50px 20px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: '2em',
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: '20px',
  },
  contentBody: {
    fontSize: '1em',
    color: GRAY_TEXT,
  },
  footer: {
    textAlign: 'right',
    padding: '20px 50px',
    color: '#9CA3AF',
    fontSize: '0.85em',
  }
};

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    // Direct navigation to the detail page using the search term
    router.push(`/plants/${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div style={styles.pageWrapper}>
      
      {/* Search Header Content */}
      <div style={styles.heroContainer}>
        <p style={styles.heroTagline}>Your Complete Gardening Companion</p>
        <h2 style={styles.mainTitle}>GardenWise</h2>
        <p style={styles.mainSubtitle}>
          Track your plants, get expert care advice, plan your perfect garden, and connect with a thriving community of gardeners.
        </p>

        {/* Search Input Area */}
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for plants, care tips, or garden advice..."
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchButton}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '5px'}}>
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Search
          </button>
        </form>
      </div>

      {/* Content Below the Fold */}
      <section style={styles.contentSection}>
        <h3 style={styles.sectionTitle}>Everything you need to grow successfully</h3>
        <p style={styles.contentBody}>
          GardenWise eliminates the need for multiple apps.
          Our comprehensive database and AI planner simplify your gardening journey.
        </p>
      </section>
    </div>
  );
}
