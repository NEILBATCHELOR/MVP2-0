import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Role, getAllRoles, formatRoleForDisplay } from "@/utils/auth/roleUtils";
import { authService, UserStatus } from "@/components/auth/services/authService";
import { User } from "@/types/domain/user/user";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface EditUserModalProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: (user: User) => void;
}

type UserStatusType = "active" | "inactive" | "pending" | "blocked";

const formSchema = z.object({
  email: z.string().email("Valid email address is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  roleId: z.string().min(1, "Role must be selected"),
  status: z.enum(["active", "inactive", "pending", "blocked"], {
    required_error: "Please select a status",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function EditUserModal({ user, open, onOpenChange, onUserUpdated }: EditUserModalProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: user.email || "",
      name: user.profile?.name || "",
      roleId: user.role?.id || "",
      status: (user.profile?.status as UserStatusType) || "active",
    },
  });

  useEffect(() => {
    if (open) {
      fetchRoles();
      form.reset({
        email: user.email || "",
        name: user.profile?.name || "",
        roleId: user.role?.id || "",
        status: (user.profile?.status as UserStatusType) || "active",
      });
    }
  }, [open, user, form]);

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
      // Convert string status to UserStatus enum
      let statusEnum: UserStatus;
      switch(values.status) {
        case "active":
          statusEnum = UserStatus.ACTIVE;
          break;
        case "inactive":
          statusEnum = UserStatus.INACTIVE;
          break;
        case "pending":
          statusEnum = UserStatus.PENDING;
          break;
        case "blocked":
          statusEnum = UserStatus.SUSPENDED; // Map "blocked" to "SUSPENDED"
          break;
        default:
          statusEnum = UserStatus.ACTIVE;
      }

      const updatedUserData = await authService.updateUser(user.id, {
        email: values.email,
        data: {
          name: values.name,
          roleId: values.roleId,
        },
        status: statusEnum,
      });
      
      if (updatedUserData) {
        toast({
          title: "Success",
          description: "User updated successfully",
        });
        
        // Find the matching role in our roles array
        const matchingRole = roles.find(r => r.id === values.roleId);
        
        // Create a properly typed user object with the correct role structure
        const convertedUser: User = {
          ...user,
          email: values.email,
          profile: user.profile ? {
            ...user.profile,
            name: values.name,
            status: values.status as any, // Use type assertion to avoid type conflicts
          } : undefined,
          role: matchingRole || user.role
        };
        
        onUserUpdated(convertedUser);
        onOpenChange(false);
      } else {
        throw new Error("Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user",
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
          <DialogTitle>Edit User</DialogTitle>
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
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="active" id="active" />
                        <Label htmlFor="active">Active</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="inactive" id="inactive" />
                        <Label htmlFor="inactive">Inactive</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pending" id="pending" />
                        <Label htmlFor="pending">Pending</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="blocked" id="blocked" />
                        <Label htmlFor="blocked">Blocked</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
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
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default EditUserModal;