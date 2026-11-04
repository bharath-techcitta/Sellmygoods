import React from 'react';

export default function StatusBadge({ status }) {
  let bg = '#f3f4f6';
  let text = '#4b5563';
  let border = '#e5e7eb';

  switch (status) {
    case 'Active':
    case 'Complete':
    case 'Approved':
    case 'Verified':
    case 'Awarded':
    case 'Fully Received':
    case 'Fully Invoiced':
      bg = '#d1fae8';
      text = '#0f9d78';
      border = '#a7f3d0';
      break;
    case 'Pending Approval':
    case 'Under Evaluation':
    case 'Technical Review':
    case 'Commercial Review':
    case 'Scheduled':
    case 'Pending Receipt':
    case 'Awaiting Participation':
      bg = '#fff0d8';
      text = '#b65c16';
      border = '#fde68a';
      break;
    case 'In Review':
    case 'Negotiation':
    case 'Submitted':
    case 'Issued':
    case 'Published':
    case 'Live':
      bg = '#f0e5ff';
      text = '#432177';
      border = '#d8b4fe';
      break;
    case 'More Info Required':
    case 'Changes in Draft':
    case 'Partially Received':
      bg = '#deebff';
      text = '#3676ce';
      border = '#bfdbfe';
      break;
    case 'Rejected':
    case 'Cancelled':
    case 'High':
      bg = '#fce4e7';
      text = '#c32e3b';
      border = '#fecdd3';
      break;
    case 'Draft':
    default:
      bg = '#f3f4f6';
      text = '#6b7280';
      border = '#e5e7eb';
      break;
  }

  return (
    <span
      style={{
        backgroundColor: bg,
        color: text,
        border: `1px solid ${border}`,
        fontSize: '12px',
        fontWeight: '500',
        padding: '2px 8px',
        borderRadius: '9999px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: text
        }}
      />
      {status}
    </span>
  );
}
