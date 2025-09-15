import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Coins, Timer, TrendingUp, AlertCircle } from "lucide-react";

interface JoinStakeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stake: {
    id: number;
    tokenName: string;
    totalAvailable: string;
    duration: string;
    APR: string;
    participants: number;
    status: string;
  } | null;
}

export const JoinStakeModal = ({ open, onOpenChange, stake }: JoinStakeModalProps) => {
  const [amount, setAmount] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  if (!stake) return null;

  const handleConfirm = async () => {
    setIsConfirming(true);
    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsConfirming(false);
    onOpenChange(false);
    setAmount("");
  };

  const estimatedRewards = amount ? (parseFloat(amount) * parseFloat(stake.APR.replace('%', '')) / 100).toFixed(2) : "0";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="stellar-surface border-0 max-w-md max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
        <DialogHeader className="space-y-4">
          <DialogTitle className="font-subheading text-2xl text-stellar-black text-center">
            Join {stake.tokenName} Stake
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 scrollbar-thin scrollbar-thumb-stellar-gold/30 scrollbar-track-transparent">
          {/* Stake Info Summary */}
          <div className="space-y-3 p-4 rounded-lg bg-stellar-warm-grey/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Coins className="w-4 h-4 text-stellar-teal" />
                <span className="font-body text-sm text-stellar-navy/70">Token</span>
              </div>
              <span className="font-body text-sm font-semibold text-stellar-black">
                {stake.tokenName}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Timer className="w-4 h-4 text-stellar-lilac" />
                <span className="font-body text-sm text-stellar-navy/70">Duration</span>
              </div>
              <span className="font-body text-sm font-semibold text-stellar-black">
                {stake.duration}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-stellar-gold" />
                <span className="font-body text-sm text-stellar-navy/70">APR</span>
              </div>
              <span className="font-subheading text-sm font-semibold text-stellar-teal">
                {stake.APR}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="font-body text-sm font-medium text-stellar-black">
              Amount to stake
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 text-lg font-body pr-16 border-stellar-warm-grey focus:ring-stellar-gold focus:border-stellar-gold"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="font-body text-sm font-semibold text-stellar-navy/70">
                  {stake.tokenName}
                </span>
              </div>
            </div>
          </div>

          {/* Estimated Rewards */}
          {amount && (
            <div className="p-4 rounded-lg bg-stellar-gold/10 border border-stellar-gold/20">
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-stellar-navy/70">Estimated rewards</span>
                <span className="font-subheading text-lg font-semibold text-stellar-black">
                  +{estimatedRewards} {stake.tokenName}
                </span>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-stellar-navy/5 border border-stellar-navy/10">
            <AlertCircle className="w-5 h-5 text-stellar-navy/60 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-body text-sm font-medium text-stellar-navy">
                Important Notice
              </p>
              <p className="font-body text-xs text-stellar-navy/70">
                Staked tokens will be locked for the full duration. Early withdrawal is not permitted.
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
              onClick={handleConfirm}
              disabled={!amount || parseFloat(amount) <= 0 || isConfirming}
              variant="stellar"
              className="flex-1 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConfirming ? "Confirming..." : "Confirm Stake"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};