import { useState, useEffect, useRef } from 'react';
import Modal, { ModalHeader } from './Modal';
import { supabase } from '../supabase';

export default function EditProfileModal({ open, onClose, profile, onSaved }) {
  const [firstName,     setFirstName]     = useState('');
  const [lastName,      setLastName]      = useState('');
  const [mobile,        setMobile]        = useState('');
  const [email,         setEmail]         = useState('');
  const [stateDistrict, setStateDistrict] = useState('');
  const [avatarUrl,     setAvatarUrl]     = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploading,     setUploading]     = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const fileRef = useRef(null);

  /* Pre-fill form when modal opens */
  useEffect(() => {
    if (profile && open) {
      setFirstName(profile.first_name   || '');
      setLastName(profile.last_name     || '');
      setMobile(profile.mobile          || '');
      setEmail(profile.email            || '');
      setStateDistrict(profile.state_district || '');
      setAvatarUrl(profile.avatar_url   || '');
      setAvatarPreview(profile.avatar_url || '');
      setError('');
    }
  }, [profile, open]);

  /* Handle image file selected */
  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);

    setUploading(true);
    setError('');

    try {
      const ext      = file.name.split('.').pop();
      const fileName = `${profile.id}_${Date.now()}.${ext}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage bucket "avatars"
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadErr) {
        // Storage bucket may not exist — store as base64 fallback
        const reader = new FileReader();
        reader.onload = () => {
          setAvatarUrl(reader.result);
          setAvatarPreview(reader.result);
        };
        reader.readAsDataURL(file);
        setUploading(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(urlData.publicUrl);
      setAvatarPreview(urlData.publicUrl);
    } catch (err) {
      setError('Image upload failed. Your photo was kept locally.');
    }
    setUploading(false);
  }

  async function handleSave() {
    if (!firstName.trim()) { setError('First name is required'); return; }
    setSaving(true);
    setError('');

    const updates = {
      first_name:     firstName.trim(),
      last_name:      lastName.trim(),
      mobile:         mobile.replace(/\s/g, ''),
      email:          email.trim().toLowerCase() || null,
      state_district: stateDistrict.trim(),
    };

    // Only include avatar_url if it changed (column may not exist yet)
    if (avatarUrl && avatarUrl !== profile?.avatar_url) {
      updates.avatar_url = avatarUrl;
    }

    const { data, error: saveErr } = await supabase
      .from('users')
      .update(updates)
      .eq('id', profile.id)
      .select()
      .single();

    setSaving(false);

    if (saveErr) {
      // If avatar_url column doesn't exist, retry without it
      if (saveErr.message?.includes('avatar_url')) {
        delete updates.avatar_url;
        const { data: data2, error: saveErr2 } = await supabase
          .from('users').update(updates).eq('id', profile.id).select().single();
        if (saveErr2) { setError('Save failed: ' + saveErr2.message); return; }
        onSaved({ ...profile, ...updates, ...(data2 || {}) });
        onClose();
        return;
      }
      setError('Save failed: ' + saveErr.message);
      return;
    }

    onSaved({ ...profile, ...updates, ...(data || {}) });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth={440}>
      <ModalHeader title="Edit Profile" onClose={onClose} />

      {/* Avatar section */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {/* Avatar display */}
          {avatarPreview
            ? <img src={avatarPreview} alt="avatar"
                style={{
                  width: 96, height: 96, borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--green)',
                  boxShadow: '0 4px 16px rgba(45,122,58,0.25)',
                }} />
            : <div style={{
                width: 96, height: 96, borderRadius: '50%',
                background: 'linear-gradient(135deg,var(--green-light),var(--green-mid))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 40, border: '3px solid var(--green)',
                boxShadow: '0 4px 16px rgba(45,122,58,0.25)',
              }}>👨‍🌾</div>
          }

          {/* Camera button overlay */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--green)', color: '#fff',
              border: '2px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
          >
            {uploading ? '⏳' : '📷'}
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageChange}
        />

        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
          {uploading ? 'Uploading...' : 'Tap 📷 to change photo'}
        </div>
      </div>

      {error && (
        <div style={{
          background: '#FFEBEE', color: '#C62828',
          border: '1px solid #FFCDD2', borderRadius: 10,
          padding: '9px 14px', fontSize: 13, marginBottom: 14,
        }}>{error}</div>
      )}

      {/* Form fields */}
      <div className="row">
        <div className="form-group">
          <label className="form-label">First Name *</label>
          <input className="form-input" placeholder="First name"
            value={firstName} onChange={e => setFirstName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Last Name</label>
          <input className="form-input" placeholder="Last name"
            value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Mobile Number</label>
        <input className="form-input" type="tel" placeholder="+91 XXXXX XXXXX"
          value={mobile} onChange={e => setMobile(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Email Address <span style={{ color:'var(--muted)', fontWeight:400 }}>(optional)</span></label>
        <input className="form-input" type="email" placeholder="you@example.com"
          value={email} onChange={e => setEmail(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">State / District</label>
        <input className="form-input" placeholder="e.g. Tamil Nadu, Vellore"
          value={stateDistrict} onChange={e => setStateDistrict(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" style={{ flex: 2 }}
          onClick={handleSave} disabled={saving || uploading}>
          {saving ? '⏳ Saving...' : '💾 Save Changes'}
        </button>
      </div>
    </Modal>
  );
}
