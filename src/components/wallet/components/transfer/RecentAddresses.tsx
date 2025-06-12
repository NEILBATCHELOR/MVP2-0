import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Copy, Star, StarOff, User, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Mock recent addresses data - in a real app, would come from API or storage
const recentAddresses = [
  {
    id: "1",
    address: "0x3Ab2f5d67890bCdE9D1c",
    name: "Treasury Multisig",
    lastUsed: "2 days ago",
    isFavorite: true,
    label: "MultiSig",
  },
  {
    id: "2",
    address: "0x9Ff4b567C890aD2A7b",
    name: "Exchange Wallet",
    lastUsed: "5 days ago",
    isFavorite: false,
    label: "Exchange",
  },
  {
    id: "3",
    address: "0x1A2b3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b",
    name: "Marketing Fund",
    lastUsed: "1 week ago",
    isFavorite: false,
    label: "Fund",
  },
  {
    id: "4",
    address: "0x5f4E3d2C1B0a9F8c7b5E4d3A2c1F0e9D8b7A6c5F",
    name: "Personal Savings",
    lastUsed: "2 weeks ago",
    isFavorite: true,
    label: "Personal",
  },
];

interface RecentAddressesProps {
  onSelectAddress: (address: string) => void;
}

export const RecentAddresses: React.FC<RecentAddressesProps> = ({ onSelectAddress }) => {
  const { toast } = useToast();

  // Function to copy address to clipboard
  const copyAddress = (address: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    toast({
      title: "Address copied",
      description: "Address copied to clipboard",
    });
  };

  // Function to toggle favorite status (mock)
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // In a real app, this would update state or call an API
    toast({
      title: "Favorite updated",
      description: "Address favorite status updated",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Recent Addresses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentAddresses.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onSelectAddress(item.address)}
            >
              <div className="flex items-center">
                <div className="bg-muted w-8 h-8 rounded-full flex items-center justify-center mr-3">
                  {item.label === "MultiSig" ? (
                    <Users className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <span className="font-mono">{item.address.substring(0, 6)}...{item.address.substring(item.address.length - 4)}</span>
                    <span className="mx-2">•</span>
                    <span>{item.lastUsed}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => toggleFavorite(item.id, e)}
                >
                  {item.isFavorite ? (
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  ) : (
                    <StarOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => copyAddress(item.address, e)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {recentAddresses.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No recent addresses found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};