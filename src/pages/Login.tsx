import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Star, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const Login = () => {
  const navigate = useNavigate();
  const { connectWallet, isConnected, isConnecting, error, clearError } = useWallet();
  const { toast } = useToast();

  // Redirect to dashboard if already connected
  useEffect(() => {
    if (isConnected) {
      navigate("/dashboard");
    }
  }, [isConnected, navigate]);

  // Show error toast when there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: "Erro de Conexão",
        description: error.message,
        variant: "destructive",
      });
      clearError();
    }
  }, [error, toast, clearError]);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      // Navigation will be handled by the useEffect above
    } catch (error) {
      console.error('Error connecting wallet:', error);
      // Error handling is done by the context
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background cosmic gradient */}
      <div className="absolute inset-0 bg-stellar-cosmic opacity-5"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-stellar-lilac/20 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-16 h-16 rounded-full bg-stellar-teal/20 animate-pulse delay-1000"></div>
      <div className="absolute top-1/3 right-10 w-12 h-12 rounded-full bg-stellar-gold/20 animate-pulse delay-500"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Stellar Logo/Monogram */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-stellar-gold mb-6 stellar-glow">
            <Star className="w-10 h-10 text-stellar-black" />
          </div>
          <h1 className="font-headline text-4xl text-stellar-black mb-2">
            Stellar StakingHouse
          </h1>
          <p className="font-subheading text-lg text-stellar-navy/80">
            Decentralized staking on Stellar
          </p>
        </div>

        {/* Login Card */}
        <Card className="stellar-surface border-0 p-8">
          <CardContent className="space-y-6 p-0">
            <div className="text-center space-y-3">
              <h2 className="font-subheading text-2xl text-stellar-black">
                Welcome to the Future
              </h2>
              <p className="font-body text-stellar-navy/70">
                Connect your Freighter wallet to start staking and earning rewards on the Stellar network.
              </p>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={handleConnectWallet}
                variant="stellar"
                className="w-full h-14 text-lg rounded-xl"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5 mr-3" />
                    Conectar Freighter Wallet
                  </>
                )}
              </Button>
              
              <div className="space-y-3">
                <p className="text-center text-sm font-body text-stellar-navy/60">
                  Don't have Freighter?{" "}
                  <a 
                    href="https://freighter.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-stellar-teal hover:text-stellar-teal/80 underline"
                  >
                    Download here
                  </a>
                </p>
                
                <div className="bg-stellar-warm-grey/20 rounded-lg p-3 text-center">
                  <p className="text-xs font-body text-stellar-navy/70">
                    <strong>Rede Atual:</strong> {process.env.NODE_ENV === 'production' ? 'Mainnet' : 'Testnet'}
                  </p>
                  <p className="text-xs font-body text-stellar-navy/60 mt-1">
                    Certifique-se de que sua wallet Freighter está configurada para a rede correta
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-stellar-warm-grey">
              <div className="flex items-center justify-center space-x-4 text-sm font-body text-stellar-navy/60">
                <span>Secure</span>
                <div className="w-1 h-1 bg-stellar-navy/30 rounded-full"></div>
                <span>Decentralized</span>
                <div className="w-1 h-1 bg-stellar-navy/30 rounded-full"></div>
                <span>Trustworthy</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="font-body text-sm text-stellar-navy/50">
            Powered by Stellar Network
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;