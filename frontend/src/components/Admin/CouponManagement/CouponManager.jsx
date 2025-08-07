import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { couponAPI } from '../../../services/couponService';
import toast from 'react-hot-toast';
import CreateCoupon from './CreateCoupon';

const CouponManager = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoupon = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const response = await couponAPI.getCoupon(id);
        setCoupon(response.data);
      } catch (error) {
        console.error('Error fetching coupon:', error);
        toast.error('Failed to fetch coupon');
        navigate('/admin/coupons');
      } finally {
        setLoading(false);
      }
    };

    fetchCoupon();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // If no ID provided, redirect to create page
  if (!id) {
    navigate('/admin/coupons/create');
    return null;
  }

  return <CreateCoupon existingCoupon={coupon} isEditing={true} />;
};

export default CouponManager;
