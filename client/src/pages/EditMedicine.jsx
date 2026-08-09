import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import MedicineForm from '../components/MedicineForm';
import Spinner from '../components/Spinner';
import { getMedicineById, updateMedicine } from '../services/medicineService';

const EditMedicine = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        const { data } = await getMedicineById(id);
        setMedicine(data.data.medicine);
      } catch (error) {
        toast.error('Failed to load medicine');
        navigate('/medicines');
      } finally {
        setLoading(false);
      }
    };
    fetchMedicine();
  }, [id, navigate]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await updateMedicine(id, payload);
      toast.success('Medicine updated successfully');
      navigate('/medicines');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update medicine');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner size="lg" />;

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Edit Medicine</h1>
      <p className="text-sm text-gray-500 mb-6">Update medicine details</p>
      {medicine && (
        <MedicineForm
          initialData={medicine}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitLabel="Update Medicine"
        />
      )}
    </div>
  );
};

export default EditMedicine;
