import React from 'react';
import MedicineCard from '../MedicineCard';

// Displays one live Inventory batch (joined with its catalog medicine + pharmacy).
// Purely informational - links to the existing customer medicine detail page
// (which already shows full cross-pharmacy availability) rather than offering
// its own "add to cart", since checkout isn't wired to Inventory yet.
// Thin wrapper around the shared MedicineCard - see components/MedicineCard.jsx.
const PharmacyMedicineCard = ({ item, showPharmacy = false }) => (
  <MedicineCard
    medicine={item.medicine}
    status={item.status}
    expiringSoon={item.expiringSoon}
    price={item.sellingPrice}
    pharmacyName={showPharmacy ? item.pharmacy?.name : undefined}
  />
);

export default PharmacyMedicineCard;
