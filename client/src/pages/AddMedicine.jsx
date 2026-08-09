import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MedicineForm from '../components/MedicineForm';
import { createMedicine } from '../services/medicineService';

const AddMedicine = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await createMedicine(payload);
      toast.success('Medicine added successfully');
      navigate('/medicines');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add medicine');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Add Medicine</h1>
      <p className="text-sm text-gray-500 mb-6">Add a new medicine to your inventory</p>
      <MedicineForm onSubmit={handleSubmit} submitting={submitting} submitLabel="Add Medicine" />
    </div>
  );
};

export default AddMedicine;
