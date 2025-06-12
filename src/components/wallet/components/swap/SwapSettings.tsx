import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SwapFormValues } from "./types";

interface SwapSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  form: UseFormReturn<SwapFormValues>;
}

export const SwapSettings: React.FC<SwapSettingsProps> = ({
  isOpen,
  onClose,
  form,
}) => {
  const handleApply = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Swap Settings</DialogTitle>
          <DialogDescription>
            Configure your swap preferences and transaction settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          <FormField
            control={form.control}
            name="slippage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slippage Tolerance</FormLabel>
                <div className="flex items-center gap-4">
                  <FormControl>
                    <Slider
                      min={0.1}
                      max={5}
                      step={0.1}
                      value={[parseFloat(field.value)]}
                      onValueChange={(values) => field.onChange(values[0].toString())}
                      className="flex-1"
                    />
                  </FormControl>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-20"
                        min={0.1}
                        max={50}
                        step={0.1}
                      />
                    </FormControl>
                    <span>%</span>
                  </div>
                </div>
                <FormDescription>
                  Your transaction will revert if the price changes unfavorably by more than this percentage.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction Deadline</FormLabel>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="w-20"
                      min={1}
                      step={1}
                    />
                  </FormControl>
                  <span>minutes</span>
                </div>
                <FormDescription>
                  Your transaction will revert if it is pending for more than this long.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="autoRouter"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Auto Router</FormLabel>
                  <FormDescription>
                    Automatically finds the best route for your swap.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              form.setValue("slippage", "0.5");
              form.setValue("deadline", 20);
              form.setValue("autoRouter", true);
            }}
          >
            Reset to Default
          </Button>
          <Button onClick={handleApply}>Apply Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 