import { useLocation, useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { CheckCircle2 } from 'lucide-react';

export default function PaymentSuccessScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    return (
      <AppShell title="Payment Status">
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>
          No disbursement data found. <button onClick={() => navigate('/welfare/disbursements')}
            style={{ color: 'var(--color-primary)', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            View all disbursements
          </button>
        </div>
      </AppShell>
    );
  }

  const { transactionId, amount, applicantName, schemeName, paymentMode } = state;

  return (
    <AppShell title="Payment Successful">
      <div style={{ maxWidth: '520px', margin: '40px auto' }}>

        {/* Step indicators */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '40px', overflowX: 'auto' }}>
          {['Application', 'Verification', 'Approved', 'Disbursement', 'Successful'].map((step, i) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#6366f1',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '13px',
                  boxShadow: i === 4 ? '0 0 0 5px rgba(99,102,241,0.25)' : 'none' }}>
                  <CheckCircle2 size={18} />
                </div>
                <span style={{ fontSize: '10px', fontWeight: i === 4 ? 700 : 500,
                  color: '#6366f1', whiteSpace: 'nowrap' }}>{step}</span>
              </div>
              {i < 4 && <div style={{ width: '36px', height: '2px', backgroundColor: '#6366f1', margin: '0 4px', marginBottom: '16px' }} />}
            </div>
          ))}
        </div>

        {/* Success Card */}
        <div style={{ textAlign: 'center', padding: '48px 40px', backgroundColor: 'white',
          borderRadius: '20px', border: '1px solid var(--color-border)', boxShadow: '0 8px 32px rgba(99,102,241,0.12)' }}>

          {/* Animated green checkmark */}
          <div style={{ width: '96px', height: '96px', borderRadius: '50%', margin: '0 auto 24px',
            backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 12px rgba(34,197,94,0.1)', animation: 'pulse 2s infinite' }}>
            <CheckCircle2 size={52} color="#16a34a" strokeWidth={2} />
          </div>

          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 800, color: '#15803d' }}>
            Payment Successful!
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 32px 0', fontSize: '15px' }}>
            Funds have been successfully disbursed.
          </p>

          {/* Amount */}
          <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0', marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
              AMOUNT DISBURSED
            </div>
            <div style={{ fontSize: '40px', fontWeight: 900, color: '#15803d' }}>
              ₹{Number(amount).toLocaleString('en-IN')}
            </div>
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            {[
              ['Beneficiary', applicantName],
              ['Scheme', schemeName],
              ['Payment Mode', paymentMode?.replace('_', ' ')],
              ['Transaction ID', transactionId],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 16px', borderRadius: '8px', backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)',
                  fontFamily: label === 'Transaction ID' ? 'monospace' : 'inherit' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => navigate('/welfare/disbursements')}
              style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--color-border)',
                backgroundColor: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
              View All Disbursements
            </button>
            <button onClick={() => window.print()}
              style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: '#6366f1',
                color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
              View Receipt 🖨
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 12px rgba(34,197,94,0.1); }
          50% { box-shadow: 0 0 0 20px rgba(34,197,94,0.05); }
        }
      `}</style>
    </AppShell>
  );
}
