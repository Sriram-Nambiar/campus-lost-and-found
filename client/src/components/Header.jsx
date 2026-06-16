import React from 'react';
import { Search, Compass, PlusCircle, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Header = ({ searchTerm, setSearchTerm, onPostClick }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="app-bar">
      <div className="app-bar-content">
        {/* Logo Section */}
        <Link to="/" className="app-bar-logo">
          <div className="logo-icon-wrapper">
            <Compass size={24} style={{ color: '#fff' }} />
          </div>
          <span className="logo-text">Campus Locator</span>
        </Link>

        {/* Search Section (Only show on Home page) */}
        {isHome && (
          <div className="app-bar-search">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search items..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        {/* Actions Section */}
        <div className="app-bar-actions">
          {isHome && (
            <button className="btn btn-primary app-bar-btn" onClick={onPostClick}>
              <PlusCircle size={18} />
              <span className="btn-text">Post Item</span>
            </button>
          )}
          <div className="user-avatar">
            <User size={18} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
