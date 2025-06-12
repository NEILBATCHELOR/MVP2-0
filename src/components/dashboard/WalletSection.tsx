import React, { useState, useEffect } from "react";
import { Wallet, Plus, X, Check, AlertTriangle, Loader2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getWalletData,
  WalletAddress,
  WhitelistSettings,
} from "@/services/dashboard/dashboardDataService";

interface WalletSectionProps {
  sourceWallets?: WalletAddress[];
  issuanceWallets?: WalletAddress[];
  whitelistSettings?: WhitelistSettings;
  organizationId?: string;
}

const WalletSection = ({
  sourceWallets: initialSourceWallets,
  issuanceWallets: initialIssuanceWallets,
  whitelistSettings: initialWhitelistSettings,
  organizationId = "default-org",
}: WalletSectionProps) => {
  const [loading, setLoading] = useState(
    !initialSourceWallets ||
      !initialIssuanceWallets ||
      !initialWhitelistSettings,
  );
  const [sourceWalletsList, setSourceWalletsList] = useState<WalletAddress[]>(
    initialSourceWallets || [],
  );
  const [issuanceWalletsList, setIssuanceWalletsList] = useState<
    WalletAddress[]
  >(initialIssuanceWallets || []);
  const [whitelist, setWhitelist] = useState<WhitelistSettings>(
    initialWhitelistSettings || { enabled: false, addresses: [] },
  );
  const [newSourceWallet, setNewSourceWallet] = useState({
    address: "",
    label: "",
  });
  const [newIssuanceWallet, setNewIssuanceWallet] = useState({
    address: "",
    label: "",
  });
  const [newWhitelistAddress, setNewWhitelistAddress] = useState("");

  useEffect(() => {
    if (
      initialSourceWallets &&
      initialIssuanceWallets &&
      initialWhitelistSettings
    ) {
      setSourceWalletsList(initialSourceWallets);
      setIssuanceWalletsList(initialIssuanceWallets);
      setWhitelist(initialWhitelistSettings);
      return;
    }

    const fetchWalletData = async () => {
      setLoading(true);
      try {
        const data = await getWalletData(organizationId);
        setSourceWalletsList(data.sourceWallets);
        setIssuanceWalletsList(data.issuanceWallets);
        setWhitelist(data.whitelistSettings);
      } catch (error) {
        console.error("Error fetching wallet data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [
    organizationId,
    initialSourceWallets,
    initialIssuanceWallets,
    initialWhitelistSettings,
  ]);

  const addSourceWallet = () => {
    if (newSourceWallet.address && newSourceWallet.label) {
      setSourceWalletsList([
        ...sourceWalletsList,
        { id: Date.now().toString(), ...newSourceWallet },
      ]);
      setNewSourceWallet({ address: "", label: "" });
    }
  };

  const addIssuanceWallet = () => {
    if (newIssuanceWallet.address && newIssuanceWallet.label) {
      setIssuanceWalletsList([
        ...issuanceWalletsList,
        { id: Date.now().toString(), ...newIssuanceWallet },
      ]);
      setNewIssuanceWallet({ address: "", label: "" });
    }
  };

  const removeSourceWallet = (id: string) => {
    setSourceWalletsList(
      sourceWalletsList.filter((wallet) => wallet.id !== id),
    );
  };

  const removeIssuanceWallet = (id: string) => {
    setIssuanceWalletsList(
      issuanceWalletsList.filter((wallet) => wallet.id !== id),
    );
  };

  const toggleWhitelist = () => {
    setWhitelist({
      ...whitelist,
      enabled: !whitelist.enabled,
    });
  };

  const addWhitelistAddress = () => {
    if (
      newWhitelistAddress &&
      !whitelist.addresses.includes(newWhitelistAddress)
    ) {
      setWhitelist({
        ...whitelist,
        addresses: [...whitelist.addresses, newWhitelistAddress],
      });
      setNewWhitelistAddress("");
    }
  };

  const removeWhitelistAddress = (address: string) => {
    setWhitelist({
      ...whitelist,
      addresses: whitelist.addresses.filter((addr) => addr !== address),
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Wallet Management</h2>
        <p className="text-gray-600">
          Configure source and issuance wallets with whitelist controls
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading wallet data...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Source Wallets Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Source Wallets
                </CardTitle>
                <CardDescription>
                  Configure wallets that will be used as the source of funds for
                  your SPV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sourceWalletsList.map((wallet) => (
                    <div
                      key={wallet.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div>
                        <p className="font-medium">{wallet.label}</p>
                        <p className="text-sm text-gray-500">
                          {wallet.address}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSourceWallet(wallet.id)}
                        aria-label="Remove wallet"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">
                      Add New Source Wallet
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="source-wallet-label">
                          Wallet Label
                        </Label>
                        <Input
                          id="source-wallet-label"
                          placeholder="e.g., Treasury Wallet"
                          value={newSourceWallet.label}
                          onChange={(e) =>
                            setNewSourceWallet({
                              ...newSourceWallet,
                              label: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="source-wallet-address">
                          Wallet Address
                        </Label>
                        <Input
                          id="source-wallet-address"
                          placeholder="0x..."
                          value={newSourceWallet.address}
                          onChange={(e) =>
                            setNewSourceWallet({
                              ...newSourceWallet,
                              address: e.target.value,
                            })
                          }
                        />
                      </div>
                      <Button
                        onClick={addSourceWallet}
                        className="w-full"
                        disabled={
                          !newSourceWallet.address || !newSourceWallet.label
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Wallet
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Issuance Wallets Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Issuance Wallets
                </CardTitle>
                <CardDescription>
                  Configure wallets that will be used for token issuance and
                  management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {issuanceWalletsList.map((wallet) => (
                    <div
                      key={wallet.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div>
                        <p className="font-medium">{wallet.label}</p>
                        <p className="text-sm text-gray-500">
                          {wallet.address}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIssuanceWallet(wallet.id)}
                        aria-label="Remove wallet"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">
                      Add New Issuance Wallet
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="issuance-wallet-label">
                          Wallet Label
                        </Label>
                        <Input
                          id="issuance-wallet-label"
                          placeholder="e.g., Primary Issuance"
                          value={newIssuanceWallet.label}
                          onChange={(e) =>
                            setNewIssuanceWallet({
                              ...newIssuanceWallet,
                              label: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="issuance-wallet-address">
                          Wallet Address
                        </Label>
                        <Input
                          id="issuance-wallet-address"
                          placeholder="0x..."
                          value={newIssuanceWallet.address}
                          onChange={(e) =>
                            setNewIssuanceWallet({
                              ...newIssuanceWallet,
                              address: e.target.value,
                            })
                          }
                        />
                      </div>
                      <Button
                        onClick={addIssuanceWallet}
                        className="w-full"
                        disabled={
                          !newIssuanceWallet.address || !newIssuanceWallet.label
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Wallet
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Whitelist Controls Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Whitelist Controls</CardTitle>
              <CardDescription>
                Configure whitelist settings to control which addresses can
                interact with your SPV
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-6">
                <Switch
                  id="whitelist-toggle"
                  checked={whitelist.enabled}
                  onCheckedChange={(checked) => toggleWhitelist()}
                />
                <Label htmlFor="whitelist-toggle">
                  {whitelist.enabled
                    ? "Whitelist Enabled"
                    : "Whitelist Disabled"}
                </Label>
              </div>

              {whitelist.enabled && (
                <>
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Only whitelisted addresses will be able to interact with
                      your SPV when whitelist is enabled.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="new-whitelist-address">
                        Add Address to Whitelist
                      </Label>
                      <div className="flex mt-1">
                        <Input
                          id="new-whitelist-address"
                          placeholder="0x..."
                          value={newWhitelistAddress}
                          onChange={(e) =>
                            setNewWhitelistAddress(e.target.value)
                          }
                          className="flex-1 mr-2"
                        />
                        <Button
                          onClick={addWhitelistAddress}
                          disabled={!newWhitelistAddress}
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Whitelisted Addresses ({whitelist.addresses.length})
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {whitelist.addresses.length > 0 ? (
                          whitelist.addresses.map((address, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 border rounded-md"
                            >
                              <span className="text-sm truncate max-w-[80%]">
                                {address}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeWhitelistAddress(address)}
                                aria-label="Remove address"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            No addresses added to whitelist
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">
                <Check className="h-4 w-4 mr-2" /> Save Wallet Configuration
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
};

export default WalletSection;
