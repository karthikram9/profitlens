import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export interface ShippingTier {
  maxAmount?: number | null;
  fee: number;
}

export interface BusinessAssumptions {
  cogs_percent: number;
  platform_fee_percent: number;
  gst_low_rate: number;
  gst_low_threshold: number;
  gst_high_rate: number;
  shipping_tiers: ShippingTier[];
  return_loss_amount: number;
  risk_tier_high: number;
  risk_tier_medium: number;
}

interface Props {
  initialData: BusinessAssumptions;
  onSave: (data: BusinessAssumptions) => void;
}

export const SettingsForm: React.FC<Props> = ({ initialData, onSave }) => {
  const [formData, setFormData] = useState<BusinessAssumptions>(initialData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleTierChange = (index: number, field: 'maxAmount' | 'fee', value: string) => {
    const newTiers = [...formData.shipping_tiers];
    if (field === 'maxAmount') {
      newTiers[index][field] = value ? parseFloat(value) : null;
    } else {
      newTiers[index][field] = parseFloat(value) || 0;
    }
    setFormData({ ...formData, shipping_tiers: newTiers });
  };

  const addTier = () => {
    setFormData({
      ...formData,
      shipping_tiers: [...formData.shipping_tiers, { fee: 0 }]
    });
  };
  
  const removeTier = (index: number) => {
    setFormData({
      ...formData,
      shipping_tiers: formData.shipping_tiers.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-lg">
      <Card headerSlot={<h3 className="text-lg font-semibold text-text-primary">Core Margins</h3>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <Input 
            label="Estimated COGS (%)" 
            name="cogs_percent" 
            type="number" 
            step="0.1"
            value={formData.cogs_percent} 
            onChange={handleChange} 
            required
          />
          <Input 
            label="Platform Fee (%)" 
            name="platform_fee_percent" 
            type="number"
            step="0.1" 
            value={formData.platform_fee_percent} 
            onChange={handleChange} 
            required
          />
          <Input 
            label="Return Loss (₹)" 
            name="return_loss_amount" 
            type="number" 
            value={formData.return_loss_amount} 
            onChange={handleChange} 
            required
          />
        </div>
      </Card>

      <Card headerSlot={<h3 className="text-lg font-semibold text-text-primary">GST Tiers</h3>}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
          <Input 
            label="Low Rate (%)" 
            name="gst_low_rate" 
            type="number" 
            step="0.1"
            value={formData.gst_low_rate} 
            onChange={handleChange} 
            required
          />
          <Input 
            label="Threshold (₹)" 
            name="gst_low_threshold" 
            type="number" 
            value={formData.gst_low_threshold} 
            onChange={handleChange} 
            required
          />
          <Input 
            label="High Rate (%)" 
            name="gst_high_rate" 
            type="number" 
            step="0.1"
            value={formData.gst_high_rate} 
            onChange={handleChange} 
            required
          />
        </div>
      </Card>

      <Card headerSlot={<h3 className="text-lg font-semibold text-text-primary">Shipping Tiers</h3>}>
        <div>
          <div className="space-y-sm mb-md">
            {formData.shipping_tiers.map((tier, idx) => (
              <div key={idx} className="flex gap-sm items-end">
                <Input
                  label={`Max Amount (₹) ${idx === formData.shipping_tiers.length - 1 ? '(Optional)' : ''}`}
                  value={tier.maxAmount ?? ''}
                  onChange={(e) => handleTierChange(idx, 'maxAmount', e.target.value)}
                  type="number"
                />
                <Input
                  label="Fee (₹)"
                  value={tier.fee}
                  onChange={(e) => handleTierChange(idx, 'fee', e.target.value)}
                  type="number"
                  required
                />
                <Button type="button" variant="destructive" onClick={() => removeTier(idx)} disabled={formData.shipping_tiers.length <= 1}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="secondary" onClick={addTier}>Add Tier</Button>
        </div>
      </Card>

      <Card headerSlot={<h3 className="text-lg font-semibold text-text-primary">Risk Tiers</h3>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <Input 
            label="Medium Risk Threshold (probability)" 
            name="risk_tier_medium" 
            type="number" 
            step="0.01"
            min="0"
            max="1"
            value={formData.risk_tier_medium} 
            onChange={handleChange} 
            required
          />
          <Input 
            label="High Risk Threshold (probability)" 
            name="risk_tier_high" 
            type="number" 
            step="0.01"
            min="0"
            max="1"
            value={formData.risk_tier_high} 
            onChange={handleChange} 
            required
          />
        </div>
      </Card>

      <div className="flex justify-end pt-md">
        <Button type="submit" size="lg">Save & Recompute</Button>
      </div>
    </form>
  );
};
