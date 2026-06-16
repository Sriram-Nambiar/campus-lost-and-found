import React, { useState } from 'react';
import { PlusCircle, X, Image as ImageIcon, MapPin, Mail, Shield, Tag } from 'lucide-react';
import { LOCATION_NAMES } from './CampusMap';

const CATEGORIES = ['Electronics', 'Clothing', 'Keys', 'Accessories', 'Documents', 'Bags', 'Water Bottles', 'Other'];

const ItemForm = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    type: 'LOST',
    name: '',
    description: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    email: '',
    category: '',
    hiddenDescriptor: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [coords, setCoords] = useState({ lat: '', lng: '' });
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) });
        setGettingLocation(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        alert('Could not get location. Please enter manually.');
        setGettingLocation(false);
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('type', formData.type);
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('location', formData.location);
    data.append('date', formData.date);
    data.append('email', formData.email);
    if (formData.category) data.append('category', formData.category);
    if (formData.hiddenDescriptor) data.append('hiddenDescriptor', formData.hiddenDescriptor);
    if (coords.lat && coords.lng) {
      data.append('lat', coords.lat);
      data.append('lng', coords.lng);
    }
    if (imageFile) {
      data.append('image', imageFile);
    }
    onSubmit(data);
  };

  return (
    <div className="glass-panel animate-slide-up" style={{ padding: '2rem', marginBottom: '2rem', position: 'relative' }}>
      <button 
        onClick={onClose}
        style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-secondary)' }}
      >
        <X size={24} />
      </button>
      
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <PlusCircle style={{ color: 'var(--accent-primary)' }} />
        Post an Item
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Row 1: Type, Date, Category */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div className="input-group">
            <label>Item Type</label>
            <select name="type" value={formData.type} onChange={handleChange} className="input-field">
              <option value="LOST">Lost Item</option>
              <option value="FOUND">Found Item</option>
            </select>
          </div>
          
          <div className="input-group">
            <label>Date Lost/Found</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="input-field" required />
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Tag size={14} /> Category
            </label>
            <select name="category" value={formData.category} onChange={handleChange} className="input-field">
              <option value="">Select Category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Row 2: Name, Email */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="input-group">
            <label>Item Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-field" placeholder="e.g., Blue Hydroflask" required />
          </div>
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Mail size={14} /> University Email
            </label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="you@university.edu" required />
          </div>
        </div>

        {/* Row 3: Location (campus dropdown + custom) */}
        <div className="input-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <MapPin size={14} /> Location on Campus
          </label>
          <select name="location" value={formData.location} onChange={handleChange} className="input-field" required>
            <option value="">Select a campus location</option>
            {LOCATION_NAMES.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            <option value="__custom">Other (type manually)</option>
          </select>
        </div>
        {formData.location === '__custom' && (
          <div className="input-group">
            <label>Custom Location</label>
            <input type="text" name="customLocation" className="input-field" placeholder="e.g., Near gate 3" onChange={(e) => setFormData({...formData, location: e.target.value})} required />
          </div>
        )}

        {/* Row 4: GPS Coordinates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
          <div className="input-group">
            <label>Latitude</label>
            <input type="text" value={coords.lat} onChange={(e) => setCoords({...coords, lat: e.target.value})} className="input-field" placeholder="e.g., 37.7749" />
          </div>
          <div className="input-group">
            <label>Longitude</label>
            <input type="text" value={coords.lng} onChange={(e) => setCoords({...coords, lng: e.target.value})} className="input-field" placeholder="e.g., -122.4194" />
          </div>
          <div className="input-group">
            <button type="button" className="btn btn-outline" onClick={handleGetLocation} disabled={gettingLocation} style={{ whiteSpace: 'nowrap' }}>
              <MapPin size={16} />
              {gettingLocation ? 'Getting...' : 'Use GPS'}
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="input-group">
          <label>Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} className="input-field" placeholder="Provide any identifying details..." rows="3" required />
        </div>

        {/* Row 5: Hidden Descriptor */}
        <div className="input-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Shield size={14} /> Secret Verification Question (Optional)
          </label>
          <input type="text" name="hiddenDescriptor" value={formData.hiddenDescriptor} onChange={handleChange} className="input-field" placeholder="e.g., Has a scratch on the left side (used to verify claims)" />
          <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
            Add a hidden detail only the real owner would know. Claimants must guess it to verify ownership.
          </small>
        </div>

        {/* Image Upload */}
        <div className="input-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ImageIcon size={18} />
            Attach Image (Optional)
          </label>
          <input type="file" accept="image/*" onChange={handleImageChange} className="input-field" style={{ padding: '0.5rem' }} />
          {imagePreview && (
            <div style={{ marginTop: '0.5rem', borderRadius: '0.5rem', overflow: 'hidden', maxWidth: '200px' }}>
              <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block', borderRadius: '0.5rem' }} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Submit Post</button>
        </div>
      </form>
    </div>
  );
};

export default ItemForm;
