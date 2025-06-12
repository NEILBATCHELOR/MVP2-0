import React, { useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Settings2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

interface TransferGasSettingsProps {
  form: UseFormReturn<any>;
}

export const TransferGasSettings: React.FC<TransferGasSettingsProps> = ({ form }) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [customGasPrice, setCustomGasPrice] = useState("25");
  const [customGasLimit, setCustomGasLimit] = useState("21000");
  
  // Gas price options
  const gasPriceOptions = [
    { value: "slow", label: "Slow", price: "15", time: "10-15 mins", usd: "$2.70" },
    { value: "standard", label: "Standard", price: "25", time: "3-5 mins", usd: "$4.50" },
    { value: "fast", label: "Fast", price: "35", time: "1-2 mins", usd: "$6.30" },
  ];
  
  return (
    <div className="border rounded-lg p-4">
      <FormField
        control={form.control}
        name="gasOption"
        render={({ field }) => (
          <FormItem>
            <div className="flex justify-between items-center mb-4">
              <FormLabel>Gas Fee (Transaction Speed)</FormLabel>
              <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 h-8 text-xs">
                    <Settings2 className="h-3 w-3" />
                    {isAdvancedOpen ? "Basic" : "Advanced"} 
                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isAdvancedOpen ? "rotate-180" : ""}`} />
                  </Button>
                </CollapsibleTrigger>
            
                <CollapsibleContent className="mt-4 space-y-4 absolute left-0 right-0 bg-background border rounded-md p-4 shadow-md z-10">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Gas Price (GWEI)</Label>
                      <span className="text-sm font-medium">{customGasPrice} GWEI</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Slider 
                        value={[parseInt(customGasPrice)]} 
                        min={5} 
                        max={100}
                        step={1}
                        onValueChange={(value) => setCustomGasPrice(value[0].toString())}
                        className="flex-1"
                      />
                      <Input 
                        type="number" 
                        value={customGasPrice}
                        onChange={(e) => setCustomGasPrice(e.target.value)}
                        className="w-20"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Gas Limit</Label>
                    </div>
                    <Input 
                      type="number" 
                      value={customGasLimit}
                      onChange={(e) => setCustomGasLimit(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Default is 21000 for simple ETH transfers. Complex contract interactions may require more.
                    </p>
                  </div>
                  
                  <div className="bg-muted p-3 rounded-md">
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="text-muted-foreground">Max Fee</span>
                      <span>{(parseInt(customGasPrice) * parseInt(customGasLimit) / 1e9).toFixed(6)} ETH</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Max Fee (USD)</span>
                      <span>${(parseInt(customGasPrice) * parseInt(customGasLimit) / 1e9 * 3554.10).toFixed(2)}</span>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
            
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-col space-y-2"
              >
                {gasPriceOptions.map((option) => (
                  <div 
                    key={option.value}
                    className={`flex items-center justify-between rounded-md border p-3 cursor-pointer hover:bg-muted/50 ${
                      field.value === option.value ? "border-primary bg-muted/50" : ""
                    }`}
                    onClick={() => form.setValue("gasOption", option.value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="cursor-pointer">
                        <div>
                          <span className="font-medium">{option.label}</span>
                          <p className="text-xs text-muted-foreground">{option.time}</p>
                        </div>
                      </Label>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{option.price} GWEI</span>
                      <p className="text-xs text-muted-foreground">{option.usd}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            
            <FormDescription className="mt-2">
              Gas fees are paid to network validators to process your transaction.
              Higher fees mean faster processing.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};