import { useEffect, useState } from 'react';
import api from '../api.js';

function CertificateDownloadCard({ appId, onClose }) {
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get(`/service-management-service/api/services/certificate/${appId}`)
      .then(res => {
        setCertificate(res.data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Certificate details not found or approval is still pending.');
        setIsLoading(false);
      });
  }, [appId]);

  const handlePrint = async () => {
    try {
      // Track download
      const res = await api.put(`/service-management-service/api/services/certificate/${certificate.certificateId}/download`);
      setCertificate(res.data);
      window.print();
    } catch (err) {
      console.error('Failed to increment download count', err);
      window.print();
    }
  };

  if (isLoading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Generating Certificate View...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error" style={{ margin: '1rem 0' }}>
        <span>⚠</span> {error}
        <button className="btn btn-secondary" onClick={onClose} style={{ marginLeft: '1rem', padding: '0.25rem 0.5rem' }}>Close</button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '2rem', overflowY: 'auto'
    }}>
      <div className="card" style={{
        maxWidth: 700, width: '100%', background: '#fff', color: '#1a1a1a',
        padding: '3rem', borderRadius: 'var(--radius)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        position: 'relative', border: '8px double var(--primary-color)'
      }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #1a1a1a', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 0.5rem 0', letterSpacing: '2px', color: 'var(--primary-color)', fontSize: '1.5rem', fontWeight: 800 }}>
            MUNICIPAL CORPORATION OF CIVICPULSE
          </h2>
          <h4 style={{ margin: 0, letterSpacing: '1px', fontSize: '1.1rem', fontWeight: 600 }}>
            GOVERNMENT OF STATE OF BHARAT
          </h4>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#555' }}>
            REGISTRY OF SERVICES & MUNICIPAL LICENSES
          </p>
        </div>

        {/* Certificate Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#777' }}>
            This is to certify the official issuance of
          </span>
          <h1 style={{ margin: '0.5rem 0', fontSize: '2rem', textTransform: 'uppercase', color: '#1a1a1a', borderBottom: '1px dashed #ccc', display: 'inline-block', padding: '0 2rem' }}>
            {certificate.type.replace('_', ' ')}
          </h1>
        </div>

        {/* Dynamic content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '1rem', lineHeight: '1.6', marginBottom: '3rem', color: '#333' }}>
          <div>
            <strong>Certificate ID:</strong> <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--primary-color)' }}>{certificate.certificateNumber}</span>
          </div>
          <div>
            <strong>Issued To:</strong> <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>{certificate.issuedTo}</span>
          </div>
          <div>
            <strong>Date of Issue:</strong> {new Date(certificate.issuedDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
          </div>
          {certificate.expiryDate && (
            <div>
              <strong>Expiry Date:</strong> <span style={{ color: '#d32f2f', fontWeight: 600 }}>{new Date(certificate.expiryDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
            </div>
          )}
          <div style={{ fontSize: '0.875rem', color: '#666', borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '1rem' }}>
            Verification Seal Hash: 
            <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', background: '#f5f5f5', padding: '0.5rem', borderRadius: '4px', marginTop: '0.25rem', border: '1px solid #e0e0e0' }}>
              {certificate.signatureSeal}
            </div>
          </div>
        </div>

        {/* Signatures & Seal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px solid #1a1a1a', paddingTop: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#555' }}>
            Downloads: <strong>{certificate.downloadCount}</strong>
          </div>
          
          {/* Municipal stamp */}
          <div style={{
            border: '3px solid #1976d2', color: '#1976d2', borderRadius: '50%',
            width: '90px', height: '90px', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', transform: 'rotate(-10deg)',
            fontWeight: 800, fontSize: '0.75rem', textAlign: 'center', borderStyle: 'dashed'
          }}>
            <span>MUNICIPAL</span>
            <span>SEAL</span>
            <span style={{ fontSize: '0.6rem' }}>OFFICIAL</span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'cursive', fontSize: '1.25rem', marginBottom: '0.25rem' }}>Municipal Commissioner</div>
            <div style={{ fontSize: '0.85rem', color: '#555', borderTop: '1px solid #ccc', paddingTop: '0.25rem' }}>Authorized Signatory</div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close Preview</button>
          <button className="btn btn-primary" onClick={handlePrint}>Print & Download</button>
        </div>

      </div>
    </div>
  );
}

export default CertificateDownloadCard;
