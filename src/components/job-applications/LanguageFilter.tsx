import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface LanguageFilterProps {
  allLanguages: string[];
  selectedLanguages: string[];
  onLanguagesChange: (languages: string[]) => void;
}

export function LanguageFilter({ 
  allLanguages, 
  selectedLanguages, 
  onLanguagesChange 
}: LanguageFilterProps) {
  const [open, setOpen] = useState(false);

  const toggleLanguage = (language: string) => {
    if (selectedLanguages.includes(language)) {
      onLanguagesChange(selectedLanguages.filter(l => l !== language));
    } else {
      onLanguagesChange([...selectedLanguages, language]);
    }
  };

  const clearAll = () => {
    onLanguagesChange([]);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            {selectedLanguages.length > 0
              ? `${selectedLanguages.length} language${selectedLanguages.length > 1 ? 's' : ''}`
              : "Filter by language"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0 bg-popover z-50">
          <Command>
            <CommandInput placeholder="Search language..." />
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {allLanguages.map((language) => (
                <CommandItem
                  key={language}
                  value={language}
                  onSelect={() => toggleLanguage(language)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedLanguages.includes(language) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {language}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedLanguages.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {selectedLanguages.map((language) => (
            <Badge key={language} variant="secondary" className="gap-1">
              {language}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => toggleLanguage(language)}
              />
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-6 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
