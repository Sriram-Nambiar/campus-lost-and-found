import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Upload, Loader, Image as ImageIcon } from 'lucide-react';

const API_BASE = 'http://localhost:5000';
const API_URL = `${API_BASE}/api/items`;

const ImageSearchModal = ({ onClose, onSelectItem }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (selectedFile) => {
    if (!selectedFile.type.startsWith('image/')) {
      alert("Please upload an image file.");
      return;
    }
    setFile(selectedFile);
    performSearch(selectedFile);
  };

  const performSearch = async (searchFile) => {
    setLoading(true);
    setHasSearched(true);
    
    const formData = new FormData();
    formData.append('image', searchFile);

    try {
      const res = await fetch(`${API_URL}/search-by-image`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
      alert('Visual search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setFile(null);
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div className="claim-modal-overlay">
      <motion.div 
        className="glass-panel search-modal-content"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-between" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Camera className="text-accent-primary" /> Visual Search
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}><X size={24} /></button>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          {!hasSearched ? (
            <div 
              className={`dropzone ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleChange}
                style={{ display: 'none' }}
              />
              <Upload size={48} className="dropzone-icon" />
              <div>
                <h3 style={{ marginBottom: '0.5rem' }}>Drag & Drop an image</h3>
                <p style={{ color: 'var(--text-secondary)' }}>or click to browse your files</p>
              </div>
            </div>
          ) : (
            <div>
              {/* Search Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                {file && (
                  <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--border-color)' }}>
                    <img src={URL.createObjectURL(file)} alt="Search query" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div>
                  <h4 style={{ marginBottom: '0.25rem' }}>Looking for similar items...</h4>
                  <button onClick={resetSearch} className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>
                    New Search
                  </button>
                </div>
              </div>

              {/* Results */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--accent-primary)' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ display: 'inline-block', marginBottom: '1rem' }}>
                    <Loader size={32} />
                  </motion.div>
                  <p>Analyzing image structure & features...</p>
                </div>
              ) : (
                <div>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    Found {results.length} {results.length === 1 ? 'match' : 'matches'}
                  </h4>
                  
                  {results.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                      <ImageIcon size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
                      <p>No visually similar items found in the database.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                      <AnimatePresence>
                        {results.map((result, index) => (
                          <motion.div 
                            key={result.item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-panel"
                            style={{ padding: '0.75rem', cursor: 'pointer' }}
                            onClick={() => onSelectItem(result.item.id)}
                            whileHover={{ y: -5, scale: 1.02 }}
                          >
                            <div style={{ position: 'relative', marginBottom: '0.75rem', borderRadius: '4px', overflow: 'hidden' }}>
                              <img 
                                src={`${API_BASE}${result.item.imageUrl}`} 
                                alt={result.item.name}
                                style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }}
                              />
                              <div style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', color: result.similarity > 80 ? 'var(--success)' : 'var(--warning)' }}>
                                {Math.round(result.similarity)}% Match
                              </div>
                            </div>
                            <h5 style={{ fontSize: '0.9rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{result.item.name}</h5>
                            <span className={`badge ${result.item.type === 'LOST' ? 'badge-lost' : 'badge-found'}`} style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                              {result.item.type}
                            </span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ImageSearchModal;
