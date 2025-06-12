import React, { useState } from "react";
import { useIssuerOnboarding } from "./IssuerOnboardingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/utils";
import { Trash2, UserPlus, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ContactPersonnel {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isPrimaryContact: boolean;
}

const ROLES = [
  { value: "director", label: "Director" },
  { value: "officer", label: "Officer" },
  { value: "authorized_representative", label: "Authorized Representative" },
  { value: "legal_counsel", label: "Legal Counsel" },
  { value: "compliance_officer", label: "Compliance Officer" },
  { value: "administrator", label: "Administrator" },
];

const ContactPersonnel: React.FC = () => {
  const { state, updateContactPersonnel, nextStep, prevStep, isDevelopmentMode } = useIssuerOnboarding();
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});

  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const addContactPerson = () => {
    const newContact: ContactPersonnel = {
      id: generateId(),
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "",
      isPrimaryContact: state.contactPersonnel.length === 0,
    };
    
    updateContactPersonnel([...state.contactPersonnel, newContact]);
  };

  const removeContactPerson = (id: string) => {
    const updatedContacts = state.contactPersonnel.filter(
      (contact) => contact.id !== id
    );

    // If we're removing the primary contact, make the first contact in the list the primary one
    if (updatedContacts.length > 0) {
      const wasPrimary = state.contactPersonnel.find(
        (contact) => contact.id === id
      )?.isPrimaryContact;
      
      if (wasPrimary) {
        updatedContacts[0].isPrimaryContact = true;
      }
    }

    updateContactPersonnel(updatedContacts);
    
    // Remove errors for this contact
    if (errors[id]) {
      const newErrors = { ...errors };
      delete newErrors[id];
      setErrors(newErrors);
    }
  };

  const setPrimaryContact = (id: string) => {
    const updatedContacts = state.contactPersonnel.map((contact) => ({
      ...contact,
      isPrimaryContact: contact.id === id,
    }));
    
    updateContactPersonnel(updatedContacts);
  };

  const handleChange = (id: string, field: string, value: string) => {
    const updatedContacts = state.contactPersonnel.map((contact) =>
      contact.id === id ? { ...contact, [field]: value } : contact
    );
    
    updateContactPersonnel(updatedContacts);
    
    // Clear error when field is updated
    if (errors[id]?.[field]) {
      setErrors({
        ...errors,
        [id]: {
          ...errors[id],
          [field]: "",
        },
      });
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    // Basic phone validation - adjust as needed for your requirements
    return phone.length >= 10;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Skip validation in development mode
    if (isDevelopmentMode) {
      if (state.contactPersonnel.length === 0) {
        // Add a default contact person
        const defaultContact: ContactPersonnel = {
          id: generateId(),
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          phone: "+1 (555) 123-4567",
          role: "director",
          isPrimaryContact: true,
        };
        
        updateContactPersonnel([defaultContact]);
      }
      
      nextStep();
      return;
    }
    
    // Form validation
    const newErrors: Record<string, Record<string, string>> = {};
    let hasErrors = false;
    
    // Ensure at least one contact is added
    if (state.contactPersonnel.length === 0) {
      // Display a general error message
      alert("Please add at least one contact person");
      return;
    }
    
    state.contactPersonnel.forEach((contact) => {
      const contactErrors: Record<string, string> = {};
      
      if (!contact.firstName) {
        contactErrors.firstName = "First name is required";
        hasErrors = true;
      }
      
      if (!contact.lastName) {
        contactErrors.lastName = "Last name is required";
        hasErrors = true;
      }
      
      if (!contact.email) {
        contactErrors.email = "Email is required";
        hasErrors = true;
      } else if (!validateEmail(contact.email)) {
        contactErrors.email = "Please enter a valid email address";
        hasErrors = true;
      }
      
      if (!contact.phone) {
        contactErrors.phone = "Phone number is required";
        hasErrors = true;
      } else if (!validatePhone(contact.phone)) {
        contactErrors.phone = "Please enter a valid phone number";
        hasErrors = true;
      }
      
      if (!contact.role) {
        contactErrors.role = "Role is required";
        hasErrors = true;
      }
      
      if (Object.keys(contactErrors).length > 0) {
        newErrors[contact.id] = contactErrors;
      }
    });
    
    // Ensure at least one primary contact is set
    const hasPrimaryContact = state.contactPersonnel.some(
      (contact) => contact.isPrimaryContact
    );
    
    if (!hasPrimaryContact && state.contactPersonnel.length > 0) {
      // Automatically set the first contact as primary
      const updatedContacts = [...state.contactPersonnel];
      updatedContacts[0].isPrimaryContact = true;
      updateContactPersonnel(updatedContacts);
    }
    
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }
    
    // If validation passes, proceed to next step
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-1">Contact Personnel</h2>
          <p className="text-gray-500 text-sm mb-4">
            Add details for key personnel who will manage your organization's account
          </p>
          
          {state.contactPersonnel.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-gray-50">
              <p className="text-gray-500 mb-4">No contacts added yet</p>
              <Button 
                type="button" 
                variant="outline" 
                onClick={addContactPerson}
                className="flex items-center gap-2"
              >
                <UserPlus size={16} />
                Add Contact Person
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {state.contactPersonnel.map((contact) => (
                <Card key={contact.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-base">
                          {contact.firstName || contact.lastName 
                            ? `${contact.firstName} ${contact.lastName}` 
                            : "New Contact"}
                        </CardTitle>
                        <CardDescription>
                          {contact.role ? ROLES.find(r => r.value === contact.role)?.label : "No role assigned"}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {contact.isPrimaryContact && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            Primary Contact
                          </span>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContactPerson(contact.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                          <span className="sr-only">Remove contact</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`${contact.id}-firstName`} className="text-sm font-medium mb-1 block">
                          First Name
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id={`${contact.id}-firstName`}
                          value={contact.firstName}
                          onChange={(e) => handleChange(contact.id, "firstName", e.target.value)}
                          className={cn(errors[contact.id]?.firstName && "border-red-500")}
                        />
                        {errors[contact.id]?.firstName && (
                          <p className="text-red-500 text-xs mt-1">{errors[contact.id]?.firstName}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor={`${contact.id}-lastName`} className="text-sm font-medium mb-1 block">
                          Last Name
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id={`${contact.id}-lastName`}
                          value={contact.lastName}
                          onChange={(e) => handleChange(contact.id, "lastName", e.target.value)}
                          className={cn(errors[contact.id]?.lastName && "border-red-500")}
                        />
                        {errors[contact.id]?.lastName && (
                          <p className="text-red-500 text-xs mt-1">{errors[contact.id]?.lastName}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor={`${contact.id}-email`} className="text-sm font-medium mb-1 block">
                          Email Address
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id={`${contact.id}-email`}
                          type="email"
                          value={contact.email}
                          onChange={(e) => handleChange(contact.id, "email", e.target.value)}
                          className={cn(errors[contact.id]?.email && "border-red-500")}
                        />
                        {errors[contact.id]?.email && (
                          <p className="text-red-500 text-xs mt-1">{errors[contact.id]?.email}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor={`${contact.id}-phone`} className="text-sm font-medium mb-1 block">
                          Phone Number
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id={`${contact.id}-phone`}
                          value={contact.phone}
                          onChange={(e) => handleChange(contact.id, "phone", e.target.value)}
                          className={cn(errors[contact.id]?.phone && "border-red-500")}
                        />
                        {errors[contact.id]?.phone && (
                          <p className="text-red-500 text-xs mt-1">{errors[contact.id]?.phone}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor={`${contact.id}-role`} className="text-sm font-medium mb-1 block">
                          Role
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Select
                          value={contact.role}
                          onValueChange={(value) => handleChange(contact.id, "role", value)}
                        >
                          <SelectTrigger id={`${contact.id}-role`} className={cn(errors[contact.id]?.role && "border-red-500")}>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors[contact.id]?.role && (
                          <p className="text-red-500 text-xs mt-1">{errors[contact.id]?.role}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center">
                        {!contact.isPrimaryContact && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPrimaryContact(contact.id)}
                            className="mt-6 text-xs h-8"
                          >
                            Set as Primary Contact
                          </Button>
                        )}
                        
                        {contact.isPrimaryContact && (
                          <div className="mt-6 flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertCircle size={16} className="text-blue-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs w-60">Primary contacts are responsible for managing your organization's account and will receive important updates and notifications.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <span className="text-xs text-blue-500">This person will be the main point of contact</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addContactPerson}
                className="w-full py-6 border-dashed flex items-center justify-center gap-2"
              >
                <UserPlus size={16} />
                Add Another Contact
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={prevStep} type="button" className="border border-gray-300">
            Back
          </Button>
          <Button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white px-6">
            {isDevelopmentMode ? "Skip to Next Step" : "Continue"}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ContactPersonnel; 