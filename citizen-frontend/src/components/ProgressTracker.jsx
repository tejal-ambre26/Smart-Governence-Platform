const STAGE_LABELS = {
  SUBMITTED: 'Submitted',
  UNDER_VERIFICATION: 'Verification',
  VERIFIED: 'Verification',
  APPROVED: 'Approval',
  CERTIFICATE_GENERATED: 'Certificate Ready',
  DOWNLOADED: 'Downloaded',
  REJECTED: 'Rejected',
  RESUBMITTED: 'Resubmitted',
};

const DEFAULT_STAGES = [
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'VERIFIED', label: 'Verification' },
  { key: 'APPROVED', label: 'Approval' },
  { key: 'CERTIFICATE_GENERATED', label: 'Certificate Ready' },
  { key: 'DOWNLOADED', label: 'Downloaded' },
];

function getStageIndex(status, stages) {
  if (status === 'REJECTED') return -1;
  if (status === 'DOWNLOADED') return stages.length - 1;
  if (status === 'CERTIFICATE_GENERATED') return stages.findIndex(s => s.key === 'CERTIFICATE_GENERATED');
  if (status === 'APPROVED') return stages.findIndex(s => s.key === 'APPROVED');
  if (status === 'VERIFIED' || status === 'UNDER_VERIFICATION') {
    return stages.findIndex(s => s.key === 'VERIFIED');
  }
  if (status === 'RESUBMITTED') return 0;
  return stages.findIndex(s => s.key === 'SUBMITTED');
}

function ProgressTracker({ status, stages = DEFAULT_STAGES }) {
  const currentIdx = getStageIndex(status, stages);
  const isRejected = status === 'REJECTED';

  return (
    <div className="progress-tracker" role="list" aria-label="Application progress">
      {stages.map((stage, i) => {
        let stateClass = '';
        if (isRejected && i === 0) stateClass = 'rejected';
        else if (i < currentIdx) stateClass = 'completed';
        else if (i === currentIdx) stateClass = 'active';

        return (
          <div key={stage.key} className={`progress-stage ${stateClass}`} role="listitem">
            <div className="progress-dot" aria-hidden="true">
              {i < currentIdx ? '✓' : isRejected && i === 0 ? '✕' : i + 1}
            </div>
            <span className="progress-label">
              {STAGE_LABELS[stage.key] || stage.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default ProgressTracker;
