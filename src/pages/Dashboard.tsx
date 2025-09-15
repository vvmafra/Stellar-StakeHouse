import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Plus, Timer, TrendingUp, Coins, LogOut } from "lucide-react";
import { JoinStakeModal } from "@/components/modals/JoinStakeModal";
import { CreateStakeModal } from "@/components/modals/CreateStakeModal";
import { useWallet } from "@/contexts/WalletContext";

// Mock data for stakes
const mockStakes = [
  {
    id: 1,
    tokenName: "XLM",
    totalAvailable: "50,000",
    duration: "30 days",
    APR: "8.5%",
    participants: 127, 
    status: "active"
  },
  {
    id: 2,
    tokenName: "USDC",
    totalAvailable: "25,000",
    duration: "60 days",
    APR: "12.2%",
    participants: 89,
    status: "active"
  },
  {
    id: 3,
    tokenName: "SDF",
    totalAvailable: "100,000",
    duration: "90 days",
    APR: "15.7%",
    participants: 234,
    status: "active"
  },
  {
    id: 4,
    tokenName: "AQUA",
    totalAvailable: "75,000",
    duration: "45 days",
    APR: "10.3%",
    participants: 156,
    status: "filling"
  }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { wallet, disconnectWallet, isConnecting, isConnected } = useWallet();
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedStake, setSelectedStake] = useState<typeof mockStakes[0] | null>(null);

  // Redirect to login if not connected
  useEffect(() => {
    if (!isConnected && !isConnecting) {
      navigate("/");
    }
  }, [isConnected, isConnecting, navigate]);

  // Function to format wallet address
  const formatWalletAddress = (address: string) => {
    if (!address) return 'Not connected';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const handleJoinStake = (stake: typeof mockStakes[0]) => {
    console.log("🚀 Opening JoinStakeModal for stake:", stake);
    setSelectedStake(stake);
    setJoinModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await disconnectWallet();
      navigate("/");
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-stellar-warm-grey bg-stellar-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-stellar-gold">
                <Star className="w-6 h-6 text-stellar-black" />
              </div>
              <div>
                <h1 className="font-headline text-2xl text-stellar-black">
                  Stellar StakingHouse
                </h1>
                <div className="flex items-center space-x-3">
                  <p className="font-body text-sm text-stellar-navy/70">
                    Connected: {formatWalletAddress(wallet?.publicKey || '')}
                  </p>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    disabled={isConnecting}
                    className="h-6 px-2 text-xs border-stellar-warm-grey text-stellar-navy hover:bg-stellar-warm-grey/20"
                  >
                    <LogOut className="w-3 h-3 mr-1" />
                  </Button>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => setCreateModalOpen(true)}
              variant="stellar"
              className="px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Stake
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="stellar-surface border-0 bg-stellar-warm-grey/20 border border-stellar-warm-grey/30">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-stellar-teal/10">
                  <Coins className="w-6 h-6 text-stellar-teal" />
                </div>
                <div>
                  <p className="font-body text-sm text-stellar-navy/70">Total Staked</p>
                  <p className="font-subheading text-2xl text-stellar-black">$2.4M</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stellar-surface border-0 bg-stellar-warm-grey/20 border border-stellar-warm-grey/30">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-stellar-lilac/10">
                  <TrendingUp className="w-6 h-6 text-stellar-lilac" />
                </div>
                <div>
                  <p className="font-body text-sm text-stellar-navy/70">Avg APR</p>
                  <p className="font-subheading text-2xl text-stellar-black">11.7%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stellar-surface border-0 bg-stellar-warm-grey/20 border border-stellar-warm-grey/30">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-stellar-gold/10">
                  <Timer className="w-6 h-6 text-stellar-gold" />
                </div>
                <div>
                  <p className="font-body text-sm text-stellar-navy/70">Active Projects</p>
                  <p className="font-subheading text-2xl text-stellar-black">{mockStakes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-subheading text-3xl text-stellar-black">
              Open Projects
            </h2>
            <p className="font-body text-stellar-navy/70">
              {mockStakes.length} projects available
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockStakes.map((stake) => (
              <Card key={stake.id} className="bg-stellar-warm-grey/20 border border-stellar-warm-grey/30 hover:shadow-stellar-gold transition-stellar cursor-pointer group">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-subheading text-xl text-stellar-black">
                      {stake.tokenName}
                    </CardTitle>
                    <Badge 
                      variant={stake.status === "active" ? "default" : "secondary"}
                      className={stake.status === "active" 
                        ? "bg-stellar-teal text-stellar-white" 
                        : "bg-stellar-warm-grey text-stellar-navy"
                      }
                    >
                      {stake.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-body text-sm text-stellar-navy/70">Total Available</span>
                      <span className="font-body text-sm font-semibold text-stellar-black">
                        {stake.totalAvailable}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-body text-sm text-stellar-navy/70">Duration</span>
                      <span className="font-body text-sm font-semibold text-stellar-black">
                        {stake.duration}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-body text-sm text-stellar-navy/70">APR</span>
                      <span className="font-subheading text-lg font-semibold text-stellar-teal">
                        {stake.APR}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-body text-sm text-stellar-navy/70">Participants</span>
                      <span className="font-body text-sm text-stellar-black">
                        {stake.participants}
                      </span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleJoinStake(stake)}
                    variant="stellar"
                    className="w-full group-hover:stellar-glow"
                  >
                    Join Stake
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Modals */}
      <JoinStakeModal 
        open={joinModalOpen}
        onOpenChange={setJoinModalOpen}
        stake={selectedStake}
      />
      
      <CreateStakeModal 
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  );
};

export default Dashboard;