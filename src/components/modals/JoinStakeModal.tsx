import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Coins, Timer, TrendingUp, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { sorobanService } from "@/services/sorobanService";
import { STELLAR_CONFIG } from "@/config/stellar";

console.log("📦 JoinStakeModal module loaded");

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
  console.log("🎯 JoinStakeModal rendered", { open, stake });
  
  const [amount, setAmount] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");
  
  const { wallet, isConnected } = useWallet();
  console.log("🔗 Wallet state", { wallet, isConnected });

  if (!stake) {
    console.log("❌ No stake provided");
    return null;
  }

  const handleConfirm = async () => {
    console.log("handleConfirm called", { isConnected, wallet, amount });
    
    if (!isConnected || !wallet) {
      console.log("Wallet not connected");
      setErrorMessage("Please connect your wallet first");
      setTransactionStatus('error');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      console.log("Invalid amount");
      setErrorMessage("Please enter a valid amount");
      setTransactionStatus('error');
      return;
    }

    setIsConfirming(true);
    setTransactionStatus('idle');
    setErrorMessage("");

    try {
      // Call the smart contract join function
      console.log("Calling joinStake function with params:", {
        contractId: STELLAR_CONFIG.CONTRACT_ID,
        walletId: wallet.publicKey,
        amount: amount
      });
      
      const result = await sorobanService.joinStake({
        contractId: STELLAR_CONFIG.CONTRACT_ID,
        walletId: wallet.publicKey,
        amount: amount
      });

      if (result.success) {
        setTransactionStatus('success');
        // Close modal after a short delay to show success
        setTimeout(() => {
          onOpenChange(false);
          setAmount("");
          setTransactionStatus('idle');
        }, 2000);
      } else {
        setTransactionStatus('error');
        setErrorMessage(result.error?.message || "Transaction failed");
      }
    } catch (error: any) {
      setTransactionStatus('error');
      setErrorMessage(error.message || "An unexpected error occurred");
    } finally {
      setIsConfirming(false);
    }
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

          {/* Transaction Status */}
          {transactionStatus === 'success' && (
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-body text-sm font-medium text-green-800">
                  Transaction Successful!
                </p>
                <p className="font-body text-xs text-green-700">
                  You have successfully joined the stake. Your tokens are now staked.
                </p>
              </div>
            </div>
          )}

          {transactionStatus === 'error' && (
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-body text-sm font-medium text-red-800">
                  Transaction Failed
                </p>
                <p className="font-body text-xs text-red-700">
                  {errorMessage || "An error occurred while processing your transaction."}
                </p>
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
              onClick={() => {
                alert("Button clicked! Check console for details.");
                console.log("🔥 BUTTON CLICKED!", { amount, isConnected, isConfirming });
                handleConfirm();
              }}
              disabled={!amount || parseFloat(amount) <= 0 || isConfirming || !isConnected}
              variant="stellar"
              className="flex-1 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConfirming ? "Confirming..." : 
               transactionStatus === 'success' ? "Success!" :
               transactionStatus === 'error' ? "Try Again" :
               !isConnected ? "Connect Wallet" :
               "Confirm Stake"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};