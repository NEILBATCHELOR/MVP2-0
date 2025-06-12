import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getAllRoles, formatRoleForDisplay, Role } from "@/utils/auth/roleUtils";
import { authService } from "@/services/auth";
import { User } from "@/types/domain/user/user";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: (user: User) => void;
}

const formSchema = z.object({
  email: z.string().email("Valid email address is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  roleId: z.string().min(1, "Role must be selected"),
  password: z.string().optional(),
  autoGeneratePassword: z.boolean().default(true),
  sendInviteEmail: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export function AddUserModal({ open, onOpenChange, onUserCreated }: AddUserModalProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      name: "",
      roleId: "",
      password: "",
      autoGeneratePassword: true,
      sendInviteEmail: true,
    },
  });

  useEffect(() => {
    if (open) {
      fetchRoles();
      form.reset({
        email: "",
        name: "",
        roleId: "",
        password: "",
        autoGeneratePassword: true,
        sendInviteEmail: true,
      });
    }
  }, [open, form]);

  const fetchRoles = async () => {
    try {
      setIsLoadingRoles(true);
      const rolesData = await getAllRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({
        title: "Error",
        description: "Failed to load roles",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Generate a random password if needed
      let password = values.password;
      if (values.autoGeneratePassword) {
        // Generate a secure random password (at least 8 chars with mix of letters, numbers, special chars)
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
        password = Array(12).fill(0).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
      }

      const newUserData = await authService.createUser({
        email: values.email,
        name: values.name,
        roleId: values.roleId,
        password: password || 'Temp123!', // Fallback to ensure a valid password
        sendInvite: values.sendInviteEmail
      });

      if (newUserData) {
        toast({
          title: "Success",
          description: values.sendInviteEmail 
            ? "User created and invitation sent"
            : "User created successfully",
        });
        
        // Find the matching role in our roles array
        const matchingRole = roles.find(r => r.id === values.roleId);
        
        // Create a properly typed user object with the correct role structure
        const convertedUser: User = {
          id: newUserData.id,
          email: values.email,
          // Create a profile object from the available data
          profile: {
            id: newUserData.id,
            name: values.name,
            email: values.email,
            status: "active" as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          // Use the role data we already have from our roles array
          role: matchingRole || {
            id: values.roleId,
            name: roles.find(r => r.id === values.roleId)?.name || "Unknown",
            description: "",
            priority: 0
          }
        };
        
        onUserCreated(convertedUser);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingRoles ? (
                        <SelectItem value="loading" disabled>
                          Loading roles...
                        </SelectItem>
                      ) : roles.length > 0 ? (
                        roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {formatRoleForDisplay(role.name)}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem key="superAdmin" value="superAdmin">Super Admin</SelectItem>
                          <SelectItem key="owner" value="owner">Owner</SelectItem>
                          <SelectItem key="complianceManager" value="complianceManager">Compliance Manager</SelectItem>
                          <SelectItem key="complianceOfficer" value="complianceOfficer">Compliance Officer</SelectItem>
                          <SelectItem key="agent" value="agent">Agent</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="autoGeneratePassword"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Auto-generate Password</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Automatically generate a secure password
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {!form.watch("autoGeneratePassword") && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="sendInviteEmail"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Send Invitation Email</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Send an email invitation to the user
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default AddUserModal;