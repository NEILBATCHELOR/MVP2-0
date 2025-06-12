import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { cn } from "@/utils";
import {
  BarChart3,
  Users,
  Layers,
  Home,
  PieChart,
  ShieldCheck,
  UserRoundCog,
  Scale,
  WalletCards,
  FileStackIcon,
  UserRoundPlus,
  Landmark,
  Activity,
  Wallet,
  KeyRound,
  Coins,
  LayoutDashboard,
  Fingerprint,
  CreditCard,
  Shield,
  FileText,
  Plus,
  CheckCircle,
  LogOut,
  FileCog,
  Building,
  Layout,
  CheckSquare,
  ShieldAlert,
  History,
  Settings,
  BarChart,
  Menu,
  Package,
  ShoppingCart,
  ArrowLeftRight,
  DollarSign,
  UserCircle,
  Grid2x2Check,
  Combine,
  Blocks,
  ChartCandlestick,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/infrastructure/database/client";
import { sessionManager } from "@/infrastructure/sessionManager";
import { Loader2 } from "lucide-react";
import { AccordionItem, AccordionTrigger, AccordionContent, Accordion } from "@/components/ui/accordion";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
}

interface UserInfo {
  name: string;
  email: string;
}

const SidebarItem = ({ icon, label, href }: SidebarItemProps) => {
  const location = useLocation();
  // Check if the current path starts with the href to ensure only one item is active
  const isActive =
    location.pathname === href ||
    (href !== "/" && location.pathname.startsWith(href + "/"));

  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-primary/10",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground",
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

const Sidebar = () => {
  const { projectId } = useParams();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      setSelectedProject(projectId);
    }

    // Create a cache key for user info
    const cacheKey = 'user_info_cache';
    
    const fetchUserInfoWithCache = async () => {
      // First check if we have cached user info
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const { userInfo: cachedUserInfo, timestamp } = JSON.parse(cachedData);
          const cacheAge = Date.now() - timestamp;
          
          // Use cache if it's less than 30 minutes old
          if (cacheAge < 30 * 60 * 1000 && cachedUserInfo) {
            console.log('Using cached user info');
            setUserInfo(cachedUserInfo);
            setIsLoading(false);
            
            // Refresh in background to keep cache fresh
            fetchUserInfo(true);
            return;
          }
        } catch (e) {
          console.warn('Error parsing cached user info:', e);
          // Cache error, continue to fetch fresh data
        }
      }
      
      // No valid cache, fetch fresh data
      fetchUserInfo(false);
    };
    
    fetchUserInfoWithCache();
  }, []);

  const fetchUserInfo = async (isBackgroundFetch = false) => {
    if (!isBackgroundFetch) {
      setIsLoading(true);
    }
    
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No active session');
        if (!isBackgroundFetch) {
          setIsLoading(false);
        }
        return null;
      }

      // Get user info from users table with a short timeout
      const { data: userData, error } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user info:', error);
        if (!isBackgroundFetch) {
          setIsLoading(false);
        }
        return null;
      }

      if (userData) {
        const userInfoData = {
          name: userData.name,
          email: userData.email
        };
        
        if (!isBackgroundFetch) {
          setUserInfo(userInfoData);
        }
        
        // Cache the user info
        sessionStorage.setItem('user_info_cache', JSON.stringify({
          userInfo: userInfoData,
          timestamp: Date.now()
        }));
        
        return userInfoData;
      }
      
      return null;
    } catch (error) {
      console.error('Error in fetchUserInfo:', error);
      return null;
    } finally {
      if (!isBackgroundFetch) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
      <div className="flex h-full flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold">Chain Capital</h2>
          <p className="text-xs text-muted-foreground">Tokenization Platform</p>
        </div>
        <ScrollArea className="flex-1 px-4">       
          <div className="space-y-6">
          <div>
              <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground">
                ONBOARDING
              </h3>
              <div className="space-y-1">
              <SidebarItem
                  icon={<UserRoundPlus className="h-4 w-4" />}
                  label="Investor Onboarding"
                  href="/compliance/investor-onboarding/registration"
                />
                <SidebarItem
                  icon={<Landmark className="h-4 w-4" />}
                  label="Issuer Onboarding"
                  href="/compliance/issuer/onboarding/registration"
                />
              </div>
            </div>
            <div>
              <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground">
                OVERVIEW
              </h3>
              <div className="space-y-1">
                <SidebarItem
                  icon={<Home className="h-4 w-4" />}
                  label="Dashboard"
                  href="/dashboard"
                />
                <SidebarItem
                  icon={<Layers className="h-4 w-4" />}
                  label="Projects"
                  href="/projects"
                />
              </div>
            </div>
            <div>
              <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground">
                ISSUANCE
              </h3>
              <div className="space-y-1">
                <SidebarItem
                  icon={<Blocks className="h-4 w-4" />}
                  label="Token Management"
                  href={`/projects/${projectId}/tokens`}
                />
                <SidebarItem
                  icon={<Grid2x2Check className="h-4 w-4" />}
                  label="Cap Table"
                  href={`/projects/${projectId}/captable/investors`}
                />
                <SidebarItem
                  icon={<WalletCards className="h-4 w-4" />}
                  label="Redemptions"
                  href="/redemption"
                />
              </div>
            </div>

            <div>
              <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground">
                FACTORING
              </h3>
              <div className="space-y-1">
                <SidebarItem
                  icon={<LayoutDashboard className="h-4 w-4" />}
                  label="Factoring Dashboard"
                  href={projectId ? `/projects/${projectId}/factoring/dashboard` : "/factoring/dashboard"}
                />
                <SidebarItem
                  icon={<FileText className="h-4 w-4" />}
                  label="Invoices"
                  href={projectId ? `/projects/${projectId}/factoring/invoices` : "/factoring/invoices"}
                />
                <SidebarItem
                  icon={<Package className="h-4 w-4" />}
                  label="Pools & Tranches"
                  href={projectId ? `/projects/${projectId}/factoring/pools` : "/factoring/pools"}
                />
                <SidebarItem
                  icon={<Combine className="h-4 w-4" />}
                  label="Tokenize Pools"
                  href={projectId ? `/projects/${projectId}/factoring/tokenization` : "/factoring/tokenization"}
                />
                <SidebarItem
                  icon={<Users className="h-4 w-4" />}
                  label="Distribution"
                  href={projectId ? `/projects/${projectId}/factoring/distribution` : "/factoring/distribution"}
                />
              </div>
            </div>

            <div>
              <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground">
                WALLET MANAGEMENT
              </h3>
              <div className="space-y-1">
                <SidebarItem
                  icon={<LayoutDashboard className="h-4 w-4" />}
                  label="Wallet Dashboard"
                  href="/wallet/dashboard"
                />
                <SidebarItem
                  icon={<Plus className="h-4 w-4" />}
                  label="New Wallet"
                  href="/wallet/new"
                />
                <SidebarItem
                  icon={<ArrowLeftRight className="h-4 w-4" />}
                  label="Transfer Assets"
                  href="/wallet/transfer"
                />
                <SidebarItem
                  icon={<  ChartCandlestick className="h-4 w-4" />}
                  label="Swap Tokens"
                  href="/wallet/swap"
                />
                <SidebarItem
                  icon={<Shield className="h-4 w-4" />}
                  label="DFNS Custody"
                  href="/wallet/dfns"
                />
              </div>
            </div>
            <div>
              <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground">
                COMPLIANCE
              </h3>
              <div className="space-y-1">
                <SidebarItem
                  icon={<LayoutDashboard className="h-4 w-4" />}
                  label="Compliance Dashboard"
                  href="/compliance/operations/dashboard"
                />
                <SidebarItem
                  icon={<Wallet className="h-4 w-4" />}
                  label="Wallet Operations"
                  href="/compliance/operations/investor/wallets"
                />
                <SidebarItem
                  icon={<Scale className="h-4 w-4" />}
                  label="Compliance Rules"
                  href="/compliance/rules"
                />
                <SidebarItem
                  icon={<Shield className="h-4 w-4" />}
                  label="Restrictions"
                  href="/compliance/restrictions"
                />
              </div>
            </div>
             {/* Simple Investor Portal link */}
             <div>
              <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground">
                INVESTOR PORTAL
              </h3>
              <div className="space-y-1">
				<SidebarItem
                  icon={<ChartCandlestick className="h-4 w-4" />}
                  label="Offerings"
                  href="/offerings"
                />
                <SidebarItem
                  icon={<UserCircle className="h-4 w-4" />}
                  label="Profile"
                  href="/compliance/portal/profile"
                />
                <SidebarItem
                  icon={<FileText className="h-4 w-4" />}
                  label="Documents"
                  href="/compliance/portal/documents"
                />
              </div>
            </div>
            <div>
              <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground">
                ADMINISTRATION
              </h3>
              <div className="space-y-1">
                <SidebarItem
                  icon={<UserRoundCog className="h-4 w-4" />}
                  label="Roles"
                  href="/role-management"
                />
                <SidebarItem
                  icon={<Activity className="h-4 w-4" />}
                  label="Activity Monitor"
                  href="/activity"
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="text-lg font-semibold text-primary">
                  {userInfo?.name?.charAt(0) || '?'}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
                </div>
              ) : userInfo ? (
                <>
                  <p className="truncate text-sm font-medium">{userInfo.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{userInfo.email}</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">Guest User</p>
                  <p className="text-xs text-muted-foreground">Not signed in</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-auto p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={async () => {
              // Clear local storage
              localStorage.clear();
              // Clear session storage
              sessionStorage.clear();
              // Clear Supabase session
              await supabase.auth.signOut();
              // Clear session in database
              await sessionManager.clearAllSessions();
              // Redirect to welcome screen
              window.location.href = '/';
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
