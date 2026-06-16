import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, CheckCircle, FileText, Search, Mail, MessageCircle, Tag, Shield, X } from 'lucide-react';
import { format, formatDistanceToNow, differenceInHours } from 'date-fns';

const API_BASE_URL = 'https://campus-lost-and-found-7fl0.onrender.com';

const ItemCard = ({ item, onClaim, onFindMatches }) => {
  const isRecent = differenceInHours(new Date(), new Date(item.createdAt)) < 24;
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [descriptorGuess, setDescriptorGuess] = useState('');

  const handleClaimClick = () => {
    if (item.hiddenDescriptor) {
      setShowClaimModal(true);
    } else {
      onClaim(item.id, null);
    }
  };

  const handleVerifyClaim = () => {
    onClaim(item.id, descriptorGuess);
    setShowClaimModal(false);
    setDescriptorGuess('');
  };

  const handleGenerateFlyer = () => {
    window.open(`${API_BASE_URL}/api/items/${item.id}/flyer?baseUrl=${encodeURIComponent(window.location.origin)}`, '_blank');
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`glass-panel ${isRecent ? 'highlight-new' : ''}`} 
      style={{ padding: '1.5rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}
    >
      {isRecent && <div className="badge-new">NEW</div>}
      
      <div className="flex-between">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`badge ${item.type === 'LOST' ? 'badge-lost' : 'badge-found'}`}>
            {item.type}
          </span>
          {item.category && (
            <span className="badge badge-category">
              <Tag size={10} style={{ marginRight: '3px' }} />{item.category}
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {formatDistanceToNow(new Date(item.createdAt))} ago
        </span>
      </div>

      {item.imageUrl && (
        <div style={{ margin: '0.25rem 0', borderRadius: '0.5rem', overflow: 'hidden' }}>
          <img 
            src={`${API_BASE_URL}${item.imageUrl}`} 
            alt={item.name} 
            style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      <div>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>{item.name}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
          {item.description}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <MapPin size={14} />
          <span>{item.location}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <Calendar size={14} />
          <span>{format(new Date(item.date), 'MMM d, yyyy')}</span>
        </div>
      </div>

      {/* Contact Info (F1) */}
      {item.contactInfo && (
        <div className="contact-info-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <Mail size={13} />
            <a href={`mailto:${item.contactInfo.email}`} style={{ color: 'var(--accent-primary)' }}>{item.contactInfo.email}</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <MessageCircle size={13} />
            <a href={`https://wa.me/${item.contactInfo.whatsapp.replace('+', '')}`} target="_blank" rel="noreferrer" style={{ color: '#25D366' }}>
              WhatsApp: {item.contactInfo.whatsapp}
            </a>
          </div>
        </div>
      )}

      {/* Hidden descriptor indicator */}
      {item.hiddenDescriptor && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--accent-secondary)' }}>
          <Shield size={12} /> Protected — verification required to claim
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: 'auto' }}>
        {/* Generate PDF Flyer (F10) */}
        <button className="btn btn-outline" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }} onClick={handleGenerateFlyer}>
          <FileText size={14} /> PDF Flyer
        </button>

        {/* Find Visual Matches (F4) — only for items with images */}
        {item.imageUrl && (
          <button className="btn btn-outline" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }} onClick={() => onFindMatches(item.id)}>
            <Search size={14} /> Find Matches
          </button>
        )}

        {/* Claim Button (F8 aware) */}
        {item.type === 'FOUND' && (
          <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }} onClick={handleClaimClick}>
            <CheckCircle size={14} /> Claim
          </button>
        )}
      </div>

      {/* Claim Verification Modal (F8) */}
      {showClaimModal && (
        <div className="claim-modal-overlay" onClick={() => setShowClaimModal(false)}>
          <div className="claim-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="flex-between" style={{ marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={20} style={{ color: 'var(--accent-secondary)' }} /> Verify Ownership
              </h3>
              <button onClick={() => setShowClaimModal(false)} style={{ color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              This item is protected. Describe a hidden detail about the item to prove you're the owner.
            </p>
            <div className="input-group">
              <input 
                type="text"
                className="input-field" 
                placeholder="Enter the hidden descriptor..." 
                value={descriptorGuess}
                onChange={(e) => setDescriptorGuess(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowClaimModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleVerifyClaim} disabled={!descriptorGuess.trim()}>Verify & Claim</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ItemCard;
