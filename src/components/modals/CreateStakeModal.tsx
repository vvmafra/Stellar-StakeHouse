import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Coins, Timer, Users, AlertTriangle } from "lucide-react";
import { walletService } from "@/services/walletService";
import { sorobanService } from "@/services/sorobanService";
import { STELLAR_CONFIG } from "@/config/stellar";

interface CreateStakeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStakeCreated?: (stake: any) => void;
}

export const CreateStakeModal = ({ open, onOpenChange, onStakeCreated }: CreateStakeModalProps) => {
  const [formData, setFormData] = useState({
    token: "",
    totalAmount: "",
    duration: "",
    customDuration: ""
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    setIsCreating(true);
    
    try {
      // Get current wallet address
      const currentWallet = walletService.getCurrentWallet();
      if (!currentWallet?.isConnected) {
        throw new Error('Wallet is not connected');
      }

      console.log('currentWallet', currentWallet);
      console.log('STELLAR_CONFIG.CONTRACT_ID', STELLAR_CONFIG.CONTRACT_ID);

      // Convert XLM amount to stroops (1 XLM = 10,000,000 stroops)
      const amountInXlm = parseFloat(formData.totalAmount);
      if (isNaN(amountInXlm) || amountInXlm <= 0) {
        throw new Error('Please enter a valid amount');
      }
      const amountInStroops = Math.floor(amountInXlm * 10000000);
      
      console.log(`💰 Converting ${amountInXlm} XLM to ${amountInStroops} stroops`);

      // Call authorizeXlmSac function (uses XLM SAC for authorization)
      const result = await sorobanService.authorizeXlmSac(
        STELLAR_CONFIG.CONTRACT_ID,
        currentWallet.publicKey,
        amountInStroops
      );

      if (result.success) {
        console.log('✅ Authorize owner successful:', result);
        
        // Create new stake object
        const newStake = {
          id: Date.now(), // Simple ID generation
          tokenName: formData.token,
          totalAvailable: formData.totalAmount,
          duration: formData.duration === "custom" ? `${formData.customDuration} days` : formData.duration,
          APR: estimatedAPR,
          participants: 1, // Creator is the first participant
          status: "active" as const,
          createdAt: new Date().toISOString(),
          creator: currentWallet.publicKey
        };

        // Save to localStorage
        const existingStakes = JSON.parse(localStorage.getItem('userStakes') || '[]');
        const updatedStakes = [...existingStakes, newStake];
        localStorage.setItem('userStakes', JSON.stringify(updatedStakes));
        
        console.log('💾 Stake saved to localStorage:', newStake);
        
        // Notify parent component
        if (onStakeCreated) {
          onStakeCreated(newStake);
        }
        
        // Show success message or handle success
        // You can add a toast notification here
      } else {
        console.error('❌ Authorize owner failed:', result.error);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to authorize owner';
        if (result.error?.message?.includes('insufficient balance')) {
          errorMessage = 'Insufficient XLM balance. Please ensure you have enough XLM in your wallet.';
        } else if (result.error?.message?.includes('invalid token address')) {
          errorMessage = 'Token configuration error. Please contact support.';
        } else if (result.error?.message?.includes('authorization issues')) {
          errorMessage = 'Authorization failed. Please ensure your wallet is properly connected.';
        } else {
          errorMessage = result.error?.message || 'Failed to authorize owner';
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error in handleCreate:', error);
      // Handle error - you might want to show a toast or error message
    } finally {
      //função para adicionar um mockStakes do Dashboard
      setIsCreating(false);
      onOpenChange(false);
      setFormData({
        token: "",
        totalAmount: "",
        duration: "",
        customDuration: ""
      });
    }
  };

  const isFormValid = formData.token && formData.totalAmount && 
    (formData.duration || formData.customDuration);

  const getDurationDisplay = () => {
    if (formData.duration === "custom") {
      return formData.customDuration ? `${formData.customDuration} days` : "Custom duration";
    }
    return formData.duration;
  };

  const estimatedAPR = formData.duration ? 
    (formData.duration.includes("30") ? "8-10%" :
     formData.duration.includes("60") ? "10-14%" :
     formData.duration.includes("90") ? "14-18%" : "Variable") : "Variable";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="stellar-surface border-0 max-w-lg max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
        <DialogHeader className="space-y-4">
          <DialogTitle className="font-subheading text-2xl text-stellar-black text-center">
            Create New Project
          </DialogTitle>
          <p className="font-body text-stellar-navy/70 text-center">
            Set up a new staking pool for the community
          </p>
        </DialogHeader>

        <div className="space-y-6 scrollbar-thin scrollbar-thumb-stellar-gold/30 scrollbar-track-transparent">
          {/* Token Selection */}
          <div className="space-y-2">
            <Label htmlFor="token" className="font-body text-sm font-medium text-stellar-black">
              Token Type
            </Label>
            <Select value={formData.token} onValueChange={(value) => handleInputChange("token", value)}>
              <SelectTrigger className="h-12 border-stellar-warm-grey focus:ring-stellar-gold focus:border-stellar-gold">
                <SelectValue placeholder="Select token to stake" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="XLM">XLM - Stellar Lumens</SelectItem>
                {/* <SelectItem value="USDC">KALE</SelectItem> */}
                {/* <SelectItem value="USDC">USDC - USD Coin</SelectItem>
                <SelectItem value="SDF">SDF - Stellar Development</SelectItem>
                <SelectItem value="AQUA">AQUA - Aquarius</SelectItem>
                <SelectItem value="yXLM">yXLM - Ultra Stellar</SelectItem> */}
              </SelectContent>
            </Select>
          </div>

          {/* Total Amount */}
          <div className="space-y-2">
            <Label htmlFor="totalAmount" className="font-body text-sm font-medium text-stellar-black">
              Total Amount to Distribute
            </Label>
            <div className="relative">
              <Input
                id="totalAmount"
                type="number"
                placeholder="0.00"
                value={formData.totalAmount}
                onChange={(e) => handleInputChange("totalAmount", e.target.value)}
                className="h-12 text-lg font-body pr-16 border-stellar-warm-grey focus:ring-stellar-gold focus:border-stellar-gold"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="font-body text-sm font-semibold text-stellar-navy/70">
                  {formData.token || "TOKEN"}
                </span>
              </div>
            </div>
          </div>

          {/* Duration Selection */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="font-body text-sm font-medium text-stellar-black">
              Staking Duration
            </Label>
            <Select value={formData.duration} onValueChange={(value) => handleInputChange("duration", value)}>
              <SelectTrigger className="h-12 border-stellar-warm-grey focus:ring-stellar-gold focus:border-stellar-gold">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30 days">30 days</SelectItem>
                {/* <SelectItem value="custom">Custom duration</SelectItem> */}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Duration Input */}
          {formData.duration === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="customDuration" className="font-body text-sm font-medium text-stellar-black">
                Custom Duration (days)
              </Label>
              <Input
                id="customDuration"
                type="number"
                placeholder="Enter days"
                value={formData.customDuration}
                onChange={(e) => handleInputChange("customDuration", e.target.value)}
                className="h-12 border-stellar-warm-grey focus:ring-stellar-gold focus:border-stellar-gold"
              />
            </div>
          )}

          {/* Preview */}
          {isFormValid && (
            <div className="space-y-3 p-4 rounded-lg bg-stellar-teal/10 border border-stellar-teal/20">
              <h4 className="font-subheading text-lg text-stellar-black">Stake Preview</h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Coins className="w-4 h-4 text-stellar-teal" />
                    <span className="font-body text-sm text-stellar-navy/70">Token</span>
                  </div>
                  <span className="font-body text-sm font-semibold text-stellar-black">
                    {formData.token}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Timer className="w-4 h-4 text-stellar-lilac" />
                    <span className="font-body text-sm text-stellar-navy/70">Duration</span>
                  </div>
                  <span className="font-body text-sm font-semibold text-stellar-black">
                    {getDurationDisplay()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  {/* <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-stellar-gold" />
                    <span className="font-body text-sm text-stellar-navy/70">Est. APR</span>
                  </div> */}
                  <span className="font-subheading text-sm font-semibold text-stellar-teal">
                    {estimatedAPR}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-stellar-navy/5 border border-stellar-navy/10">
            <AlertTriangle className="w-5 h-5 text-stellar-navy/60 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-body text-sm font-medium text-stellar-navy">
                Creator Responsibilities
              </p>
              <p className="font-body text-xs text-stellar-navy/70">
                As the stake creator, you're responsible for providing the stated rewards. 
                This action will allow the contract to spend your amount of tokens until the stake period ends.
              </p>
            </div>
          </div>

          <Separator className="bg-stellar-warm-grey" />

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 border-stellar-warm-grey text-stellar-navy hover:bg-stellar-warm-grey/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!isFormValid || isCreating}
              variant="stellar"
              className="flex-1 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating Project..." : "Create Project"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};