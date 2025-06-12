import React, { useEffect, useState } from "react";
import { useAuth } from "@/infrastructure/auth/AuthProvider";
import { supabase } from "@/infrastructure/database/client";
import { getRoleDisplayName } from "@/utils/auth/roleNormalizer";

const Header = () => {
  const { user } = useAuth();
  const [displayRole, setDisplayRole] = useState<string>("");

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select(`
          roles (
            name
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (roleData?.roles?.name) {
        setDisplayRole(getRoleDisplayName(roleData.roles.name));
      }
    };

    fetchUserRole();
  }, [user]);

  return (
    <header className="w-full bg-white border-b px-4 py-3 sticky top-0 z-10">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Unlock Institutional Liquidity</h1>
        <div className="flex items-center gap-4">
          {user && (
            <div className="text-sm text-muted-foreground">
              Welcome, {user.user_metadata?.name || user.email}
              {displayRole && <span className="ml-1">({displayRole})</span>}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
