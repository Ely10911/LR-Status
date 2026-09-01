import { Plus, Trash2, User2 } from "lucide-react";

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
import type { AdditionalAuthor } from "@/lib/lr";
import { SCHOOLS_BY_SUB_OFFICE, SUB_OFFICES } from "@/lib/schools";

interface AdditionalAuthorsSectionProps {
  authors: AdditionalAuthor[];
  onChange: (authors: AdditionalAuthor[]) => void;
}

/**
 * Admin-managed list of co-authors (name, sub-office, school) for a resource.
 * Each author's school dropdown cascades from their own sub-office selection.
 */
export function AdditionalAuthorsSection({ authors, onChange }: AdditionalAuthorsSectionProps) {
  const addAuthor = () => {
    onChange([...authors, { name: "", subOffice: "", school: "" }]);
  };

  const removeAuthor = (index: number) => {
    onChange(authors.filter((_, i) => i !== index));
  };

  const updateAuthor = (index: number, patch: Partial<AdditionalAuthor>) => {
    onChange(authors.map((author, i) => (i === index ? { ...author, ...patch } : author)));
  };

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <User2 className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-semibold">Additional Authors</Label>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={addAuthor}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Author
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Optional co-writers credited on this resource.
      </p>

      {authors.length === 0 ? (
        <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
          No additional authors added.
        </p>
      ) : (
        <div className="space-y-3">
          {authors.map((author, index) => (
            <div key={index} className="space-y-2 rounded-md border bg-card p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Author {index + 1}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeAuthor(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Author Name</Label>
                <Input
                  value={author.name}
                  onChange={(e) => updateAuthor(index, { name: e.target.value })}
                  placeholder="e.g. Juan A. Dela Cruz"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Sub-Office / Unit</Label>
                <Select
                  value={author.subOffice || undefined}
                  onValueChange={(value) =>
                    updateAuthor(index, { subOffice: value, school: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub-office" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUB_OFFICES.map((office) => (
                      <SelectItem key={office} value={office}>
                        {office}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">School</Label>
                <Select
                  value={author.school || undefined}
                  onValueChange={(value) => updateAuthor(index, { school: value })}
                  disabled={!author.subOffice}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        author.subOffice ? "Select school" : "Select a sub-office first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(SCHOOLS_BY_SUB_OFFICE[author.subOffice] ?? []).map((school) => (
                      <SelectItem key={school} value={school}>
                        {school}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
