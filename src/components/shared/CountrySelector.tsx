import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { regionCountries, getAllCountries } from "@/utils/compliance/countries";
import { Search } from "lucide-react";

interface CountrySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  id?: string;
  className?: string;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onValueChange,
  label = "Country",
  placeholder = "Select a country",
  error,
  required = false,
  id = "country",
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const allCountries = getAllCountries();

  // Filter regions and countries based on search query
  const filteredRegions = regionCountries
    .map((region) => ({
      ...region,
      countries: region.countries.filter((country) =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((region) => region.countries.length > 0);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id} className="mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className={error ? "border-red-500" : ""}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          <div className="px-2 py-2 sticky top-0 bg-white z-10 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search countries..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-8"
              />
            </div>
          </div>

          {searchQuery && filteredRegions.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No countries found
            </div>
          ) : (
            filteredRegions.map((region) => (
              <SelectGroup key={region.id}>
                <SelectLabel>{region.name}</SelectLabel>
                {region.countries.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))
          )}
        </SelectContent>
      </Select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default CountrySelector;
