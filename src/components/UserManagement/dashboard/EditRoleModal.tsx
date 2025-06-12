import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/infrastructure/database/client";
import { useToast } from "@/components/ui/use-toast";
import { Role } from "@/utils/auth/roleUtils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  priority: z.number().int().positive("Priority must be a positive number"),
});

type FormValues = z.infer<typeof formSchema>;

interface EditRoleModalProps {
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleUpdated: () => void;
}

const EditRoleModal = ({ role, open, onOpenChange, onRoleUpdated }: EditRoleModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSystemRole, setIsSystemRole] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      priority: 10,
    },
  });

  // Update form values when role changes
  useEffect(() => {
    if (role) {
      form.reset({
        name: role.name,
        description: role.description,
        priority: role.priority,
      });
      
      // Check if it's a standard system role based on name
      setIsSystemRole(role.name === "Super Admin" || 
                     role.name === "Owner" || 
                     role.name === "Compliance Manager" || 
                     role.name === "Compliance Officer" || 
                     role.name === "Agent" || 
                     role.name === "Viewer");
    }
  }, [role, form]);

  const handleSubmit = async (values: FormValues) => {
    if (!role) return;
    
    setIsSubmitting(true);
    try {
      // Check if another role with the same name already exists
      if (values.name !== role.name) {
        const { data: existingRole, error: checkError } = await supabase
          .from("roles")
          .select("name")
          .ilike("name", values.name)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existingRole) {
          form.setError("name", { 
            message: "A role with this name already exists" 
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Update the role
      const { error } = await supabase
        .from("roles")
        .update({
          name: values.name,
          description: values.description,
          priority: values.priority,
          updated_at: new Date().toISOString(),
        })
        .eq("id", role.id);

      if (error) throw error;

      toast({
        title: "Role updated",
        description: `Role "${values.name}" has been updated successfully.`,
      });

      // Close modal and refresh roles
      onOpenChange(false);
      onRoleUpdated();
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast({
        title: "Error updating role",
        description: error.message || "An error occurred while updating the role",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Role: {role.name}</DialogTitle>
        </DialogHeader>

        {isSystemRole && (
          <Alert variant="default" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This is a system role. Editing it may affect system functionality.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
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
};

export default EditRoleModal;