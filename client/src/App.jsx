import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import ItemForm from './components/ItemForm';
import ItemCard from './components/ItemCard';
import ItemDetails from './components/ItemDetails';
import CampusMap from './components/CampusMap';
import ImageSearchModal from './components/ImageSearchModal';
import { PlusCircle, X, Search, Camera } from 'lucide-react';

const API_BASE = 'https://campus-lost-and-found-7fl0.onrender.com';
const API_URL = `${API_BASE}/api/items`;

function App() {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matchResults, setMatchResults] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setItems(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching items:', err);
      setLoading(false);
    }
  };

  const handleCreateItem = async (formData) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Failed to create item.');
        return;
      }
      const newItem = await res.json();
      setItems(prev => [newItem, ...prev]);
      setShowForm(false);
    } catch (err) {
      console.error('Error creating item:', err);
    }
  };

  const handleClaimItem = async (id, descriptorGuess) => {
    try {
      if (descriptorGuess) {
        // F8: Claim verification workflow
        const res = await fetch(`${API_URL}/${id}/verify-claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ descriptorGuess })
        });
        const result = await res.json();
        if (result.success) {
          alert('✅ Ownership verified! Item marked as pending delivery.');
          setItems(prev => prev.filter(item => item.id !== id));
        } else {
          alert('❌ Verification failed: ' + (result.error || 'Descriptor mismatch.'));
        }
      } else {
        // Direct claim
        await fetch(`${API_URL}/${id}/claim`, { method: 'DELETE' });
        setItems(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Error claiming item:', err);
    }
  };

  // F4: Find visual matches
  const handleFindMatches = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}/find-matches`, { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      setMatchResults(data);
    } catch (err) {
      console.error('Error finding matches:', err);
    }
  };

  // Build Hash Map for Keyword Search
  const searchIndex = useMemo(() => {
    const index = new Map();
    items.forEach(item => {
      const textToSearch = `${item.name} ${item.description} ${item.category || ''}`.toLowerCase();
      const words = textToSearch.split(/\W+/).filter(w => w.length > 2);
      
      words.forEach(word => {
        if (!index.has(word)) {
          index.set(word, new Set());
        }
        index.get(word).add(item.id);
      });
    });
    return index;
  }, [items]);

  // Perform search using the Hash Map
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;

    const queryWords = searchTerm.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    
    if (queryWords.length === 0) {
      return items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    const matchedIds = new Set();
    queryWords.forEach(word => {
      for (let key of searchIndex.keys()) {
        if (key.includes(word)) {
          const ids = searchIndex.get(key);
          ids.forEach(id => matchedIds.add(id));
        }
      }
    });

    return items.filter(item => matchedIds.has(item.id));
  }, [items, searchTerm, searchIndex]);

  // Separate arrays for lost and found items
  const lostItems = filteredItems.filter(item => item.type === 'LOST');
  const foundItems = filteredItems.filter(item => item.type === 'FOUND');

  // Home page content extracted for routing
  const HomePage = () => (
    <div className="app-container">
      {showForm && (
        <ItemForm 
          onSubmit={handleCreateItem} 
          onClose={() => setShowForm(false)} 
        />
      )}

      {/* Campus Map */}
      {!loading && items.length > 0 && (
        <CampusMap items={items} onSelectItem={(item) => window.location.href = `/items/${item.id}`} />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading items...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          {/* Lost Items Column */}
          <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.05)' }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#fca5a5', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', paddingBottom: '1rem' }}>
              Lost Items ({lostItems.length})
            </h2>
            {lostItems.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No lost items reported.</p>
            ) : (
              <motion.div layout>
                <AnimatePresence>
                  {lostItems.map(item => <ItemCard key={item.id} item={item} onClaim={handleClaimItem} onFindMatches={handleFindMatches} />)}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* Found Items Column */}
          <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(16, 185, 129, 0.05)' }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#6ee7b7', borderBottom: '1px solid rgba(16, 185, 129, 0.2)', paddingBottom: '1rem' }}>
              Found Items ({foundItems.length})
            </h2>
            {foundItems.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No found items reported.</p>
            ) : (
              <motion.div layout>
                <AnimatePresence>
                  {foundItems.map(item => <ItemCard key={item.id} item={item} onClaim={handleClaimItem} onFindMatches={handleFindMatches} />)}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

        </div>
      )}

      {/* Floating Action Button for Image Search */}
      <div className="fab-search" onClick={() => setShowSearchModal(true)}>
        <Camera size={24} />
      </div>

      {/* Image Search Modal */}
      <AnimatePresence>
        {showSearchModal && (
          <ImageSearchModal 
            onClose={() => setShowSearchModal(false)}
            onSelectItem={(id) => window.location.href = `/items/${id}`}
          />
        )}
      </AnimatePresence>

      {/* F4: Matches Modal */}
      {matchResults && (
        <div className="claim-modal-overlay" onClick={() => setMatchResults(null)}>
          <div className="matches-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search size={22} style={{ color: 'var(--accent-primary)' }} /> Visual Matches Found
              </h2>
              <button onClick={() => setMatchResults(null)} style={{ color: 'var(--text-secondary)' }}>
                <X size={24} />
              </button>
            </div>

            {matchResults.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No visual matches found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {matchResults.map((match, idx) => (
                  <div key={match.item.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ minWidth: '40px', textAlign: 'center' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: idx === 0 ? '#fbbf24' : 'var(--text-secondary)' }}>
                        #{idx + 1}
                      </span>
                    </div>
                    {match.item.imageUrl && (
                      <img src={`${API_BASE}${match.item.imageUrl}`} alt={match.item.name} style={{ width: '80px', height: '80px', borderRadius: '0.5rem', objectFit: 'cover' }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <h4>{match.item.name}</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{match.item.location}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 'bold',
                        color: match.similarity > 70 ? '#10b981' : match.similarity > 40 ? '#fbbf24' : '#ef4444'
                      }}>
                        {match.similarity.toFixed(1)}%
                      </div>
                      <small style={{ color: 'var(--text-secondary)' }}>match</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Header 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        onPostClick={() => setShowForm(true)} 
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/items/:id" element={<ItemDetails />} />
      </Routes>
    </>
  );
}

export default App;
