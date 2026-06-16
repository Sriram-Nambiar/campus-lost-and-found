import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Mail, MessageCircle, Tag, Shield, ArrowLeft, FileText, CheckCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const API_BASE = 'http://localhost:5000';
const API_URL = `${API_BASE}/api/items`;

const ItemDetails = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [descriptorGuess, setDescriptorGuess] = useState('');
  const [claimStatus, setClaimStatus] = useState(null);

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const res = await fetch(`${API_URL}/${id}`);
      if (!res.ok) throw new Error('Item not found');
      const data = await res.json();
      setItem(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    try {
      if (item.hiddenDescriptor && descriptorGuess) {
        const res = await fetch(`${API_URL}/${id}/verify-claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ descriptorGuess })
        });
        const result = await res.json();
        if (result.success) {
          setClaimStatus('success');
        } else {
          setClaimStatus('failed');
        }
      } else {
        await fetch(`${API_URL}/${id}/claim`, { method: 'DELETE' });
        setClaimStatus('success');
      }
    } catch (err) {
      setClaimStatus('failed');
    }
    setShowClaimModal(false);
    setDescriptorGuess('');
  };

  const handleGenerateFlyer = () => {
    window.open(`${API_URL}/${id}/flyer?baseUrl=${encodeURIComponent(window.location.origin)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="app-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div className="glass-panel" style={{ padding: '3rem', display: 'inline-block' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Loading item details...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="app-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div className="glass-panel" style={{ padding: '3rem', maxWidth: '500px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--danger)' }}>Item Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            This item may have been claimed or archived.
          </p>
          <Link to="/" className="btn btn-primary">
            <ArrowLeft size={18} /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ maxWidth: '700px' }}>
      {/* Back button */}
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        <ArrowLeft size={18} /> Back to all items
      </Link>

      <div className="glass-panel animate-slide-up" style={{ padding: '2rem' }}>
        {/* Header row */}
        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={`badge ${item.type === 'LOST' ? 'badge-lost' : 'badge-found'}`}>
              {item.type}
            </span>
            {item.category && (
              <span className="badge badge-category">
                <Tag size={10} style={{ marginRight: '4px' }} />{item.category}
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {formatDistanceToNow(new Date(item.createdAt))} ago
          </span>
        </div>

        {/* Image */}
        {item.imageUrl && (
          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <img 
              src={`${API_BASE}${item.imageUrl}`} 
              alt={item.name} 
              style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}

        {/* Title & Description */}
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{item.name}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.7', marginBottom: '1.5rem' }}>
          {item.description}
        </p>

        {/* Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)' }}>
            <MapPin size={16} />
            <span>{item.location}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)' }}>
            <Calendar size={16} />
            <span>{format(new Date(item.date), 'MMMM d, yyyy')}</span>
          </div>
          {item.hiddenDescriptor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent-primary)' }}>
              <Shield size={16} />
              <span>Protected — verification required to claim</span>
            </div>
          )}
        </div>

        {/* Contact info */}
        {item.contactInfo && (
          <div className="contact-info-box" style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Contact Owner</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <Mail size={14} />
              <a href={`mailto:${item.contactInfo.email}`} style={{ color: 'var(--accent-primary)' }}>{item.contactInfo.email}</a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <MessageCircle size={14} />
              <a href={`https://wa.me/${item.contactInfo.whatsapp.replace('+', '')}`} target="_blank" rel="noreferrer" style={{ color: '#25D366' }}>
                WhatsApp: {item.contactInfo.whatsapp}
              </a>
            </div>
          </div>
        )}

        {/* Claim status banner */}
        {claimStatus === 'success' && (
          <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--success-bg)', border: '1px solid rgba(52,211,153,0.2)', marginBottom: '1rem', textAlign: 'center', color: 'var(--success)' }}>
            ✅ Ownership verified! Item marked as pending delivery.
          </div>
        )}
        {claimStatus === 'failed' && (
          <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--danger-bg)', border: '1px solid rgba(248,113,113,0.2)', marginBottom: '1rem', textAlign: 'center', color: 'var(--danger)' }}>
            ❌ Verification failed. The descriptor didn't match.
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={handleGenerateFlyer} style={{ flex: 1 }}>
            <FileText size={16} /> Download PDF Flyer
          </button>
          {item.type === 'FOUND' && !claimStatus && (
            <button className="btn btn-primary" onClick={() => item.hiddenDescriptor ? setShowClaimModal(true) : handleClaim()} style={{ flex: 1 }}>
              <CheckCircle size={16} /> Claim This Item
            </button>
          )}
        </div>
      </div>

      {/* Claim Verification Modal */}
      {showClaimModal && (
        <div className="claim-modal-overlay" onClick={() => setShowClaimModal(false)}>
          <div className="claim-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Shield size={20} style={{ color: 'var(--accent-primary)' }} /> Verify Ownership
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Describe a hidden detail about this item to prove you're the owner.
            </p>
            <div className="input-group">
              <input 
                type="text"
                className="input-field"
                placeholder="Enter the hidden descriptor..."
                value={descriptorGuess}
                onChange={(e) => setDescriptorGuess(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowClaimModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleClaim} disabled={!descriptorGuess.trim()}>Verify & Claim</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetails;
