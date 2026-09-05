import React from 'react';
import MedicineCard from '../MedicineCard';

// Catalog-only card (no price/stock/pharmacy - a MedicineCatalog entry isn't
// tied to any one pharmacy's stock). Thin wrapper around the shared
// MedicineCard - see components/MedicineCard.jsx.
const MedicineCatalogCard = ({ medicine }) => (
  <MedicineCard medicine={medicine} composition={medicine?.composition} />
);

export default MedicineCatalogCard;
